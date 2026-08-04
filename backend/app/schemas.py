from datetime import datetime
from typing import Literal

from pydantic import BaseModel

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
