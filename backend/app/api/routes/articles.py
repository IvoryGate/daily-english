from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.crawler.keywords import extract_keywords
from app.database import get_db
from app.models import Article
from app.schemas import ArticleDetail, ArticleSummary

router = APIRouter(prefix="/api/articles", tags=["articles"])


def _to_summary(row: Article) -> ArticleSummary:
    return ArticleSummary(
        id=row.id,
        title=row.title,
        excerpt=row.excerpt,
        difficulty=row.difficulty,
        tags=row.tags.split(",") if row.tags else [],
        read_time_minutes=row.read_time_minutes,
        created_at=row.created_at,
        source=row.source,
        source_url=row.source_url,
        image_url=row.image_url,
        vocab_level=row.vocab_level,
        vocab_score=row.vocab_score,
    )


def _to_detail(row: Article) -> ArticleDetail:
    summary = _to_summary(row)
    return ArticleDetail(
        **summary.model_dump(),
        content=row.content,
    )


@router.get("", response_model=list[ArticleSummary])
def list_articles(
    source: str | None = None,
    q: str | None = None,
    difficulty: str | None = None,
    vocab_level: str | None = None,
    sort: str | None = None,
    db: Session = Depends(get_db),
) -> list[ArticleSummary]:
    """返回文章列表（摘要信息，不含正文）。

    过滤器：来源 / 关键词 / 难度 / 词汇级别；排序：latest（默认）或 vocab（按词汇分升序，最易在前）。
    """
    query = select(Article)
    if source:
        query = query.where(Article.source == source)
    if q:
        like = f"%{q.strip()}%"
        query = query.where(
            or_(
                Article.title.like(like),
                Article.excerpt.like(like),
                Article.content.like(like),
            )
        )
    if difficulty:
        query = query.where(Article.difficulty == difficulty)
    if vocab_level:
        query = query.where(Article.vocab_level == vocab_level)
    if sort == "easiest":
        query = query.order_by(Article.vocab_score.asc())
    else:
        query = query.order_by(Article.created_at.desc())
    rows = db.scalars(query).all()
    return [_to_summary(row) for row in rows]


@router.get("/{article_id}/keywords")
def get_article_keywords(
    article_id: int,
    limit: int = 8,
    db: Session = Depends(get_db),
) -> list[dict]:
    """返回文章重点词（词形归并 + 词频 + 学习级别）。"""
    row = db.get(Article, article_id)
    if row is None:
        raise HTTPException(status_code=404, detail="文章不存在")
    return extract_keywords(row.content, limit=limit)


@router.get("/{article_id}", response_model=ArticleDetail)
def get_article(article_id: int, db: Session = Depends(get_db)) -> ArticleDetail:
    """返回文章详情（含完整正文）。"""
    row = db.get(Article, article_id)
    if row is None:
        raise HTTPException(status_code=404, detail="文章不存在")
    return _to_detail(row)
