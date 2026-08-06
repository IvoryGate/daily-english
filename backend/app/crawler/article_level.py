"""文章词汇画像：给一篇文章算「词汇分」与「词汇级别」。

原理（可解释、可回溯）：
1. 从正文提取内容词（≥5 字符、非停用词），词形归并
2. 逐个标注学习级别（junior=1 … advanced=8）
3. vocab_score = 各级加权平均，线性归一到 0~100（越小越简单）
4. vocab_level = 第一个累计词量达到 50% 的级别（「读懂一半词」所需级别）

用途：学习路径按用户等级给出「这一档该读哪些词的文章」。
"""

from __future__ import annotations

import re
from collections import Counter

from app.crawler.lemmatize import lemmatize
from app.crawler.word_level import level_of

# 与 word_level._LEVEL_ORDER 保持一致的权重（低→高）
_LEVELS = ["junior", "senior", "cet4", "cet6", "ielts", "toefl", "tem8", "advanced"]
_LEVEL_IDX = {lv: i for i, lv in enumerate(_LEVELS)}

_STOP = {
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
    "got", "get", "gets", "getting", "make", "makes", "made", "making", "say",
    "says", "said", "see", "saw", "seen", "know", "knows", "knew", "new",
    "now", "one", "two", "like", "even", "ever", "never", "always", "often",
    "usually", "sometimes",
}

_WORD_RE = re.compile(r"[a-z][a-z'-]{4,}")


def _tokens(content: str) -> list[str]:
    """正文 → 词形归并后的（原形）token 列表。"""
    raws: list[str] = []
    for match in _WORD_RE.findall(content.lower()):
        word = match.strip("'-")
        if len(word) < 5 or word in _STOP:
            continue
        raws.append(word)
    merged: list[str] = []
    for raw in raws:
        merged.append(lemmatize(raw))
    return merged


def vocab_profile(content: str) -> dict:
    """返回 {words, levels:{每级词数}, vocab_level, vocab_score}。"""
    tokens = _tokens(content)
    total = len(tokens)
    if total == 0:
        return {"words": 0, "levels": {}, "vocab_level": "junior", "vocab_score": 0.0}

    level_counts: Counter[str] = Counter()
    weighted = 0.0
    for tok in tokens:
        lv = level_of(tok)
        level_counts[lv] += 1
        weighted += _LEVEL_IDX.get(lv, 7)

    # 加权平均难点得分，映射到 0~100
    avg = weighted / total  # 0..7
    vocab_score = round(avg / 7 * 100, 1)

    # vocab_level：累积词量首达 50% 的级别
    cum = 0
    vocab_level = "junior"
    for lv in _LEVELS:
        cum += level_counts.get(lv, 0)
        if cum / total >= 0.5:
            vocab_level = lv
            break

    return {
        "words": total,
        "levels": dict(sorted(level_counts.items(), key=lambda x: _LEVEL_IDX[x[0]])),
        "vocab_level": vocab_level,
        "vocab_score": vocab_score,
    }