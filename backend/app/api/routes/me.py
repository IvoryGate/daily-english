from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.routes.auth import get_current_user
from app.database import get_db
from app.models import Article, Bookmark, ReadingRecord, User, VocabularyEntry
from app.schemas import (
    BookmarkOut,
    MeData,
    ReadingIn,
    ReadingOut,
    VocabCreate,
    VocabOut,
    VocabUpdate,
)

router = APIRouter(prefix="/api/me", tags=["me"])


def _save(db: Session, obj) -> None:
    db.add(obj)
    db.commit()
    db.refresh(obj)


def _get_vocab(db: Session, user: User, word: str) -> VocabularyEntry:
    entry = db.scalars(
        select(VocabularyEntry).where(
            VocabularyEntry.user_id == user.id,
            VocabularyEntry.word == word,
        )
    ).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="生词不存在")
    return entry


def _require_article(db: Session, article_id: int) -> None:
    if db.get(Article, article_id) is None:
        raise HTTPException(status_code=404, detail="文章不存在")


# ---- 合集（前端登录后一次拉全量，15.4 数据切换用） ----

@router.get("/data", response_model=MeData)
def get_me_data(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeData:
    vocabulary = db.scalars(
        select(VocabularyEntry)
        .where(VocabularyEntry.user_id == user.id)
        .order_by(VocabularyEntry.added_at.desc())
    ).all()
    bookmarks = db.scalars(
        select(Bookmark.article_id).where(Bookmark.user_id == user.id)
    ).all()
    reading = db.scalars(
        select(ReadingRecord)
        .where(ReadingRecord.user_id == user.id)
        .order_by(ReadingRecord.read_at.desc())
    ).all()
    return MeData(
        user=user,
        vocabulary=list(vocabulary),
        bookmarks=list(bookmarks),
        reading=list(reading),
    )


# ---- 生词本 ----

@router.get("/vocabulary", response_model=list[VocabOut])
def list_vocabulary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[VocabularyEntry]:
    return list(
        db.scalars(
            select(VocabularyEntry)
            .where(VocabularyEntry.user_id == user.id)
            .order_by(VocabularyEntry.added_at.desc())
        )
    )


@router.post("/vocabulary", response_model=VocabOut, status_code=201)
def add_vocabulary(
    payload: VocabCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> VocabularyEntry:
    existing = db.scalars(
        select(VocabularyEntry).where(
            VocabularyEntry.user_id == user.id,
            VocabularyEntry.word == payload.word,
        )
    ).first()
    if existing is not None:
        raise HTTPException(status_code=400, detail="该词已在生词本中")
    entry = VocabularyEntry(
        user_id=user.id,
        word=payload.word,
        phonetic=payload.phonetic,
        definition=payload.definition,
        source_title=payload.source_title,
        card=payload.card or {},
    )
    _save(db, entry)
    return entry


@router.patch("/vocabulary/{word}", response_model=VocabOut)
def update_vocabulary(
    word: str,
    payload: VocabUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> VocabularyEntry:
    entry = _get_vocab(db, user, word)
    if payload.phonetic is not None:
        entry.phonetic = payload.phonetic
    if payload.definition is not None:
        entry.definition = payload.definition
    if payload.source_title is not None:
        entry.source_title = payload.source_title
    if payload.card is not None:
        entry.card = payload.card
    _save(db, entry)
    return entry


@router.delete("/vocabulary/{word}", status_code=204)
def delete_vocabulary(
    word: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    entry = _get_vocab(db, user, word)
    db.delete(entry)
    db.commit()


# ---- 收藏 / 稍后读 ----

@router.get("/bookmarks", response_model=list[int])
def list_bookmarks(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[int]:
    return list(
        db.scalars(
            select(Bookmark.article_id).where(Bookmark.user_id == user.id)
        )
    )


@router.post("/bookmarks/{article_id}", response_model=BookmarkOut, status_code=201)
def add_bookmark(
    article_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Bookmark:
    _require_article(db, article_id)
    existing = db.scalars(
        select(Bookmark).where(
            Bookmark.user_id == user.id,
            Bookmark.article_id == article_id,
        )
    ).first()
    if existing is not None:
        raise HTTPException(status_code=400, detail="已在收藏中")
    bookmark = Bookmark(user_id=user.id, article_id=article_id)
    _save(db, bookmark)
    return bookmark


@router.delete("/bookmarks/{article_id}", status_code=204)
def remove_bookmark(
    article_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    bookmark = db.scalars(
        select(Bookmark).where(
            Bookmark.user_id == user.id,
            Bookmark.article_id == article_id,
        )
    ).first()
    if bookmark is None:
        raise HTTPException(status_code=404, detail="不在收藏中")
    db.delete(bookmark)
    db.commit()


# ---- 阅读记录（已读 + 进度，按文章 upsert） ----

@router.get("/reading", response_model=list[ReadingOut])
def list_reading(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ReadingRecord]:
    return list(
        db.scalars(
            select(ReadingRecord)
            .where(ReadingRecord.user_id == user.id)
            .order_by(ReadingRecord.read_at.desc())
        )
    )


@router.put("/reading/{article_id}", response_model=ReadingOut)
def upsert_reading(
    article_id: int,
    payload: ReadingIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReadingRecord:
    _require_article(db, article_id)
    record = db.scalars(
        select(ReadingRecord).where(
            ReadingRecord.user_id == user.id,
            ReadingRecord.article_id == article_id,
        )
    ).first()
    if record is None:
        record = ReadingRecord(
            user_id=user.id,
            article_id=article_id,
            progress=payload.progress,
        )
    else:
        record.progress = payload.progress
    if payload.read_at is not None:
        record.read_at = payload.read_at
    _save(db, record)
    return record


@router.delete("/reading/{article_id}", status_code=204)
def remove_reading(
    article_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    record = db.scalars(
        select(ReadingRecord).where(
            ReadingRecord.user_id == user.id,
            ReadingRecord.article_id == article_id,
        )
    ).first()
    if record is None:
        raise HTTPException(status_code=404, detail="没有该阅读记录")
    db.delete(record)
    db.commit()
