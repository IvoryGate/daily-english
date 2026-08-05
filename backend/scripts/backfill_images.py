"""回填脚本：给已有文章的 image_url 补图（抓原文页 og:image）。

用法：
    ./.venv/bin/python -m scripts.backfill_images [--limit 44]

幂等：只处理 image_url 为空的文章。单个失败不中断。
"""

import sys
import time

import requests
from bs4 import BeautifulSoup
from sqlalchemy import select

from app.database import SessionLocal
from app.models import Article

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}
TIMEOUT = 12
INTERVAL = 1.0  # 限速，礼貌抓取


def extract_og_image(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for selector in [
        'meta[property="og:image"][content]',
        'meta[name="twitter:image"][content]',
    ]:
        meta = soup.select_one(selector)
        if meta and meta.get("content"):
            return meta["content"].strip()
    img = soup.select_one(".wsw img, article img, .article-body img, figure img")
    if img:
        src = img.get("src") or img.get("data-src") or ""
        if src:
            return src.strip()
    return ""


def main() -> None:
    limit = 1000
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])

    db = SessionLocal()
    try:
        articles = db.scalars(
            select(Article).where(Article.image_url.is_(None)).limit(limit)
        ).all()
        print(f"待回填 {len(articles)} 篇")
        ok = skip = fail = 0
        for article in articles:
            if not article.source_url:
                skip += 1
                continue
            try:
                resp = requests.get(article.source_url, headers=HEADERS, timeout=TIMEOUT)
                resp.raise_for_status()
                url = extract_og_image(resp.text)
                if url:
                    article.image_url = url
                    ok += 1
                    print(f"  ✓ {article.id} {article.title[:30]} -> {url[:60]}")
                else:
                    skip += 1
                    print(f"  - {article.id} 无图")
            except Exception as exc:
                fail += 1
                print(f"  ✗ {article.id} {exc}")
            db.commit()
            time.sleep(INTERVAL)
        print(f"\n完成：成功 {ok}，无图 {skip}，失败 {fail}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
