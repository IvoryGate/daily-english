"""模型源解析。

默认走 OpenCode Zen 免费模型（匿名、无需 key），用户可配置 BYOK（OpenAI 兼容）。
Zen 免费模型有服务端限流，提供备用模型池，限流时自动切换。
"""

from __future__ import annotations

import os
from dataclasses import dataclass

from app.models import User

# Zen 免费模型（公开匿名，安装即可用）
ZEN_BASE_URL = "https://opencode.ai/zen/v1"
# 免费模型池：默认第一个，限流时依次尝试后续
ZEN_FREE_MODELS = [
    "deepseek-v4-flash-free",
    "mimo-v2.5-free",
    "ling-3.0-flash-free",
    "nemotron-3-ultra-free",
    "north-mini-code-free",
    "laguna-s-2.1-free",
    "longcat-2.0-free",
]
DEFAULT_ZEN_MODEL = ZEN_FREE_MODELS[0]


@dataclass
class ModelSource:
    base_url: str
    api_key: str | None
    model: str
    provider_id: str


def resolve_model_source(user: User | None = None) -> ModelSource:
    """解析用户的模型源：BYOK 优先，否则 Zen 免费兜底。

    user 为 None 或未配置 BYOK 时用 Zen 免费（可被 ZEN_API_KEY 环境变量覆盖）。
    """
    # 用户自带 key
    if user is not None and user.ai_api_key:
        base_url = user.ai_base_url or "https://api.openai.com/v1"
        model = user.ai_model or "gpt-4o-mini"
        return ModelSource(
            base_url=base_url,
            api_key=user.ai_api_key,
            model=model,
            provider_id="byok",
        )

    # Zen 免费兜底（匿名或环境变量 key）
    zen_key = os.environ.get("ZEN_API_KEY") or None
    return ModelSource(
        base_url=ZEN_BASE_URL,
        api_key=zen_key,
        model=DEFAULT_ZEN_MODEL,
        provider_id="zen-free",
    )


def zen_fallback_sources() -> list[ModelSource]:
    """Zen 免费备用模型源（不含默认模型，供限流时切换）。"""
    zen_key = os.environ.get("ZEN_API_KEY") or None
    return [
        ModelSource(
            base_url=ZEN_BASE_URL,
            api_key=zen_key,
            model=m,
            provider_id="zen-free",
        )
        for m in ZEN_FREE_MODELS
        if m != DEFAULT_ZEN_MODEL
    ]
