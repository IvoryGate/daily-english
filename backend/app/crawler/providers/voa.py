from app.crawler.base import CrawlerProvider, RawArticle

BASE = "https://learningenglish.voanews.com"

COLUMNS = [
    ("American Stories", 1579, "advanced"),
    ("As It Is", 1581, "intermediate"),
    ("Science & Technology", 3619, "advanced"),
    ("Health & Lifestyle", 955, "intermediate"),
    ("Everyday Grammar", 986, "intermediate"),
    ("Words & Their Stories", 987, "advanced"),
]


class VOAProvider(CrawlerProvider):
    source = "voa"
    label = "VOA Learning English"
    default_difficulty = "intermediate"
    min_interval = 1.0

    def _column_links(self, column_id: int, limit: int) -> list[str]:
        soup = self.soup(f"{BASE}/z/{column_id}")
        links: list[str] = []
        for anchor in soup.select('a[href*="/a/"]'):
            href = anchor.get("href", "").split("?")[0]
            if href.startswith("/a/"):
                full = f"{BASE}{href}"
                if full not in links:
                    links.append(full)
        return links[:limit]

    def fetch_articles(self, limit: int) -> list[RawArticle]:
        per_column = max(1, limit // len(COLUMNS))
        result: list[RawArticle] = []
        for column_name, column_id, difficulty in COLUMNS:
            for url in self._column_links(column_id, per_column):
                soup = self.soup(url)
                title = ""
                if soup.title and soup.title.string:
                    title = soup.title.string.strip()
                paragraphs: list[str] = []
                body = soup.select_one("div.wsw")
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
                        difficulty=difficulty,
                        tags=column_name,
                        image_url=self.extract_og_image(soup),
                    )
                )
        return result