from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DB_DIR = Path(__file__).resolve().parent.parent / "data"
DB_DIR.mkdir(exist_ok=True)
DATABASE_URL = f"sqlite:///{DB_DIR / 'daily_english.db'}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def migrate() -> None:
    """给已存在的库补上新增列（幂等，SQLite 无 IF NOT EXISTS 列语法）。"""
    from sqlalchemy import text

    with engine.begin() as conn:
        columns = {row[1] for row in conn.execute(text("PRAGMA table_info(articles)"))}
        if not columns:
            return
        if "source" not in columns:
            conn.execute(
                text("ALTER TABLE articles ADD COLUMN source VARCHAR(20) DEFAULT 'seed'")
            )
        if "source_url" not in columns:
            conn.execute(text("ALTER TABLE articles ADD COLUMN source_url VARCHAR(500)"))
