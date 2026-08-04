import re
from datetime import datetime, timezone

WORDS_PER_MINUTE = 200

NOISE_PATTERNS = [
    re.compile(r"^by\b", re.IGNORECASE),
    re.compile(r"^embed\b", re.IGNORECASE),
    re.compile(r"also of interest", re.IGNORECASE),
    re.compile(r"^share\b", re.IGNORECASE),
]


def _is_noise(text: str) -> bool:
    if len(text) < 24:
        return True
    return any(pattern.search(text) for pattern in NOISE_PATTERNS)


def clean_paragraphs(paragraphs: list[str]) -> list[str]:
    cleaned: list[str] = []
    for raw in paragraphs:
        text = re.sub(r"\s+", " ", raw).strip()
        if not text or _is_noise(text):
            continue
        cleaned.append(text)
    return cleaned


def count_words(paragraphs: list[str]) -> int:
    return sum(len(p.split()) for p in paragraphs)


def compute_read_time(words: int) -> int:
    return max(1, round(words / WORDS_PER_MINUTE))


def make_excerpt(paragraphs: list[str], limit: int = 180) -> str:
    excerpt = ""
    for paragraph in paragraphs:
        if len(excerpt) >= limit:
            break
        excerpt = f"{excerpt} {paragraph}".strip()
    return excerpt[:limit] if excerpt else ""


def now_iso() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)
