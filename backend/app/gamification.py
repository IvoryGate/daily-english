"""游戏化逻辑：等级、成就、streak。纯函数，便于复用与测试。"""

from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import ReviewHistory, User, VocabularyEntry

# ---- 等级体系（Lv1~Lv5），基于累计学习量 ----

LEVELS = [
    {"level": 1, "name": "入门", "min_points": 0, "hint": "开始你的第一篇文章"},
    {"level": 2, "name": "进阶", "min_points": 50, "hint": "坚持阅读，语感在积累"},
    {"level": 3, "name": "熟手", "min_points": 150, "hint": "已经能顺畅读完大部分短文"},
    {"level": 4, "name": "高手", "min_points": 400, "hint": "词汇量在稳步爬升"},
    {"level": 5, "name": "大神", "min_points": 800, "hint": "接近母语阅读者"},
]


def compute_points(
    read_count: int, vocab_count: int, review_count: int
) -> int:
    """学习积分：读 1 篇 10 分，收 1 生词 5 分，复习 1 词 1 分。"""
    return read_count * 10 + vocab_count * 5 + review_count


def get_level(points: int) -> dict:
    current = LEVELS[0]
    for lv in LEVELS:
        if points >= lv["min_points"]:
            current = lv
    next_lv = None
    for lv in LEVELS:
        if lv["min_points"] > points:
            next_lv = lv
            break
    return {
        "level": current["level"],
        "name": current["name"],
        "hint": current["hint"],
        "points": points,
        "next_level_points": next_lv["min_points"] if next_lv else None,
    }


# ---- 每日打卡（读 + 复习双达标） ----

def local_today() -> date:
    # 存储统一用 UTC（datetime.utcnow），天数判断也按 UTC，保持一致
    return datetime.utcnow().date()


def day_progress(
    db: Session,
    user: User,
    day: date,
) -> dict:
    """某天的学习情况：阅读数 / 复习数 / 是否达标。"""
    start = datetime(day.year, day.month, day.day)
    end = datetime(day.year, day.month, day.day, 23, 59, 59, 999999)

    # 阅读数：当天有阅读记录的文章数
    from app.models import ReadingRecord

    read_count = db.scalar(
        select(func.count(func.distinct(ReadingRecord.article_id))).where(
            ReadingRecord.user_id == user.id,
            ReadingRecord.read_at >= start,
            ReadingRecord.read_at <= end,
        )
    ) or 0

    review_count = db.scalar(
        select(func.count()).where(
            ReviewHistory.user_id == user.id,
            ReviewHistory.reviewed_at >= start,
            ReviewHistory.reviewed_at <= end,
        )
    ) or 0

    read_done = read_count >= (user.daily_read_goal or 1)
    review_done = review_count >= (user.daily_review_goal or 1)
    return {
        "read_count": read_count,
        "review_count": review_count,
        "read_goal": user.daily_read_goal or 1,
        "review_goal": user.daily_review_goal or 1,
        "checked_in": read_done and review_done,
    }


def compute_streak(db: Session, user: User) -> int:
    """连续打卡天数：从今天往回数，今天未达标不算断（但也不计入，除非达标）。"""
    streak = 0
    today = local_today()
    # 今天先判一次：达标则从今天开始算
    if day_progress(db, user, today)["checked_in"]:
        streak = 1
    # 从昨天往回数
    cursor = today
    while True:
        cursor = date.fromordinal(cursor.toordinal() - 1)
        if day_progress(db, user, cursor)["checked_in"]:
            streak += 1
        else:
            break
        if streak > 365:
            break
    return streak


# ---- 成就 ----

ACHIEVEMENTS = [
    {"key": "first_read", "name": "初来乍到", "desc": "读完第一篇文章", "icon": "📖"},
    {"key": "read_10", "name": "十日谈", "desc": "累计读完 10 篇文章", "icon": "📚"},
    {"key": "read_50", "name": "读书破万卷", "desc": "累计读完 50 篇文章", "icon": "🗂️"},
    {"key": "vocab_20", "name": "词汇新芽", "desc": "收录 20 个生词", "icon": "🌱"},
    {"key": "vocab_100", "name": "词汇达人", "desc": "收录 100 个生词", "icon": "🌳"},
    {"key": "review_50", "name": "温故知新", "desc": "累计复习 50 次", "icon": "🔁"},
    {"key": "streak_3", "name": "三连击", "desc": "连续打卡 3 天", "icon": "🔥"},
    {"key": "streak_7", "name": "一周坚持", "desc": "连续打卡 7 天", "icon": "⭐"},
    {"key": "streak_30", "name": "月度战士", "desc": "连续打卡 30 天", "icon": "🏆"},
]


