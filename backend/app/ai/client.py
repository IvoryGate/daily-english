"""OpenAI 兼容 HTTP 客户端（流式 + 非流式）。

所有模型源（deepseek / Zen / BYOK）都走同一个协议，只是 base_url + key + model 不同。
"""

from __future__ import annotations

import json
from typing import Any, Iterator

import requests


class AIError(Exception):
    pass


def chat_completion(
    *,
    base_url: str,
    api_key: str,
    model: str,
    messages: list[dict[str, str]],
    tools: list[dict[str, Any]] | None = None,
    max_tokens: int = 1000,
    temperature: float = 0.7,
) -> dict[str, Any]:
    """非流式单次请求，返回 OpenAI 格式响应 dict。"""
    url = base_url.rstrip("/") + "/chat/completions"
    payload: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": False,
    }
    if tools:
        payload["tools"] = tools
    try:
        resp = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=60,
        )
    except requests.RequestException as e:
        raise AIError(f"请求模型失败: {e}")
    if resp.status_code != 200:
        raise AIError(f"模型返回 {resp.status_code}: {resp.text[:200]}")
    try:
        return resp.json()
    except ValueError:
        raise AIError("模型响应不是有效 JSON")


def stream_chat_completion(
    *,
    base_url: str,
    api_key: str,
    model: str,
    messages: list[dict[str, str]],
    tools: list[dict[str, Any]] | None = None,
    max_tokens: int = 2000,
    temperature: float = 0.7,
) -> Iterator[dict[str, Any]]:
    """流式请求，逐块产出增量 delta dict（同步生成器，配合 StreamingResponse）。"""
    url = base_url.rstrip("/") + "/chat/completions"
    payload: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": True,
    }
    if tools:
        payload["tools"] = tools

    try:
        resp = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=90,
            stream=True,
        )
    except requests.RequestException as e:
        yield {"error": f"请求模型失败: {e}"}
        return

    if resp.status_code != 200:
        yield {"error": f"模型返回 {resp.status_code}: {resp.text[:200]}", "status": resp.status_code}
        return

    resp.encoding = "utf-8"
    for line in resp.iter_lines(decode_unicode=True):
        if not line or not line.startswith("data:"):
            continue
        data = line[5:].strip()
        if data == "[DONE]":
            break
        try:
            chunk = json.loads(data)
        except ValueError:
            continue
        choices = chunk.get("choices") or []
        if not choices:
            continue
        delta = choices[0].get("delta") or {}
        yield delta
