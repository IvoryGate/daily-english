import re
import time
from typing import Any

import requests
from fastapi import APIRouter, HTTPException
from urllib.parse import quote

router = APIRouter(prefix="/api/dict", tags=["dictionary"])

YOUDAO_JSONAPI = "http://dict.youdao.com/jsonapi"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
}

# 简单内存缓存：{word: (expire_ts, parsed)}，避免同一词重复请求有道
_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}
_CACHE_TTL = 60 * 60 * 24 * 7  # 7 天


def _audio_url(part: str, word: str) -> str:
    # usspeech/ukspeech 形如 "run&type=2"，拼成可播放的音频地址
    m = re.search(r"type=(\d)", part or "")
    audio_type = m.group(1) if m else "2"
    return f"https://dict.youdao.com/dictvoice?audio={quote(word)}&type={audio_type}"


def _extract_phrase(value: Any) -> str:
    # return-phrase 实际是嵌套对象 {"l": {"i": "run"}}
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        l = value.get("l")
        if isinstance(l, dict):
            i = l.get("i")
            if isinstance(i, str):
                return i
    return ""


def _parse(data: dict[str, Any]) -> dict[str, Any] | None:
    ec = data.get("ec")
    if not isinstance(ec, dict):
        return None
    words = ec.get("word")
    if not isinstance(words, list) or not words:
        return None
    w = words[0]
    if not isinstance(w, dict):
        return None

    meanings: list[dict[str, Any]] = []
    trs = w.get("trs") or []
    for tr_item in trs:
        tr = ((tr_item.get("tr") or [{}])[0]) if isinstance(tr_item, dict) else {}
        l = (tr or {}).get("l") or {}
        items = l.get("i") or []
        if not items:
            continue
        full = str(items[0])
        pos = ""
        rest = full
        m = re.match(r"^([A-Za-z]+)\.\s*(.*)$", full, re.S)
        if m:
            pos = m.group(1)
            rest = m.group(2)
        defs = [d.strip() for d in re.split(r"[；;]", rest) if d.strip()]
        if defs:
            meanings.append({"partOfSpeech": pos, "definitions": defs[:4]})

    if not meanings:
        return None

    word = _extract_phrase(w.get("return-phrase"))
    if not word:
        word = key if (key := str(w.get("word") or "")) else ""

    return {
        "word": word,
        "phonetic_us": w.get("usphone") or "",
        "phonetic_uk": w.get("ukphone") or "",
        "audio_us": _audio_url(w.get("usspeech") or "", word),
        "audio_uk": _audio_url(w.get("ukspeech") or "", word),
        "meanings": meanings,
    }


@router.get("/{word}")
def lookup_word(word: str) -> dict[str, Any]:
    key = word.strip().lower()
    if not key:
        raise HTTPException(status_code=422, detail="无效的单词")

    cached = _CACHE.get(key)
    if cached and cached[0] > time.time():
        return cached[1]

    try:
        resp = requests.get(
            YOUDAO_JSONAPI,
            params={"q": key},
            headers=HEADERS,
            timeout=8,
        )
        resp.raise_for_status()
        data = resp.json()
    except (requests.RequestException, ValueError):
        raise HTTPException(status_code=502, detail="词典服务暂时不可用")

    parsed = _parse(data)
    if parsed is None:
        raise HTTPException(status_code=404, detail="查不到这个词")
    _CACHE[key] = (time.time() + _CACHE_TTL, parsed)
    return parsed
