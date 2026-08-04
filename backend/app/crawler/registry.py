from typing import Iterator

from app.crawler.base import CrawlerProvider

_PROVIDERS: dict[str, CrawlerProvider] = {}


def register(provider: CrawlerProvider) -> None:
    _PROVIDERS[provider.source] = provider


def get(source: str) -> CrawlerProvider | None:
    return _PROVIDERS.get(source)


def all() -> Iterator[CrawlerProvider]:
    return iter(_PROVIDERS.values())


def sources() -> list[str]:
    return list(_PROVIDERS.keys())