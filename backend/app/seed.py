from datetime import datetime

from sqlalchemy import select

from app.database import Base, SessionLocal, engine, migrate
from app.mock_data import MOCK_ARTICLES
from app.models import Article, User


def seed() -> None:
    """把内置语料灌进数据库 + 初始化管理员。幂等。"""
    Base.metadata.create_all(engine)
    migrate()

    db = SessionLocal()
    try:
        # 内置语料
        if db.query(Article).count() == 0:
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
            print(f"已灌入 {len(MOCK_ARTICLES)} 篇文章。")
        else:
            print("已存在数据，跳过灌库。")

        # 管理员：把 tester 账号标记为管理员（幂等）
        tester = db.scalars(
            select(User).where(User.username == "tester")
        ).first()
        if tester is not None and not tester.is_admin:
            tester.is_admin = 1
            print("已将 tester 设为管理员。")

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
