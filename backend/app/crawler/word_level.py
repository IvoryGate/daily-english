"""单词分级：判断一个词属于哪个学习级别。

数据源：data/word_lists.json（初中/高中/四级/六级/雅思/托福/专八/超纲）。
级别由低到高，低级别词天然属于更高级别（前缀包含）。
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

WORD_LISTS_PATH = Path(__file__).resolve().parent.parent / "data" / "word_lists.json"

# 展示用级别标签
LEVEL_LABELS = {
    "junior": "初中",
    "senior": "高中",
    "cet4": "四级",
    "cet6": "六级",
    "ielts": "雅思",
    "toefl": "托福",
    "tem8": "专八",
    "advanced": "超纲",
}

# 级别顺序（低→高）
_LEVEL_ORDER = ["junior", "senior", "cet4", "cet6", "ielts", "toefl", "tem8", "advanced"]

_lists: dict[str, set[str]] | None = None


def _load() -> dict[str, set[str]]:
    global _lists
    if _lists is not None:
        return _lists
    if not WORD_LISTS_PATH.exists():
        _lists = {}
        return _lists
    with open(WORD_LISTS_PATH, encoding="utf-8") as f:
        raw = json.load(f)
    _lists = {lv: set(words) for lv, words in raw.items()}
    return _lists


def available() -> bool:
    return bool(_load())


def level_of(word: str) -> str:
    """返回单词的最低级别（最贴切的）：在哪个最低级别首次出现。"""
    w = word.lower().strip()
    if not w:
        return "advanced"
    lists = _load()
    for lv in _LEVEL_ORDER:
        if w in lists.get(lv, set()):
            return lv
    return "advanced"


def level_label(level: str) -> str:
    return LEVEL_LABELS.get(level, level)


def filter_by_max_level(words: list[str], max_level: str) -> list[str]:
    """返回级别不高于 max_level 的词（按前缀包含取并集）。"""
    if max_level not in _LEVEL_ORDER:
        return list(words)
    target_idx = _LEVEL_ORDER.index(max_level)
    allowed: set[str] = set()
    for lv in _LEVEL_ORDER[: target_idx + 1]:
        allowed |= _load().get(lv, set())
    return [w for w in words if w.lower() in allowed]
