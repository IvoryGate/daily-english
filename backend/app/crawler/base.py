from abc import ABC, abstractmethod

from bs4 import BeautifulSoup

from app.crawler.throttle import SafeFetcher


class RawArticle:
    def __init__(
        self,
        title: str,
        paragraphs: list[str],
        source: str,
        source_url: str,
        difficulty: str,
        tags: str,
    ) -> None:
        self.title = title
        self.paragraphs = paragraphs
        self.source = source
        self.source_url = source_url
        self.difficulty = difficulty
        self.tags = tags


class CrawlerProvider(ABC):
    """爬虫来源的可插拔基类。新增一个刊物只需继承并实现 fetch_articles。"""

    source: str = ""
    label: str = ""
    default_difficulty: str = "advanced"
    min_interval: float = 1.5
    failure_threshold: int = 5

    def __init__(self) -> None:
        self.fetcher = SafeFetcher(
            min_interval=self.min_interval,
            failure_threshold=self.failure_threshold,
        )

    @abstractmethod
    def fetch_articles(self, limit: int) -> list[RawArticle]:
        """抓取该来源最多 limit 篇最新文章并解析为 RawArticle。"""

    def soup(self, url: str) -> BeautifulSoup:
        return BeautifulSoup(self.fetcher.get(url).text, "html.parser")

    def fetch_raw(self, url: str) -> str:
        return self.fetcher.get(url).text