from app.crawler.registry import register
from app.crawler.providers.atlantic import AtlanticProvider
from app.crawler.providers.guardian import GuardianProvider
from app.crawler.providers.voa import VOAProvider

register(VOAProvider())
register(GuardianProvider())
register(AtlanticProvider())
