"""文章重点词提取：词形归并 + 词频 + 分级。

流程：
1. 从正文提取候选词（≥5 字符、非停用词）
2. 词形归并（WordNet：running->run）
3. 按归并后的词频排序
4. 标注每个词的学习级别（初中/高中/四级/…/超纲）
"""

from __future__ import annotations

import re
from collections import Counter

from app.crawler.lemmatize import lemmatize
from app.crawler.word_level import level_of

STOP_WORDS = {
    "a", "an", "the", "and", "or", "but", "if", "then", "than", "of", "at",
    "by", "for", "from", "in", "into", "on", "to", "with", "as", "is", "are",
    "was", "were", "be", "been", "being", "have", "has", "had", "do", "does",
    "did", "will", "would", "can", "could", "should", "may", "might", "must",
    "shall", "not", "no", "nor", "so", "very", "too", "just", "also", "about",
    "over", "under", "up", "down", "out", "off", "again", "there", "here",
    "this", "that", "these", "those", "it", "its", "i", "you", "he", "she",
    "we", "they", "me", "him", "her", "us", "them", "my", "your", "his",
    "their", "our", "what", "which", "who", "whom", "when", "where", "why",
    "how", "all", "any", "both", "each", "few", "more", "most", "other",
    "some", "such", "only", "own", "same", "than", "then", "because", "before",
    "after", "between", "during", "through", "among", "within", "without",
    "does", "doing", "done", "been", "being", "got", "get", "gets", "getting",
    "make", "makes", "made", "making", "say", "says", "said", "see", "saw",
    "seen", "know", "knows", "knew", "new", "now", "one", "two", "like",
    "even", "ever", "never", "always", "often", "usually", "sometimes",
}

_WORD_RE = re.compile(r"[a-z][a-z'-]{4,}")


def extract_keywords(content: str, limit: int = 8) -> list[dict]:
    """提取文章重点词，返回 [{word, count, level}] 按词频降序。"""
    raw_counts: Counter[str] = Counter()
    for match in _WORD_RE.findall(content.lower()):
        word = match.strip("'-")
        if len(word) < 5 or word in STOP_WORDS:
            continue
        raw_counts[word] += 1

    # 词形归并聚合
    merged: dict[str, int] = {}
    for raw, count in raw_counts.items():
        base = lemmatize(raw)
        merged[base] = merged.get(base, 0) + count

    result = [
        {"word": word, "count": count, "level": level_of(word)}
        for word, count in merged.items()
    ]
    result.sort(key=lambda x: (-x["count"], x["word"]))
    return result[:limit]
