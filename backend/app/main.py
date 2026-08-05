from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import articles, auth, crawler, dictionary, me
from app.crawler.tasks import scheduler as crawl_scheduler
from app.seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时建表 + 灌入内置语料（幂等）
    seed()
    # 每天 08:00 自动增量抓取外部文章（风控已在 provider 内，幂等去重）
    sched = BackgroundScheduler(timezone="Asia/Shanghai")
    sched.add_job(
        crawl_scheduler.trigger_daily,
        "cron",
        hour=8,
        minute=0,
        id="daily_crawl",
        replace_existing=True,
    )
    sched.start()
    yield
    sched.shutdown(wait=False)


app = FastAPI(title="DailyEnglish API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(articles.router)
app.include_router(crawler.router)
app.include_router(auth.router)
app.include_router(me.router)
app.include_router(dictionary.router)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
