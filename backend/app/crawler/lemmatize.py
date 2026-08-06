"""词形归并：把 run/runs/ran/running 归并到 run。

方案：nltk WordNetLemmatizer。语料放 nltk 标准目录（~/nltk_data），
避免中文项目路径触发 nltk 3.10 的安全校验（Unauthorized path）。
首次使用前需 `python -m app.crawler.lemmatize` 下载语料。
"""

from __future__ import annotations

import os
import re
from functools import lru_cache
from pathlib import Path

# nltk 标准数据目录（用户主目录，无中文路径）
NLTK_DATA_DIR = Path.home() / "nltk_data"

_lemmatizer = None


def ensure_corpus() -> bool:
    """确保 wordnet 语料可用；返回是否就绪。"""
    import nltk

    nltk.data.path.insert(0, str(NLTK_DATA_DIR))
    zip_ready = (NLTK_DATA_DIR / "corpora" / "wordnet.zip").exists()
    dir_ready = (NLTK_DATA_DIR / "corpora" / "wordnet").exists()
    if zip_ready or dir_ready:
        return True
    NLTK_DATA_DIR.mkdir(parents=True, exist_ok=True)
    try:
        nltk.download("wordnet", download_dir=str(NLTK_DATA_DIR), quiet=True)
        return True
    except Exception:
        return False


def _get_lemmatizer():
    global _lemmatizer
    if _lemmatizer is not None:
        return _lemmatizer
    import nltk

    nltk.data.path.insert(0, str(NLTK_DATA_DIR))
    from nltk.stem import WordNetLemmatizer

    _lemmatizer = WordNetLemmatizer()
    return _lemmatizer


@lru_cache(maxsize=5000)
def lemmatize(word: str) -> str:
    """词形归并（小写输入）。"""
    w = word.lower().strip()
    if not w or len(w) < 3:
        return w

    if not ensure_corpus():
        return w  # 语料不可用时不归并，返回原词

    lm = _get_lemmatizer()
    # 先按动词归并（running->run, studies->study, walked->walk）
    v_base = lm.lemmatize(w, "v")
    if v_base != w and len(v_base) <= len(w):
        return v_base
    # 动词没变，按名词归并（children->child, wolves->wolf）
    n_base = lm.lemmatize(w, "n")
    if n_base != w and len(n_base) <= len(w):
        return n_base
    return w


def lemmatize_list(words: list[str]) -> list[str]:
    """批量归并，保持顺序。"""
    return [lemmatize(w) for w in words]


if __name__ == "__main__":
    print("准备 wordnet 语料…")
    ok = ensure_corpus()
    print("语料就绪" if ok else "语料下载失败，请手动下载：nltk.download('wordnet')")
    for w in ["runs", "running", "ran", "studies", "studying", "children", "wolves", "took"]:
        print(f"{w:10} -> {lemmatize(w)}")
