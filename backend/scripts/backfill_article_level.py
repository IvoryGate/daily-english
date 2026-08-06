"""回填：给所有已有文章计算词汇画像（vocab_level / vocab_score）并入库。

用法：
    cd backend && ./.venv/bin/python scripts/backfill_article_level.py
"""

from sqlalchemy import select

from app.crawler.article_level import vocab_profile
from app.database import SessionLocal, migrate
from app.models import Article


def main() -> None:
    migrate()
    with SessionLocal() as db:
        rows = db.scalars(select(Article)).all()
        updated = 0
        for row in rows:
            profile = vocab_profile(row.content)
            row.vocab_level = profile["vocab_level"]
            row.vocab_score = profile["vocab_score"]
            updated += 1
        db.commit()
        print(f"已回填 {updated} 篇文章的词汇画像")


if __name__ == "__main__":
    main()