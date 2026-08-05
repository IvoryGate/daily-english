"""AI 对话：工具循环 + SSE 事件流。

流程：发起请求 → 若模型请求工具则执行 → 回填结果继续 → 直到模型直接回答。
支持流式（先输出文字，工具调用在途中触发）。
"""

from __future__ import annotations

import json
from typing import Any, Iterator

from sqlalchemy.orm import Session

from app.ai.client import chat_completion, stream_chat_completion
from app.ai.providers import ModelSource, resolve_model_source
from app.ai.tools import execute_tool, tool_definitions
from app.models import User

SYSTEM_PROMPT = """你是一个集成在 DailyEnglish 英语学习网站里的 AI 学习助手。

你的职责：
- 用中文回复（除非用户要求英文），帮助用户学习英语
- 解释单词、语法、句子、段落、整篇文章
- 提供例句、同义词、文化背景
- 可以联网搜索补充信息
- 可以根据用户要求把学习要点保存为笔记（save_note）
- 需要参考站内数据（文章、生词、学习统计）时使用对应工具

工具使用规范：
- 需要查文章内容时用 get_article
- 需要解释单词时优先用 lookup_word（返回中文释义+音标）
- 用户要求保存笔记时用 save_note
- 回答尽量简洁、结构化，善用换行和列表
"""

MAX_TOOL_ROUNDS = 4


def run_chat(
    messages: list[dict[str, Any]],
    db: Session,
    user: User | None,
    source: ModelSource | None = None,
    stream: bool = True,
) -> Iterator[dict[str, Any]]:
    """执行一轮或多轮对话，产出事件：
    - {"type": "tool", "name": ..., "args": ..., "result": ...}  工具调用
    - {"type": "content", "text": ...}                            文本增量
    - {"type": "done"}                                            结束
    - {"type": "error", "message": ...}                           错误
    """
    if source is None:
        source = resolve_model_source(user)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages
    tools = tool_definitions()

    for _ in range(MAX_TOOL_ROUNDS):
        if stream:
            # 流式阶段：先收集增量内容，同时侦测 tool_calls
            collected_content: list[str] = []
            pending_tool_calls: list[dict[str, Any]] = []
            for delta in stream_chat_completion(
                base_url=source.base_url,
                api_key=source.api_key or "",
                model=source.model,
                messages=messages,
                tools=tools,
            ):
                if "error" in delta:
                    yield {"type": "error", "message": delta["error"]}
                    return
                content = delta.get("content")
                if content:
                    collected_content.append(content)
                    yield {"type": "content", "text": content}
                for tc in delta.get("tool_calls") or []:
                    # 流式 tool_call 分片累积
                    _merge_tool_call(pending_tool_calls, tc)

            if collected_content:
                messages.append(
                    {"role": "assistant", "content": "".join(collected_content)}
                )
            if pending_tool_calls:
                messages.append(
                    {
                        "role": "assistant",
                        "content": messages[-1]["content"] if messages[-1]["role"] == "assistant" else "",
                        "tool_calls": pending_tool_calls,
                    }
                )
                for tc in pending_tool_calls:
                    name = tc["function"]["name"]
                    try:
                        args = json.loads(tc["function"]["arguments"] or "{}")
                    except ValueError:
                        args = {}
                    result = execute_tool(name, args, db, user)
                    yield {
                        "type": "tool",
                        "name": name,
                        "args": args,
                        "result": result,
                    }
                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tc["id"],
                            "content": result,
                        }
                    )
                continue  # 继续下一轮（带着工具结果）
            yield {"type": "done"}
            return
        else:
            # 非流式
            resp = chat_completion(
                base_url=source.base_url,
                api_key=source.api_key or "",
                model=source.model,
                messages=messages,
                tools=tools,
            )
            msg = (resp.get("choices") or [{}])[0].get("message") or {}
            content = msg.get("content") or ""
            tool_calls = msg.get("tool_calls") or []
            messages.append({"role": "assistant", "content": content, **({"tool_calls": tool_calls} if tool_calls else {})})
            if content:
                yield {"type": "content", "text": content}
            if not tool_calls:
                yield {"type": "done"}
                return
            for tc in tool_calls:
                name = tc["function"]["name"]
                try:
                    args = json.loads(tc["function"]["arguments"] or "{}")
                except ValueError:
                    args = {}
                result = execute_tool(name, args, db, user)
                yield {"type": "tool", "name": name, "args": args, "result": result}
                messages.append(
                    {"role": "tool", "tool_call_id": tc["id"], "content": result}
                )

    yield {"type": "error", "message": "工具调用次数过多，已停止"}


def _merge_tool_call(acc: list[dict[str, Any]], tc: dict[str, Any]) -> None:
    """把流式 tool_call 分片合并进列表。"""
    idx = tc.get("index", 0)
    while len(acc) <= idx:
        acc.append({"id": "", "type": "function", "function": {"name": "", "arguments": ""}})
    entry = acc[idx]
    fn = tc.get("function") or {}
    entry["id"] = entry["id"] or tc.get("id") or ""
    if fn.get("name"):
        entry["function"]["name"] += fn["name"]
    if fn.get("arguments"):
        entry["function"]["arguments"] += fn["arguments"]
