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
        image_url: str = "",
    ) -> None:
        self.title = title
        self.paragraphs = paragraphs
        self.source = source
        self.source_url = source_url
        self.difficulty = difficulty
        self.tags = tags
        self.image_url = image_url


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

    def extract_og_image(self, soup: BeautifulSoup) -> str:
        """从页面提取 og:image（社交分享图），作为文章配图。"""
        for selector in [
            'meta[property="og:image"][content]',
            'meta[name="twitter:image"][content]',
        ]:
            meta = soup.select_one(selector)
            if meta and meta.get("content"):
                return meta["content"].strip()
        # 兜底：文章正文第一张图
        img = soup.select_one(".wsw img, article img, .article-body img")
        if img:
            src = img.get("src") or img.get("data-src") or ""
            if src:
                return src.strip()
        return ""