def evaluate_achievements(
    db: Session, user: User, stats: dict, streak: int
) -> list[dict]:
    """根据当前统计判断已满足哪些成就（不管是否已解锁，返回满足条件的）。"""
    read_count = stats.get("read_count", 0)
    vocab_count = stats.get("vocab_count", 0)
    review_count = stats.get("review_count", 0)

    rules: dict[str, bool] = {
        "first_read": read_count >= 1,
        "read_10": read_count >= 10,
        "read_50": read_count >= 50,
        "vocab_20": vocab_count >= 20,
        "vocab_100": vocab_count >= 100,
        "review_50": review_count >= 50,
        "streak_3": streak >= 3,
        "streak_7": streak >= 7,
        "streak_30": streak >= 30,
    }
    return [
        {**a, "unlocked": bool(rules.get(a["key"], False))}
        for a in ACHIEVEMENTS
    ]


def total_counts(db: Session, user: User) -> dict:
    from app.models import Bookmark, ReadingRecord

    read_count = db.scalar(
        select(func.count(func.distinct(ReadingRecord.article_id))).where(
            ReadingRecord.user_id == user.id
        )
    ) or 0
    vocab_count = db.scalar(
        select(func.count()).where(VocabularyEntry.user_id == user.id)
    ) or 0
    review_count = db.scalar(
        select(func.count()).where(ReviewHistory.user_id == user.id)
    ) or 0
    bookmark_count = db.scalar(
        select(func.count()).where(Bookmark.user_id == user.id)
    ) or 0
    return {
        "read_count": read_count,
        "vocab_count": vocab_count,
        "review_count": review_count,
        "bookmark_count": bookmark_count,
    }


def heatmap_data(db: Session, user: User, days: int = 182) -> list[dict]:
    """近 days 天的每日阅读数+复习数，用于热力图。"""
    from app.models import ReadingRecord

    since = datetime.combine(
        date.fromordinal(local_today().toordinal() - days + 1), datetime.min.time()
    )
    read_rows = db.execute(
        select(func.date(ReadingRecord.read_at), func.count(func.distinct(ReadingRecord.article_id)))
        .where(
            ReadingRecord.user_id == user.id,
            ReadingRecord.read_at >= since,
        )
        .group_by(func.date(ReadingRecord.read_at))
    ).all()
    review_rows = db.execute(
        select(func.date(ReviewHistory.reviewed_at), func.count())
        .where(
            ReviewHistory.user_id == user.id,
            ReviewHistory.reviewed_at >= since,
        )
        .group_by(func.date(ReviewHistory.reviewed_at))
    ).all()

    read_map = {str(k): v for k, v in read_rows}
    review_map = {str(k): v for k, v in review_rows}

    result = []
    start = date.fromordinal(local_today().toordinal() - days + 1)
    for i in range(days):
        d = date.fromordinal(start.toordinal() + i)
        key = d.isoformat()
        result.append(
            {
                "date": key,
                "reads": read_map.get(key, 0),
                "reviews": review_map.get(key, 0),
            }
        )
    return result


def vocabulary_curve(db: Session, user: User, days: int = 90) -> list[dict]:
    """近 days 天的每日累计生词量曲线（按 added_at 累计）。"""
    since = datetime.combine(
        date.fromordinal(local_today().toordinal() - days + 1), datetime.min.time()
    )
    rows = db.execute(
        select(func.date(VocabularyEntry.added_at), func.count())
        .where(
            VocabularyEntry.user_id == user.id,
            VocabularyEntry.added_at >= since,
        )
        .group_by(func.date(VocabularyEntry.added_at))
    ).all()
    daily_map = {str(k): v for k, v in rows}

    result = []
    cumulative = 0
    start = date.fromordinal(local_today().toordinal() - days + 1)
    for i in range(days):
        d = date.fromordinal(start.toordinal() + i)
        key = d.isoformat()
        cumulative += daily_map.get(key, 0)
        result.append({"date": key, "total": cumulative})
    return result


