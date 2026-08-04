# DailyEnglish 阶段 05：后端 API（FastAPI 骨架、CORS、文章接口）

> 本文档是「阶段 05 后端 API」的详细开发记录，口语化、为博客积累素材。
> 记录真实命令、真实踩坑，不美化。

## 1. 背景：这一步到底要干什么

前端的"可点开的静态站"（阶段 04）是用 mock 数据跑的，后端目前只有个 `/api/health` 空壳。阶段 05 的目标是让后端真正能回答问题：

1. **目录结构**：按规划文档拆出 `schemas`、`api/routes`，不再全部堆在 `main.py`
2. **CORS**：允许前端 dev server（5173）跨端口访问，为联调做准备
3. **文章接口**：`GET /api/articles`（列表）+ `GET /api/articles/{id}`（详情）

**关键决策：这阶段数据先用内存 mock，不碰数据库。** 因为数据库在阶段 06 才做。这样前后端可以完全并行开发——前端 mock、后端 mock，两边数据结构先对齐，阶段 06 后端换数据库、阶段 07 前端切真接口，都是局部替换。

## 2. 目录结构

```
backend/app/
├── __init__.py
├── main.py            # FastAPI 入口：CORS、挂路由、health
├── schemas.py         # Pydantic 模型（API 响应的形状）
├── mock_data.py       # 内存 mock 文章数据（阶段 06 换成数据库）
└── api/
    ├── __init__.py
    └── routes/
        ├── __init__.py
        └── articles.py # 文章路由
```

## 3. Schemas：先定义"响应的形状"

用 Pydantic 定义 API 返回的数据结构，跟前端 `src/types/index.ts` 一一对应：

```python
Difficulty = Literal["beginner", "intermediate", "advanced"]

class ArticleSummary(BaseModel):
    id: int
    title: str
    excerpt: str
    difficulty: Difficulty
    tags: list[str]
    read_time_minutes: int
    created_at: datetime

class ArticleDetail(ArticleSummary):
    content: str        # 详情多一个正文字段
```

列表接口返回 `ArticleSummary`（不带正文，省流量），详情返回 `ArticleDetail`（带正文）。字段名用 snake_case，和后面数据库字段一致（前端在联调时负责转 camelCase）。

## 4. 路由：用 APIRouter 拆出去

```python
router = APIRouter(prefix="/api/articles", tags=["articles"])

@router.get("", response_model=list[ArticleSummary])
def list_articles() -> list[ArticleSummary]:
    return [ArticleSummary.model_validate(a) for a in MOCK_ARTICLES]

@router.get("/{article_id}", response_model=ArticleDetail)
def get_article(article_id: int) -> ArticleDetail:
    article = next((a for a in MOCK_ARTICLES if a["id"] == article_id), None)
    if article is None:
        raise HTTPException(status_code=404, detail="文章不存在")
    return ArticleDetail.model_validate(article)
```

细节：

- `prefix="/api/articles"`，列表接口路径写 `""` 就是 `/api/articles`，详情写 `/{article_id}`。
- `response_model` 显式声明，FastAPI 负责校验和序列化。`model_validate` 把 dict 转成 Pydantic 对象，返回类型和运行时类型一致，不会出现"类型说 A 实际返回 B"。
- **404 处理**：找不到文章抛 `HTTPException(404)`，FastAPI 自动返回标准错误 JSON。前端阶段 04 已经写了"文章不存在"兜底 UI，正好接上。

## 5. main.py：CORS + 挂路由

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(articles.router)
```

**CORS 只允许本机前端 dev server 的两个写法**（`localhost` 和 `127.0.0.1` 是不同的 Origin）。不要图省事写 `"*"`，联调结束、同域部署后甚至可以收紧或去掉。开发时前端主要走 Vite 代理（同源无 CORS 问题），但直接访问 8000 端口测试时 CORS 就派上用场了。

## 6. 验证

```bash
cd backend
./.venv/bin/uvicorn app.main:app --port 8000
```

```bash
curl http://127.0.0.1:8000/api/health            # {"status":"ok"}
curl http://127.0.0.1:8000/api/articles          # 4 篇文章（无 content）
curl http://127.0.0.1:8000/api/articles/1        # 详情（含 content）
curl http://127.0.0.1:8000/api/articles/999      # HTTP 404 文章不存在
curl -H "Origin: http://localhost:5173" http://127.0.0.1:8000/api/health
# 响应头：Access-Control-Allow-Origin: http://localhost:5173
```

全部通过。

## 7. 踩坑记录

| 坑 | 现象 | 解决 |
|---|---|---|
| 后台进程被超时命令误杀 | bash 命令超时被杀时，连带 setsid 的 uvicorn 收到 SIGTERM | 用 `nohup setsid ... & disown` 彻底脱离；curl 加 `--max-time` 防挂起 |
| LSP 一堆 import 报错 | 编辑器用系统 Python，看不到 venv 里的 fastapi | 不是真错误，venv 启动验证即可（AGENTS.md 已记录） |
| `_IncludedRouter` 遍历报错 | 新版 FastAPI 路由对象结构变了 | 验证接口用 curl，不遍历 `app.routes` |

## 8. 下一步

- **阶段 06 数据库**：SQLAlchemy 模型、SQLite、seed 脚本把 4 篇 mock 灌进库，路由从 `MOCK_ARTICLES` 换成查库
- **阶段 07 前后端联调**：前端 `src/api/articles.ts` 两个函数体换成 `fetch('/api/...')`（Vite 代理已配好），删掉前端 mock
