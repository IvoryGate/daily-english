from fastapi import APIRouter, HTTPException

from app.mock_data import MOCK_ARTICLES
from app.schemas import ArticleDetail, ArticleSummary

router = APIRouter(prefix="/api/articles", tags=["articles"])


@router.get("", response_model=list[ArticleSummary])
def list_articles() -> list[ArticleSummary]:
    """返回文章列表（摘要信息，不含正文）。"""
    return [ArticleSummary.model_validate(a) for a in MOCK_ARTICLES]


@router.get("/{article_id}", response_model=ArticleDetail)
def get_article(article_id: int) -> ArticleDetail:
    """返回文章详情（含完整正文）。"""
    article = next(
        (a for a in MOCK_ARTICLES if a["id"] == article_id),
        None,
    )
    if article is None:
        raise HTTPException(status_code=404, detail="文章不存在")
    return ArticleDetail.model_validate(article)
