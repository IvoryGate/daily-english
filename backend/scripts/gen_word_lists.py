"""生成分级词表 JSON（从 ECDICT + mahavivo 专八词表）。

产物：backend/data/word_lists.json
  {"junior": [...], "senior": [...], "cet4": [...], "cet6": [...],
   "ielts": [...], "toefl": [...], "tem8": [...], "advanced": [...]}

级别（由低到高）：
  junior < senior < cet4 < cet6 < ielts < toefl < tem8 < advanced
词归属规则：按标签取该词出现的最高级别；全无标签的归 advanced（超纲）。

用法：
  1. 先下载 ECDICT 完整 csv 到 /tmp/ecdict.csv：
     curl -L -o /tmp/ecdict.csv https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv
  2. python -m scripts.gen_word_lists
"""

from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "data" / "word_lists.json"
ECDICT = Path("/tmp/ecdict.csv")# ECDICT tag -> 本项目级别
TAG_LEVEL = {
    "zk": "junior",
    "gk": "senior",
    "cet4": "cet4",
    "cet6": "cet6",
    "ielts": "ielts",
    "toefl": "toefl",
    "ky": "advanced",  # 考研视为高阶
    "gre": "advanced",
}
# 级别顺序（低→高）
LEVELS = ["junior", "senior", "cet4", "cet6", "ielts", "toefl", "tem8", "advanced"]
LEVEL_RANK = {lv: i for i, lv in enumerate(LEVELS)}


def _extract_words(line: str) -> list[str]:
    """从词表行提取行首单词（处理 a, an 逗号分隔、*星号、音标）。"""
    head = line.split("[")[0].split()[0] if line.strip() else ""
    if not head:
        return []
    # 逗号分隔多词（如 "a, an"）
    parts = [p.strip("*,.'\" ").lower() for p in head.split(",")]
    return [p for p in parts if p]


def main() -> None:
    if not ECDICT.exists():
        print("缺少 ECDICT，请先下载到 /tmp/ecdict.csv")
        sys.exit(1)

    # 1. ECDICT 分级：一个词的 tag 是累积的（带 zk 说明初中该会，
    #    也带 gk 说明高中沿用）。每个级别 = 带该标签的所有词（天然包含更低级）。
    buckets: dict[str, set[str]] = {lv: set() for lv in LEVELS}
    with open(ECDICT, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            word = (row.get("word") or "").strip().lower()
            tag = row.get("tag") or ""
            if not word:
                continue
            for t in tag.split():
                lv = TAG_LEVEL.get(t)
                if lv:
                    buckets[lv].add(word)

    # 3. 专八（mahavivo）：并入 tem8（去掉已在高级别 advanced 的词）
    tem8_src = Path("/tmp/tem8.txt")
    if tem8_src.exists():
        with open(tem8_src, encoding="utf-8") as f:
            for line in f:
                for word in _extract_words(line):
                    w = word.lower()
                    if w and w not in buckets["advanced"]:
                        buckets["tem8"].add(w)
    else:
        # 无独立专八表时，从旧产物回填 tem8（避免重跑丢档）
        if OUT.exists():
            with open(OUT, encoding="utf-8") as f:
                prev = json.load(f)
            buckets["tem8"] |= set(prev.get("tem8", []))
            print("（无 /tmp/tem8.txt，从旧产物回填 tem8）")

    # 4. 输出（每级 = 带该标签的全部词，天然前缀包含低级别）
    result: dict[str, list[str]] = {
        lv: sorted(words) for lv, words in buckets.items()
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)
    print(f"已生成 {OUT}（每级为带该标签的全部词）")
    for lv in LEVELS:
        print(f"  {lv}: {len(result[lv])} 词")


if __name__ == "__main__":
    main()
