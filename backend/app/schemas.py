from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

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
    id: int
    username: str
    email: EmailStr
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
