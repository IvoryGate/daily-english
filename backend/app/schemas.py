from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Difficulty = Literal["beginner", "intermediate", "advanced"]


class ArticleSummary(BaseModel):
    id: int
    title: str
    excerpt: str
    difficulty: Difficulty
    tags: list[str]
    read_time_minutes: int
    created_at: datetime
    source: str = "seed"
    source_url: str | None = None


class ArticleDetail(ArticleSummary):
    content: str


class UserCreate(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: EmailStr
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UsernameUpdate(BaseModel):
    username: str = Field(min_length=2, max_length=50)


class PasswordChange(BaseModel):
    old_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


# ---- 用户个人数据（15.2 数据云端化） ----

class VocabCreate(BaseModel):
    word: str = Field(min_length=1, max_length=100)
    phonetic: str | None = None
    definition: str | None = None
    source_title: str = ""
    card: dict | None = None


class VocabUpdate(BaseModel):
    phonetic: str | None = None
    definition: str | None = None
    source_title: str | None = None
    card: dict | None = None


class VocabOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    word: str
    phonetic: str | None = None
    definition: str | None = None
    source_title: str
    added_at: datetime
    card: dict


class BookmarkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    article_id: int
    created_at: datetime


class ReadingIn(BaseModel):
    progress: float = Field(ge=0, le=1)
    read_at: datetime | None = None


class ReadingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    article_id: int
    read_at: datetime
    progress: float


class MeData(BaseModel):
    user: UserOut
    vocabulary: list[VocabOut]
    bookmarks: list[int]
    reading: list[ReadingOut]


# ---- 游戏化（等级/成就/每日目标，18 学习体系） ----

class ReviewIn(BaseModel):
    word: str = Field(min_length=1, max_length=100)
    rating: int = Field(ge=1, le=4)


class DailyGoalsIn(BaseModel):
    read_goal: int = Field(ge=1, le=50)
    review_goal: int = Field(ge=0, le=200)


class DailyGoalsOut(BaseModel):
    read_goal: int
    review_goal: int
