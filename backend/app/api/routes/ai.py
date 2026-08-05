"""AI 助手路由：对话（SSE 流式）、模型配置、笔记。"""

from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.chat import run_chat
from app.ai.providers import ZEN_FREE_MODELS, resolve_model_source
from app.api.routes.auth import get_current_user
from app.database import get_db
from app.models import Note, User
from app.schemas import (
    AIConfigIn,
    AIConfigOut,
    ChatIn,
    NoteIn,
    NoteOut,
)

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.get("/config", response_model=AIConfigOut)
def get_ai_config(
    user: User = Depends(get_current_user),
) -> AIConfigOut:
    source = resolve_model_source(user)
    return AIConfigOut(
        provider=source.provider_id,
        base_url=user.ai_base_url if user.ai_base_url else None,
        model=user.ai_model if user.ai_model else None,
        has_api_key=bool(user.ai_api_key),
    )


@router.put("/config", response_model=AIConfigOut)
def update_ai_config(
    payload: AIConfigIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AIConfigOut:
    api_key = payload.api_key.strip()
    if not api_key:
        # 清空 BYOK，回退 Zen 免费
        user.ai_base_url = None
        user.ai_api_key = None
        user.ai_model = None
    else:
        user.ai_base_url = payload.base_url.strip() or None
        user.ai_api_key = api_key
        user.ai_model = payload.model.strip() or None
    db.commit()
    source = resolve_model_source(user)
    return AIConfigOut(
        provider=source.provider_id,
        base_url=user.ai_base_url,
        model=user.ai_model,
        has_api_key=bool(user.ai_api_key),
    )


@router.get("/models")
def list_models() -> dict[str, Any]:
    return {"default_provider": "zen-free", "default_model": "deepseek-v4-flash-free", "zen_free_models": ZEN_FREE_MODELS}


def _build_messages(payload: ChatIn, db: Session, user: User) -> list[dict[str, Any]]:
    """构造 messages：可注入文章/选中文本上下文。"""
    messages: list[dict[str, Any]] = [
        {"role": m.role, "content": m.content} for m in payload.messages
    ]
    if payload.article_id:
        from app.models import Article

        article = db.get(Article, payload.article_id)
        if article:
            messages.insert(
                0,
                {
                    "role": "user",
                    "content": (
                        f"[系统注入] 用户正在阅读本站文章《{article.title}》"
                        f"（难度:{article.difficulty}）。\n正文如下：\n"
                        f"{article.content[:4000]}\n"
                        "请结合这篇文章回答用户接下来的问题。"
                    ),
                },
            )
    if payload.selected_text:
        messages.insert(
            0,
            {
                "role": "user",
                "content": (
                    f"[系统注入] 用户选中了以下文本，请优先围绕它回答（翻译/解释/总结）：\n"
                    f"---选中文本---\n{payload.selected_text[:1500]}\n---"
                ),
            },
        )
    return messages


@router.post("/chat")
def chat(
    payload: ChatIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    messages = _build_messages(payload, db, user)
    source = resolve_model_source(user)

    def event_stream() -> Any:
        for event in run_chat(messages, db, user, source, stream=True):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ---- 笔记 ----

@router.get("/notes", response_model=list[NoteOut])
def list_notes(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Note]:
    return list(
        db.scalars(
            select(Note)
            .where(Note.user_id == user.id)
            .order_by(Note.created_at.desc())
            .limit(100)
        )
    )


@router.post("/notes", response_model=NoteOut, status_code=201)
def create_note(
    payload: NoteIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Note:
    note = Note(
        user_id=user.id,
        content=payload.content,
        article_id=payload.article_id,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.delete("/notes/{note_id}", status_code=204)
def delete_note(
    note_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    note = db.scalars(
        select(Note).where(Note.id == note_id, Note.user_id == user.id)
    ).first()
    if note is None:
        raise HTTPException(status_code=404, detail="笔记不存在")
    db.delete(note)
    db.commit()
