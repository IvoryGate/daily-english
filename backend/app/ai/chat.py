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


def _stream_forward(
    source: ModelSource,
    messages: list[dict[str, Any]],
    db: Session,
    user: User | None,
    tools: list[dict[str, Any]],
):
    """流式转发：边读边 yield，第一个 token 立即推送。

    yield:
      {"type": "content", "text": ...}   文本增量（实时）
      {"type": "tool", "name", "args", "result"}  工具执行结果
      {"type": "retry", "message"}  Zen 限流切备用
      {"type": "error", "message"}  错误
      {"type": "done"}  结束
    """
    collected: list[str] = []
    tool_calls: list[dict[str, Any]] = []
    candidates = _candidate_sources(source)

    for cand in candidates:
        # 用非流式代理的 stream 逐块，这里重新实现：边读边透传
        from app.ai.client import stream_chat_completion as sc

        err = None
        for delta in sc(
            base_url=cand.base_url,
            api_key=cand.api_key or "",
            model=cand.model,
            messages=messages,
            tools=tools,
        ):
            if _is_rate_limited(delta):
                err = delta
                break
            if "error" in delta:
                yield {"type": "error", "message": delta["error"]}
                return
            content = delta.get("content")
            if content:
                collected.append(content)
                # 实时推送：第一个字立刻到前端
                yield {"type": "content", "text": content}
            for tc in delta.get("tool_calls") or []:
                _merge_tool_call(tool_calls, tc)

        if err is not None and cand.provider_id == "zen-free":
            yield {"type": "retry", "message": f"免费模型「{cand.model}」繁忙，尝试备用…"}
            continue
        if err is not None:
            yield {"type": "error", "message": err.get("error", "模型请求失败")}
            return
        break
    else:
        yield {
            "type": "error",
            "message": "免费模型暂时繁忙，请稍后再试，或在「设置 → AI 模型」中配置自己的 API Key。",
        }
        return

    # 追加 assistant 消息（含累积的 tool_calls）
    if collected:
        messages.append({"role": "assistant", "content": "".join(collected)})
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
            from app.ai.tools import execute_tool as exec_tool

            result = exec_tool(name, args, db, user)
            yield {"type": "tool", "name": name, "args": args, "result": result}
            messages.append(
                {"role": "tool", "tool_call_id": tc["id"], "content": result}
            )
        return  # 有工具调用，需要下一轮（外层循环处理）
    yield {"type": "done"}


def run_chat(
    messages: list[dict[str, Any]],
    db: Session,
    user: User | None,
    source: ModelSource | None = None,
    stream: bool = True,
) -> Iterator[dict[str, Any]]:
    """执行一轮或多轮对话，产出事件：
    - {"type": "tool", "name", "args", "result"}  工具调用
    - {"type": "content", "text": ...}            文本增量（流式实时）
    - {"type": "done"}                            结束
    - {"type": "error", "message": ...}           错误
    - {"type": "retry", "message": ...}           Zen 限流自动切换
    """
    if source is None:
        source = resolve_model_source(user)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages
    tools = tool_definitions()

    for _ in range(MAX_TOOL_ROUNDS):
        if stream:
            # 流式：实时转发内容，工具调用时返回需要下一轮
            had_tool = False
            for event in _stream_forward(source, messages, db, user, tools):
                if event.get("type") == "tool":
                    had_tool = True
                yield event
            if not had_tool:
                return
            continue  # 有工具调用，下一轮继续
        else:
            content_str, tool_calls, err = _nonstream_one_round(source, messages, tools)
            if err is not None:
                yield {"type": "error", "message": err.get("error", "模型请求失败")}
                return
            if content_str:
                yield {"type": "content", "text": content_str}
                messages.append({"role": "assistant", "content": content_str})
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
                continue
            yield {"type": "done"}
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
