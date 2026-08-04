from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import articles, crawler
from app.seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时建表 + 灌入内置语料（幂等）
    seed()
    yield


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


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
