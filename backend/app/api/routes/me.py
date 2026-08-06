from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
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


# ---- 数据管理（15.5 个人后台） ----

@router.delete("/data", status_code=204)
def clear_me_data(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """清空当前用户的全部个人数据（生词/收藏/阅读记录）。"""
    db.execute(delete(VocabularyEntry).where(VocabularyEntry.user_id == user.id))
    db.execute(delete(Bookmark).where(Bookmark.user_id == user.id))
    db.execute(delete(ReadingRecord).where(ReadingRecord.user_id == user.id))
    db.commit()


# ---- 游戏化（18 学习体系） ----

from app.gamification import (  # noqa: E402
    compute_points,
    compute_streak,
    day_progress,
    evaluate_achievements,
    get_level,
    heatmap_data,
    local_today,
    mastered_vocab,
    review_trend,
    total_counts,
    vocab_estimate,
    vocabulary_curve,
)
from app.models import Achievement, ReviewHistory  # noqa: E402
from app.schemas import DailyGoalsIn, DailyGoalsOut, ReviewIn  # noqa: E402


def _unlock_achievements(
    db: Session, user: User, stats: dict, streak: int
) -> list[str]:
    """检查并解锁新达成的成就，返回本次新解锁的 key。"""
    satisfied = evaluate_achievements(db, user, stats, streak)
    newly = []
    for a in satisfied:
        if not a["unlocked"]:
            continue
        exists = db.scalars(
            select(Achievement).where(
                Achievement.user_id == user.id,
                Achievement.key == a["key"],
            )
        ).first()
        if exists is None:
            db.add(Achievement(user_id=user.id, key=a["key"]))
            newly.append(a["key"])
    if newly:
        db.commit()
    return newly


@router.post("/reviews", status_code=201)
def add_review(
    payload: ReviewIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """记录一次复习作答，并评估新成就。"""
    db.add(
        ReviewHistory(
            user_id=user.id,
            word=payload.word.strip().lower(),
            rating=payload.rating,
        )
    )
    db.commit()
    # 复习是高频学习动作，顺带评估并解锁新成就
    counts = total_counts(db, user)
    streak = compute_streak(db, user)
    newly = _unlock_achievements(db, user, counts, streak)
    return {"ok": True, "new_achievements": newly}


@router.get("/goals", response_model=DailyGoalsOut)
def get_goals(user: User = Depends(get_current_user)) -> DailyGoalsOut:
    return DailyGoalsOut(
        read_goal=user.daily_read_goal or 1,
        review_goal=user.daily_review_goal or 1,
    )


@router.put("/goals", response_model=DailyGoalsOut)
def update_goals(
    payload: DailyGoalsIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DailyGoalsOut:
    user.daily_read_goal = payload.read_goal
    user.daily_review_goal = payload.review_goal
    db.commit()
    return DailyGoalsOut(
        read_goal=user.daily_read_goal,
        review_goal=user.daily_review_goal,
    )


@router.get("/stats")
def get_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """学习统计聚合：等级/streak/今日进度/成就/热力图。"""
    counts = total_counts(db, user)
    points = compute_points(
        counts["read_count"], counts["vocab_count"], counts["review_count"]
    )
    level = get_level(points)
    streak = compute_streak(db, user)
    today = day_progress(db, user, local_today())
    achievements = evaluate_achievements(db, user, counts, streak)
    # 已解锁的 key 集合
    unlocked = set(
        db.scalars(
            select(Achievement.key).where(Achievement.user_id == user.id)
        )
    )
    for a in achievements:
        a["unlocked"] = a["key"] in unlocked
    # 尝试解锁新成就（读取时不写库，避免 GET 副作用；解锁放在写操作里）
    return {
        **counts,
        "points": points,
        "level": level,
        "streak": streak,
        "today": today,
        "achievements": achievements,
        "heatmap": heatmap_data(db, user),
        "vocabulary_curve": vocabulary_curve(db, user),
        "review_trend": review_trend(db, user),
        "mastered_vocab": mastered_vocab(db, user),
        "vocab_estimate": vocab_estimate(db, user),
    }


@router.get("/stats/heatmap")
def get_heatmap(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return {"heatmap": heatmap_data(db, user)}
