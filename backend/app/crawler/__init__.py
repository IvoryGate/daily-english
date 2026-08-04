import app.crawler.providers as _providers  # noqa: F401  导入即注册全部来源
from app.crawler.run import crawl

__all__ = ["crawl"]