def review_trend(db: Session, user: User, days: int = 30) -> list[dict]:
    """近 days 天每日复习次数趋势。"""
    since = datetime.combine(
        date.fromordinal(local_today().toordinal() - days + 1), datetime.min.time()
    )
    rows = db.execute(
        select(func.date(ReviewHistory.reviewed_at), func.count())
        .where(
            ReviewHistory.user_id == user.id,
            ReviewHistory.reviewed_at >= since,
        )
        .group_by(func.date(ReviewHistory.reviewed_at))
    ).all()
    daily_map = {str(k): v for k, v in rows}

    result = []
    start = date.fromordinal(local_today().toordinal() - days + 1)
    for i in range(days):
        d = date.fromordinal(start.toordinal() + i)
        key = d.isoformat()
        result.append({"date": key, "count": daily_map.get(key, 0)})
    return result


def mastered_vocab(db: Session, user: User) -> int:
    """已掌握生词数：FSRS state>=2 且 reps>=3 视为掌握。"""
    rows = db.scalars(
        select(VocabularyEntry.card).where(VocabularyEntry.user_id == user.id)
    ).all()
    mastered = 0
    for card in rows:
        if not isinstance(card, dict):
            continue
        if (card.get("state") or 0) >= 2 and (card.get("reps") or 0) >= 3:
            mastered += 1
    return mastered


# 词表各级总词数（后端 word_lists.json 的实际规模，随数据更新）
_LEVEL_SIZE = {
    "junior": 1603,
    "senior": 3677,
    "cet4": 3849,
    "cet6": 5407,
    "ielts": 5040,
    "toefl": 6974,
    "tem8": 2758,
    "advanced": 10556,
}
_LEVEL_ORDER = ["junior", "senior", "cet4", "cet6", "ielts", "toefl", "tem8", "advanced"]


def vocab_estimate(db: Session, user: User) -> dict:
    """估算用户词汇量：按已掌握生词在 8 级的分布，外推总词汇量。

    模型（能力单调假设）：
      - 每级「已掌握数」来自生词本中 FSRS 已掌握的词（state>=2 且 reps>=3）
      - 掌握比例 r_lv = 已掌握数 / 该级词表总量；由低到高逐级累计，
        且保证低级别比例不低于高级别（能力单调：会高级词必然也会低级词）
      - 估算词汇量 = Σ(每级总词数 × 有效掌握比例)
    返回 {estimate, per_level:[{level,label,total,owned}]}
    """
    from app.crawler.lemmatize import lemmatize
    from app.crawler.word_level import level_of

    rows = db.execute(
        select(VocabularyEntry.word, VocabularyEntry.card).where(
            VocabularyEntry.user_id == user.id
        )
    ).all()
    mastered_by_level: dict[str, int] = {lv: 0 for lv in _LEVEL_ORDER}
    for word, card in rows:
        if not isinstance(card, dict):
            card = {}
        if (card.get("state") or 0) < 2 or (card.get("reps") or 0) < 3:
            continue
        base = lemmatize(word.strip().lower())
        lv = level_of(base)
        mastered_by_level[lv] = mastered_by_level.get(lv, 0) + 1

    # 由低到高累积有效比例（能力单调：低级别比例取已出现过的最大比例）
    per_level = []
    running = 0.0
    estimate = 0
    for lv in _LEVEL_ORDER:
        size = _LEVEL_SIZE.get(lv, 1000)
        ratio = max(mastered_by_level[lv] / size if size else 0.0, running)
        running = ratio
        owned_est = int(size * ratio)
        estimate += owned_est
        per_level.append(
            {
                "level": lv,
                "label": _level_label(lv),
                "total": size,
                "owned": owned_est,
            }
        )

    total_mastered = sum(mastered_by_level.values())
    # 数据稀疏保护：已掌握生词太少时统计无意义，不外推（直接给已掌握数）
    if total_mastered < 10:
        estimate = total_mastered
    # 底线：估算至少等于实际已掌握生词总数
    estimate = max(estimate, total_mastered)
    return {"estimate": estimate, "per_level": per_level}


def _level_label(level: str) -> str:
    labels = {
        "junior": "初中",
        "senior": "高中",
        "cet4": "四级",
        "cet6": "六级",
        "ielts": "雅思",
        "toefl": "托福",
        "tem8": "专八",
        "advanced": "超纲",
    }
    return labels.get(level, level)
