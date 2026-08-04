# DailyEnglish 开发进度（总索引）

> **定位**：本文件是开发记录的**导航页**，只放最新状态和阶段列表。
> 每个阶段的**详细记录**（口语化、为博客积累素材）见各自的独立文档：`docs/01-项目规划.md`、`docs/02-环境搭建.md`…
> 知识库侧（oh-my-wiki）按本文件 + git log 同步到 `workspace/topics/DailyEnglish/`。

## 当前进度

**当前阶段：07 前后端联调**（06 数据库已完成，详见 [`06-数据库.md`](./06-数据库.md)）

---

## 阶段总览

| 编号 | 阶段 | 详细文档 | 状态 |
|---|---|---|---|
| 00 | 初始化（git 仓库 + 协作约定） | — | ✅ |
| 01 | 项目规划（产品定位、技术选型、MVP 边界） | [`01-项目规划.md`](./01-项目规划.md) | ✅ |
| 02 | 环境搭建（Node/Python 环境、前后端骨架） | [`02-环境搭建.md`](./02-环境搭建.md) | ✅ |
| 03 | 前端基础（Vite+React+TS、Tailwind+shadcn/ui、组件化） | [`03-前端基础.md`](./03-前端基础.md) | ✅ |
| 04 | 前端框架（路由、数据请求、mock 数据） | [`04-前端框架.md`](./04-前端框架.md) | ✅ |
| 05 | 后端 API（FastAPI 骨架、CORS、文章接口） | [`05-后端API.md`](./05-后端API.md) | ✅ |
| 06 | 数据库（SQLAlchemy 模型、SQLite、seed 语料） | [`06-数据库.md`](./06-数据库.md) | ✅ |
| 07 | 前后端联调（Vite 代理、数据打通、体验打磨） | `07-前后端联调.md`（待建） | ⏳ 进行中 |
| 05 | 后端 API（FastAPI 骨架、文章接口） | `05-后端API.md`（待建） | ⬜ |
| 06 | 数据库（SQLAlchemy 模型、SQLite、seed 语料） | `06-数据库.md`（待建） | ⬜ |
| 07 | 前后端联调（Vite 代理、数据打通、体验打磨） | `07-前后端联调.md`（待建） | ⬜ |
| 08 | 部署上线（Linux + Nginx、域名） | `08-部署上线.md`（待建） | ⬜ |
| 09 | 复盘（全流程回顾、博客素材整理） | `09-复盘.md`（待建） | ⬜ |

---

## 历史存档

> 阶段 00/01 的早期简版记录在此，详细内容已移入独立文档。

### 阶段 00：初始化

- **日期**：2026-08-04
- **完成内容**：项目目录初始化，建立 git 仓库，约定协作机制（AGENTS.md）

### 阶段 01：项目规划（技术选型与 Skill 准备）

- **日期**：2026-08-04
- **完成内容**：安装前端设计与工程规范 skills 到 `.opencode/skills/`（7 个）；技术栈定为 Vite + React + TS + FastAPI + SQLite；组件库方向 shadcn/ui
- **踩坑记录**：`npx skills add` 默认装到 `.agents/skills/`，opencode 不扫描该目录，需手动移到 `.opencode/skills/`；impeccable skill 硬编码路径需批量替换
- **详细记录**：见 [`01-项目规划.md`](./01-项目规划.md)

### 阶段 02：环境搭建

- **日期**：2026-08-04
- **完成内容**：环境检查（Node 22/Python 3.10）；Python 走 get-pip + virtualenv 绕过 sudo 限制；前端 Vite 8 + React 19 + TS 6 骨架（build/lint 通过）；后端 FastAPI + SQLAlchemy 最小骨架（health 接口可用）；落地 .gitignore
- **踩坑记录**：Debian 无 pip/venv 且无 sudo → 用 virtualenv；/mnt/f 挂载盘安装慢 → 清华镜像；pkill -f 自匹配坑 → `[u]vicorn` 技巧；后台进程占管道 → setsid 脱离
- **详细记录**：见 [`02-环境搭建.md`](./02-环境搭建.md)

### 阶段 03：前端基础

- **日期**：2026-08-04
- **完成内容**：前端目录结构（api/components/hooks/pages/types/lib）；引入 Tailwind CSS v4（Vite 插件）；shadcn/ui 初始化（radix-nova preset）+ card/badge/separator 组件；静态页面骨架（列表页 + 阅读页，4 篇公版 Aesop mock 数据）；vite.config 配 `@/` 别名和 /api 代理；build/lint 通过，dev server 验证正常
- **踩坑记录**：ESM `__dirname` 不可用 → `import.meta.dirname`；shadcn add 连不上 npm 官方 registry 卡死 → 项目 `.npmrc` 指镜像；shadcn 组件误写到 `@/` 字面目录 → 根 tsconfig 补 paths；TS 6.0 弃用 baseUrl → 用相对路径 paths
- **详细记录**：见 [`03-前端基础.md`](./03-前端基础.md)

### 阶段 04：前端框架

- **日期**：2026-08-04
- **完成内容**：引入 react-router 8（`/` 列表、`/articles/:id` 详情）；建 `src/api/` + `src/hooks/`（fetchArticles/fetchArticle + useArticles/useArticle，异步 Promise + loading/error 状态）；ArticleCard 改用 Link；SiteHeader 提到布局层；详情页 404 兜底；build/lint 通过，两路由验证 200
- **决策记录**：返回按钮用 Link 而非 navigate(-1)（避免无历史失效）；数据层签名与真接口对齐，联调时只改函数体
- **详细记录**：见 [`04-前端框架.md`](./04-前端框架.md)

### 阶段 05：后端 API

- **日期**：2026-08-04
- **完成内容**：拆出 schemas.py（Pydantic 模型）/ mock_data.py / api/routes/articles.py；`GET /api/articles` 列表 + `GET /api/articles/{id}` 详情（含 404）；main.py 加 CORS（允许 5173 两个 Origin）并挂载路由；数据先用内存 mock，阶段 06 换数据库
- **决策记录**：前端后端并行用 mock，数据结构先对齐；404 走 HTTPException 标准 JSON
- **踩坑记录**：bash 命令超时会连带杀掉 setsid 的后台 uvicorn → nohup setsid + curl --max-time
- **详细记录**：见 [`05-后端API.md`](./05-后端API.md)

### 阶段 06：数据库

- **日期**：2026-08-04
- **完成内容**：SQLAlchemy 2.0 新式模型（Article，字段对齐规划）；SQLite 库 `backend/data/daily_english.db`（已 gitignore）；seed.py 幂等灌库（lifespan 启动自动执行）；路由改查库（get_db 依赖注入、created_at 倒序、ORM→Schema 显式转换）；接口全部 curl 验证通过
- **踩坑记录**：SQLite DateTime 不收字符串 → `datetime.fromisoformat`；WSL 启动慢 curl 太早 502
- **详细记录**：见 [`06-数据库.md`](./06-数据库.md)
