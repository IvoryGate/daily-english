"""回填脚本：清洗已有文章正文（过滤杂质段）。

用法：
    ./.venv/bin/python -m scripts.clean_articles [--dry-run]

--dry-run 只报告不修改。
"""

import sys

from sqlalchemy import select

from app.crawler.normalizer import (
    clean_paragraphs,
    compute_read_time,
    count_words,
    make_excerpt,
)
from app.database import SessionLocal
from app.models import Article


def main() -> None:
    dry = "--dry-run" in sys.argv
    db = SessionLocal()
    try:
        articles = db.scalars(select(Article)).all()
        total_removed = 0
        changed = 0
        for article in articles:
            paras = article.content.split("\n\n")
            cleaned = clean_paragraphs(paras)
            removed = len(paras) - len(cleaned)
            if removed == 0:
                continue
            changed += 1
            total_removed += removed
            print(
                f"{'[dry]' if dry else '[fix]'} 文章{article.id} {article.title[:30]}: "
                f"删 {removed} 段（{len(paras)}→{len(cleaned)}）"
            )
            if dry:
                continue
            article.content = "\n\n".join(cleaned)
            article.excerpt = make_excerpt(cleaned)
            words = count_words(cleaned)
            article.read_time_minutes = compute_read_time(words)
        if not dry:
            db.commit()
        print(f"\n{'（模拟）' if dry else ''}共 {changed} 篇有改动，删除 {total_removed} 个杂质段")
    finally:
        db.close()


if __name__ == "__main__":
    main()
