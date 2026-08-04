from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crawler import crawl
from app.crawler.registry import sources
from app.database import get_db

router = APIRouter(prefix="/api/crawl", tags=["crawl"])


@router.get("/sources")
def list_sources() -> dict:
    """列出所有已注册的可抓取来源。"""
    return {"sources": sources()}


@router.post("")
def trigger_crawl(
    source: str | None = None,
    db: Session = Depends(get_db),
) -> dict:
    """触发一次抓取。source 为空时抓全部已注册来源；逗号分隔可抓多个。"""
    requested = [s.strip() for s in source.split(",") if s.strip()] if source else None
    try:
        return crawl(db, sources=requested)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"抓取失败: {exc}") from exc
