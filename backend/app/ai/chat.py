"""AI 对话：工具循环 + SSE 事件流。

流程：发起请求 → 若模型请求工具则执行 → 回填结果继续 → 直到模型直接回答。
支持流式（先输出文字，工具调用在途中触发）。
Zen 免费模型限流（429）时自动切换备用免费模型。
"""

from __future__ import annotations

import json
from typing import Any, Iterator

from sqlalchemy.orm import Session

from app.ai.client import chat_completion, stream_chat_completion
from app.ai.providers import ModelSource, resolve_model_source, zen_fallback_sources
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


def _is_rate_limited(delta: dict[str, Any]) -> bool:
    """判断流式增量是否为限流错误。"""
    if "error" not in delta:
        return False
    if delta.get("status") == 429:
        return True
    msg = delta.get("error", "").lower()
    return "rate limit" in msg or "limit exceeded" in msg or "429" in msg


def _candidate_sources(source: ModelSource) -> list[ModelSource]:
    """当前源 + 备用 Zen 免费源。BYOK 时不回退（用户自己配的 key 要保留错误）。"""
    sources = [source]
    if source.provider_id == "zen-free":
        sources.extend(zen_fallback_sources())
    return sources


def _stream_one_round(
    source: ModelSource,
    messages: list[dict[str, Any]],
    tools: list[dict[str, Any]],
) -> tuple[list[str], list[dict[str, Any]], dict[str, Any] | None]:
    """用指定源执行一轮流式，返回 (内容片段, tool_calls, 限流错误)。"""
    collected: list[str] = []
    tool_calls: list[dict[str, Any]] = []
    for delta in stream_chat_completion(
        base_url=source.base_url,
        api_key=source.api_key or "",
        model=source.model,
        messages=messages,
        tools=tools,
    ):
        if _is_rate_limited(delta):
            return [], [], delta
        if "error" in delta:
            return collected, tool_calls, delta
        content = delta.get("content")
        if content:
            collected.append(content)
        for tc in delta.get("tool_calls") or []:
            _merge_tool_call(tool_calls, tc)
    return collected, tool_calls, None


def _nonstream_one_round(
    source: ModelSource,
    messages: list[dict[str, Any]],
    tools: list[dict[str, Any]],
) -> tuple[str, list[dict[str, Any]], dict[str, Any] | None]:
    """非流式单轮，返回 (content, tool_calls, 限流错误)。"""
    try:
        resp = chat_completion(
            base_url=source.base_url,
            api_key=source.api_key or "",
            model=source.model,
            messages=messages,
            tools=tools,
        )
    except Exception as e:
        msg = str(e)
        if "429" in msg or "rate limit" in msg.lower():
            return "", [], {"error": msg}
        return "", [], {"error": msg}
    msg = (resp.get("choices") or [{}])[0].get("message") or {}
    return msg.get("content") or "", msg.get("tool_calls") or [], None


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
    - {"type": "error", "message": ...}                           错误（含限流提示）
    - {"type": "retry", "message": ...}                           Zen 限流自动切换
    """
    if source is None:
        source = resolve_model_source(user)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages
    tools = tool_definitions()
    candidates = _candidate_sources(source)

    for _ in range(MAX_TOOL_ROUNDS):
        # 对每个候选源尝试当前轮
        for cand in candidates:
            if stream:
                collected, tool_calls, err = _stream_one_round(cand, messages, tools)
            else:
                content_str, tool_calls, err = _nonstream_one_round(cand, messages, tools)
                collected = [content_str] if content_str else []

            if err is not None:
                if _is_rate_limited(err) and cand.provider_id == "zen-free":
                    # Zen 免费限流：提示并尝试下一个源
                    yield {"type": "retry", "message": f"免费模型「{cand.model}」繁忙，尝试备用…"}
                    continue
                yield {"type": "error", "message": err.get("error", "模型请求失败")}
                return

            # 成功：输出内容
            if collected:
                text = "".join(collected)
                if stream:
                    yield {"type": "content", "text": text}
                messages.append({"role": "assistant", "content": text})

            if tool_calls:
                messages.append(
                    {
                        "role": "assistant",
                        "content": messages[-1]["content"] if messages[-1]["role"] == "assistant" else "",
                        "tool_calls": tool_calls,
                    }
                )
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
                break  # 工具调用需要下一轮，跳出候选循环进入下一轮
            yield {"type": "done"}
            return
        else:
            # 所有候选源都限流了
            yield {
                "type": "error",
                "message": "免费模型暂时繁忙，请稍后再试，或在「设置 → AI 模型」中配置自己的 API Key。",
            }
            return

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
