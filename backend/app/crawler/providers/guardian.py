from app.crawler.base import CrawlerProvider, RawArticle

BASE = "https://www.theguardian.com"

SECTIONS = [
    "world",
    "science",
    "technology",
    "business",
    "environment",
]


class GuardianProvider(CrawlerProvider):
    source = "guardian"
    label = "The Guardian"
    default_difficulty = "advanced"
    min_interval = 1.5
    failure_threshold = 6

    def _section_links(self, section: str, limit: int) -> list[str]:
        soup = self.soup(f"{BASE}/{section}")
        links: list[str] = []
        for anchor in soup.select(f'a[href*="/{section}/"]'):
            href = anchor.get("href", "").split("?")[0]
            if f"/{section}/" not in href:
                continue
            parts = href.split("/")
            if len(parts) >= 5 and parts[1] == section and len(parts[2]) == 4:
                full = f"{BASE}{href}" if href.startswith("/") else href
                if full not in links:
                    links.append(full)
        return links[:limit]

    def fetch_articles(self, limit: int) -> list[RawArticle]:
        per_section = max(1, limit // len(SECTIONS))
        result: list[RawArticle] = []
        for section in SECTIONS:
            for url in self._section_links(section, per_section):
                soup = self.soup(url)
                title = ""
                if soup.title and soup.title.string:
                    title = soup.title.string.strip()
                paragraphs: list[str] = []
                body = soup.select_one('div[data-gu-name="body"]')
                if body is None:
                    body = soup.select_one("div.article-body-commercial-selector")
                if body is not None:
                    for para in body.find_all("p"):
                        text = para.get_text(" ", strip=True)
                        if text:
                            paragraphs.append(text)
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