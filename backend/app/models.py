from datetime import datetime

from sqlalchemy import (
    JSON,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    excerpt: Mapped[str] = mapped_column(Text)
    content: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[str] = mapped_column(String(20))
    tags: Mapped[str] = mapped_column(String(200), default="")
    read_time_minutes: Mapped[int] = mapped_column(Integer, default=2)
    created_at: Mapped[datetime] = mapped_column(DateTime)
    source: Mapped[str] = mapped_column(String(20), default="seed")
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    # 每日目标：阅读篇数 / 复习词数（读+复习双达标才打卡）
    daily_read_goal: Mapped[int] = mapped_column(Integer, default=1)
    daily_review_goal: Mapped[int] = mapped_column(Integer, default=1)
    # AI 配置（BYOK）：用户自填 OpenAI 兼容 key；为空则用 Zen 免费默认
    ai_base_url: Mapped[str | None] = mapped_column(String(300), nullable=True)
    ai_api_key: Mapped[str | None] = mapped_column(String(300), nullable=True)
    ai_model: Mapped[str | None] = mapped_column(String(100), nullable=True)


class VocabularyEntry(Base):
    __tablename__ = "vocabulary_entries"
    __table_args__ = (
        UniqueConstraint("user_id", "word", name="uq_vocab_user_word"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    word: Mapped[str] = mapped_column(String(100))
    phonetic: Mapped[str | None] = mapped_column(String(100), nullable=True)
    definition: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_title: Mapped[str] = mapped_column(String(200), default="")
    added_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    # FSRS 复习调度卡片（JSON 序列化的 ts-fsrs Card）
    card: Mapped[dict] = mapped_column(JSON, default=dict)


class Bookmark(Base):
    __tablename__ = "bookmarks"
    __table_args__ = (
        UniqueConstraint("user_id", "article_id", name="uq_bookmark_user_article"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    article_id: Mapped[int] = mapped_column(
        ForeignKey("articles.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ReadingRecord(Base):
    __tablename__ = "reading_records"
    __table_args__ = (
        UniqueConstraint("user_id", "article_id", name="uq_reading_user_article"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    article_id: Mapped[int] = mapped_column(
        ForeignKey("articles.id", ondelete="CASCADE"), index=True
    )
    read_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    progress: Mapped[float] = mapped_column(Float, default=0.0)


class ReviewHistory(Base):
    """一次复习记录（每张 FSRS 卡每次作答一行），驱动 streak/热力图/趋势。"""

    __tablename__ = "review_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    word: Mapped[str] = mapped_column(String(100), index=True)
    # ts-fsrs Rating: 1=Again 2=Hard 3=Good 4=Easy
    rating: Mapped[int] = mapped_column(Integer)
    reviewed_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, index=True
    )


class Achievement(Base):
    """已解锁的成就徽章，一行一个。"""

    __tablename__ = "achievements"
    __table_args__ = (
        UniqueConstraint("user_id", "key", name="uq_achievement_user_key"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    key: Mapped[str] = mapped_column(String(50))
    unlocked_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )


class Note(Base):
    """AI 助手/手动记录的学习笔记，关联可选文章。"""

    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    article_id: Mapped[int | None] = mapped_column(
        ForeignKey("articles.id", ondelete="SET NULL"), nullable=True
    )
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, index=True
    )
