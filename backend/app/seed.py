from datetime import datetime

from app.database import Base, SessionLocal, engine, migrate
from app.mock_data import MOCK_ARTICLES
from app.models import Article


def seed() -> None:
    """把内置语料灌进数据库。幂等：已有数据则跳过。"""
    Base.metadata.create_all(engine)
    migrate()

    db = SessionLocal()
    try:
        if db.query(Article).count() > 0:
            print("已存在数据，跳过灌库。")
            return
        for item in MOCK_ARTICLES:
            db.add(
                Article(
                    title=item["title"],
                    excerpt=item["excerpt"],
                    content=item["content"],
                    difficulty=item["difficulty"],
                    tags=",".join(item["tags"]),
                    read_time_minutes=item["read_time_minutes"],
                    created_at=datetime.fromisoformat(item["created_at"]),
                )
            )
        db.commit()
        print(f"已灌入 {len(MOCK_ARTICLES)} 篇文章。")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
