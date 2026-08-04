from fastapi import APIRouter, HTTPException

from app.crawler.registry import sources
from app.crawler.tasks import scheduler

router = APIRouter(prefix="/api/crawl", tags=["crawl"])


@router.get("/sources")
def list_sources() -> dict:
    """列出所有已注册的可抓取来源。"""
    return {"sources": sources()}


@router.post("")
def trigger_crawl(source: str | None = None) -> dict:
    """异步触发一次抓取，立即返回任务 id。source 为空抓全部；逗号分隔可抓多个。"""
    requested = (
        [s.strip() for s in source.split(",") if s.strip()] if source else None
    )
    try:
        task_id = scheduler.start(sources=requested)
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"task_id": task_id, "status": "running"}


@router.get("/status/{task_id}")
def task_status(task_id: str) -> dict:
    """查询抓取任务状态与结果。"""
    task = scheduler.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="任务不存在")
    return task
