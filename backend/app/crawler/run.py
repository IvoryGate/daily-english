from typing import cast

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.crawler.base import CrawlerProvider
from app.crawler.normalizer import (
    clean_paragraphs,
    compute_read_time,
    count_words,
    make_excerpt,
    now_iso,
)
from app.crawler.registry import all as all_providers
from app.crawler.registry import get as get_provider
from app.crawler.throttle import CircuitOpenError
from app.models import Article

MIN_WORDS = 80


def crawl(
    db: Session,
    sources: list[str] | None = None,
    per_source: int = 6,
) -> dict:
    """遍历已注册的来源抓取入库（可插拔，按 source_url 幂等去重）。"""
    providers: list[CrawlerProvider]
    if sources:
        providers = [
            cast(CrawlerProvider, get_provider(s))
            for s in sources
            if get_provider(s) is not None
        ]
    else:
        providers = list(all_providers())
    existing = set(
        db.scalars(
            select(Article.source_url).where(Article.source_url.isnot(None))
        ).all()
    )
    result: dict = {"by_source": {}}

    for provider in providers:
        stat = {
            "source": provider.source,
            "inserted": 0,
            "skipped": 0,
            "errors": 0,
            "circuit_open": False,
        }
        try:
            items = provider.fetch_articles(per_source)
        except CircuitOpenError as exc:
            print(f"[crawler] {provider.source} 熔断，跳过本批: {exc}")
            stat["circuit_open"] = True
            result["by_source"][provider.source] = stat
            continue
        except Exception as exc:
            print(f"[crawler] {provider.source} 抓取失败: {exc}")
            stat["errors"] += 1
            result["by_source"][provider.source] = stat
            continue

        for item in items:
            if item.source_url in existing:
                stat["skipped"] += 1
                continue
            paragraphs = clean_paragraphs(item.paragraphs)
            words = count_words(paragraphs)
            if words < MIN_WORDS:
                stat["skipped"] += 1
                continue
            db.add(
                Article(
                    title=item.title,
                    excerpt=make_excerpt(paragraphs),
                    content="\n\n".join(paragraphs),
                    difficulty=item.difficulty,
                    tags=item.tags,
                    read_time_minutes=compute_read_time(words),
                    created_at=now_iso(),
                    source=item.source,
                    source_url=item.source_url,
                    image_url=item.image_url or None,
                )
            )
            existing.add(item.source_url)
            stat["inserted"] += 1

        db.commit()
        result["by_source"][provider.source] = stat

    result["inserted"] = sum(
        v["inserted"] for v in result["by_source"].values()
    )
    return result


def main() -> None:
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        print(crawl(db))
    finally:
        db.close()


if __name__ == "__main__":
    main()
