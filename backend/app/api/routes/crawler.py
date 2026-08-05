from fastapi import APIRouter, Depends, HTTPException

from app.api.routes.auth import get_current_user
from app.crawler.registry import sources
from app.crawler.tasks import scheduler
from app.models import User

router = APIRouter(prefix="/api/crawl", tags=["crawl"])


def _require_admin(user: User) -> None:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="需要管理员权限")


@router.get("/sources")
def list_sources() -> dict:
    """列出所有已注册的可抓取来源。"""
    return {"sources": sources()}


@router.post("")
def trigger_crawl(
    source: str | None = None,
    user: User = Depends(get_current_user),
) -> dict:
    """异步触发一次抓取（仅管理员）。立即返回任务 id。"""
    _require_admin(user)
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
