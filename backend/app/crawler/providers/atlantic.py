import json
import re

from bs4 import BeautifulSoup

from app.crawler.base import CrawlerProvider, RawArticle

BASE = "https://www.theatlantic.com"

SECTIONS = [
    "ideas",
    "health",
    "culture",
    "technology",
    "family",
]

_NEXT_DATA_RE = re.compile(
    r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',
    re.S,
)


class AtlanticProvider(CrawlerProvider):
    source = "atlantic"
    label = "The Atlantic"
    default_difficulty = "advanced"
    min_interval = 3.0
    failure_threshold = 3

    def _section_links(self, section: str, limit: int) -> list[str]:
        soup = self.soup(f"{BASE}/{section}/")
        links: list[str] = []
        for anchor in soup.select(f'a[href*="/{section}/"]'):
            href = anchor.get("href", "").split("?")[0]
            if not href.startswith(f"{BASE}/{section}/"):
                continue
            rest = href[len(f"{BASE}/{section}/"):]
            if rest[:4].isdigit() and href not in links:
                links.append(href)
        return links[:limit]

    def _article_paragraphs(self, html: str) -> list[str]:
        match = _NEXT_DATA_RE.search(html)
        if match is None:
            return []
        try:
            data = json.loads(match.group(1))
        except ValueError:
            return []
        state = data.get("props", {}).get("pageProps", {}).get("urqlState", {})
        paragraphs: list[str] = []
        for entry in state.values():
            if not isinstance(entry, dict) or "data" not in entry:
                continue
            try:
                parsed = json.loads(entry["data"])
            except ValueError:
                continue
            if not isinstance(parsed, dict):
                continue
            article = parsed.get("article")
            if not isinstance(article, dict):
                continue
            for block in article.get("content") or []:
                inner_html = block.get("innerHtml") if isinstance(block, dict) else None
                if not inner_html:
                    continue
                text = BeautifulSoup(inner_html, "html.parser").get_text(" ", strip=True)
                if text:
                    paragraphs.append(text)
            if paragraphs:
                break
        return paragraphs

    def fetch_articles(self, limit: int) -> list[RawArticle]:
        per_section = max(1, limit // len(SECTIONS))
        result: list[RawArticle] = []
        for section in SECTIONS:
            for url in self._section_links(section, per_section):
                html = self.fetch_raw(url)
                paragraphs = self._article_paragraphs(html)
                title = ""
                soup = BeautifulSoup(html, "html.parser")
                if soup.title and soup.title.string:
                    title = re.sub(r"\s*-\s*The Atlantic\s*$", "", soup.title.string).strip()
                result.append(
                    RawArticle(
                        title=title,
                        paragraphs=paragraphs,
                        source=self.source,
                        source_url=url,
                        difficulty=self.default_difficulty,
                        tags=section,
                        image_url=self.extract_og_image(soup),
                    )
                )
        return result
