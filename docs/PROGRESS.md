# DailyEnglish 开发进度（总索引）

> **定位**：本文件是开发记录的**导航页**，只放最新状态和阶段列表。
> 每个阶段的**详细记录**（口语化、为博客积累素材）见各自的独立文档：`docs/01-项目规划.md`、`docs/02-环境搭建.md`…
> 知识库侧（oh-my-wiki）按本文件 + git log 同步到 `workspace/topics/DailyEnglish/`。

## 当前进度

**阶段 01~18 全部完成 ✅（规划 → 用户体系 → 复盘 → 视觉优化 → 学习体系）**
> 阶段 18 完成（面向初学者学习体系）：等级体系（Lv1~5）+ 首页按级推荐 + 每日目标 + 连续打卡 streak + 成就徽章 + 学习热力图 + 累计复习统计 + 整句翻译 + 文章重点词，见 [`18-学习体系.md`](./18-学习体系.md)。
> 阶段 17 完成（视觉 + 功能）：温暖纸感配色 + 阅读衬线排版 + 进度条；深色模式、字号调节、朗读全文、生词发音、导出 Anki、乱序复习、随机一篇、今日推荐。
> 词典升级：后端代理有道（中文释义 + 美英音标 + 真人发音音频）。
> 待办（见复盘"下一步建议"）：写 README、真实部署（等服务器/域名）、SECRET_KEY 环境变量化、卫报/大西洋版权合规、补最小测试集、词汇量估算曲线、复习趋势图。
> 部署配置（阶段 08）已就绪，服务器到手后按 [`08-部署上线.md`](./08-部署上线.md) 执行即可上线。

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
| 07 | 前后端联调（Vite 代理、数据打通、体验打磨） | [`07-前后端联调.md`](./07-前后端联调.md) | ✅ |
| 08 | 部署上线（Linux + Nginx、域名） | [`08-部署上线.md`](./08-部署上线.md) | ⏳ 配置已备，待服务器 |
| 09 | 精读功能增强（逐词点查、生词本、闪卡复习、自我精读） | [`09-精读功能增强.md`](./09-精读功能增强.md) | ✅ |
| 10 | 爬虫模块（VOA 公有领域内容源、来源筛选、一键同步） | [`10-爬虫模块.md`](./10-爬虫模块.md) | ✅ |
| 11 | 爬虫架构演进（可插拔来源 + 风控、卫报/大西洋月刊） | [`11-爬虫架构演进.md`](./11-爬虫架构演进.md) | ✅ |
| 12 | 体验增强（定时抓取、抓取异步化、真 FSRS 闪卡） | [`12-体验增强.md`](./12-体验增强.md) | ✅ |
| 13 | 基础功能完善（搜索/难度/排序/加载更多 + 已读/进度/收藏/统计） | [`13-浏览体验增强.md`](./13-浏览体验增强.md) | ✅ |
| 14 | 数据可用性（原文外链、生词导入导出、词典缓存清理） | [`14-数据可用性.md`](./14-数据可用性.md) | ✅ |
| 15 | 用户体系（登录认证、数据云端化、个人后台） | [`15-用户体系.md`](./15-用户体系.md) | ✅ |
| 16 | 复盘（全流程回顾、博客素材整理） | [`16-复盘.md`](./16-复盘.md) | ✅ |
| 17 | 视觉打磨 + 功能优化（温暖阅读感配色/衬线排版/进度条；深色模式/字号/朗读/发音/Anki/乱序/随机/今日推荐） | [`17-视觉打磨与功能优化.md`](./17-视觉打磨与功能优化.md) | ✅ |
| 18 | 学习体系（等级路径/每日目标/打卡/成就/热力图/整句翻译/重点词） | [`18-学习体系.md`](./18-学习体系.md) | ✅ |

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

### 阶段 07：前后端联调

- **日期**：2026-08-04
- **完成内容**：前端 api 层换真接口（fetch + DTO snake_case→camelCase 映射）；删掉前端 mock；content 字段可选化（列表无正文）；404 → undefined 走兜底 UI；详情页补难度 badge（抽共享 difficulty.ts）；列表 loading 换骨架屏；验证 Vite 代理打通，MVP 全链路可用
- **决策记录**：DTO + 映射函数集中在 api 层，后端字段变化只影响一个文件
- **详细记录**：见 [`07-前后端联调.md`](./07-前后端联调.md)

### 阶段 08：部署上线（配置准备）

- **日期**：2026-08-04
- **完成内容**：`deploy/` 三个文件（Nginx 模板：SPA try_files + /api 反代 + assets 缓存；systemd 服务：uvicorn 托管、Restart=always；deploy.sh 发布脚本：构建→清理→打包）；`./deploy/deploy.sh test-deploy` 本地跑通产出部署包（176K，不含 .venv/node_modules/data/__pycache__）
- **踩坑记录**：tar --exclude 不认 `--exclude='__pycache__'` 写法 → 改用 find 清理；数据文件绝不入发布包
- **待办**：服务器+域名就绪后按文档执行真实部署；HTTPS（certbot）
- **详细记录**：见 [`08-部署上线.md`](./08-部署上线.md)

### 阶段 09：精读功能增强

- **日期**：2026-08-04
- **完成内容**：竞品分析（englio.ai / engread.top）后补充三功能：逐词点查（分词渲染 + dictionaryapi.dev + localStorage 缓存）、生词本（/vocabulary）、闪卡复习（/review，三级间隔）、自我精读（/new 粘贴文章，负数 id + source 字段与后端文章合并）；全程 localStorage 不突破只读/无账号边界；build/lint 通过，5 路由验证 200
- **决策记录**：简单间隔替代完整 FSRS；真实外刊用"用户自供内容"绕版权；词典缓存离线可读
- **详细记录**：见 [`09-精读功能增强.md`](./09-精读功能增强.md)

### 阶段 10：爬虫模块（内容资源）

- **日期**：2026-08-04
- **完成内容**：后端 `app/crawler/`（fetcher/normalizer/run），从公有领域 VOA Learning English 6 个栏目抓文章入库；`Article` 加 `source`/`source_url` 列（轻量 `migrate()` 幂等补列）；`POST /api/crawl/voa` 触发 + `GET /api/articles?source=` 过滤；前端来源筛选（全部/内置/VOA/我的）+ 同步按钮 + 来源徽章；`source` 类型改为 seed/voa/local
- **决策记录**：只爬公有领域 VOA 绕开版权；HTML 抓取（div.wsw）取代不稳定的 RSS；短文过滤跳过音频/视频页
- **踩坑记录**：栏目 id 404（Health 9455→955）；WSL 挂载盘 mtime 精度致 Vite 喂旧代码需重启清缓存；bash 超时连带杀后台服务
- **详细记录**：见 [`10-爬虫模块.md`](./10-爬虫模块.md)

### 阶段 11：爬虫架构演进（可插拔来源 + 风控）

- **日期**：2026-08-04
- **完成内容**：爬虫重构成可插拔 provider 架构（`base.py` 抽象基类 + `registry.py` 注册表 + `providers/` 各来源实现 + `throttle.py` 风控）；新增卫报（section→`div[data-gu-name="body"]` 正文）、大西洋月刊（Next.js `__NEXT_DATA__` GraphQL 取正文）两个来源；`SafeFetcher` 封装每源限速（1~3s）+ 指数退避 + 熔断；接口升级为 `POST /api/crawl?source=` 全量/定向 + `GET /api/crawl/sources`；前端来源类型扩展 + `sourceLabels` 映射 + 动态筛选 tabs
- **决策记录**：provider 抽象实现"加来源=一个文件+一行注册"的可插拔；熔断让单源失败不拖垮全局；卫报/大西洋全文有版权，用户确认接受风险（仅个人学习）
- **踩坑记录**：卫报链接是相对路径需拼域名；大西洋正文在 `__NEXT_DATA__` JSON（静态 HTML 无正文）；大西洋链接模式是 `/section/年/月/slug/id/` 非 `/archive/`
- **详细记录**：见 [`11-爬虫架构演进.md`](./11-爬虫架构演进.md)

### 阶段 12：体验增强（定时抓取 + 异步化 + 真 FSRS）

- **日期**：2026-08-04
- **完成内容**：定时抓取（APScheduler 每天 08:00 Asia/Shanghai 增量）；抓取异步化（`CrawlScheduler` 后台线程 + `task_id` 状态轮询 + 409 并发拒绝）；真 FSRS 闪卡（`ts-fsrs` 库，VocabEntry 加 card 字段 + 旧数据惰性迁移，复习页四档评价：忘记/困难/良好/简单）
- **决策记录**：单进程个人项目用 threading + 内存状态，不引 Celery；串行抓取避免 SQLite 写冲突；用官方 FSRS 实现不手写公式
- **踩坑记录**：`pkill -f "[v]ite"` 匹配自身包装进程致命令挂起/误杀后台服务 → pkill 与启动分两条命令；ts-fsrs 的 `scheduling[rating]` 需类型断言
- **详细记录**：见 [`12-体验增强.md`](./12-体验增强.md)

### 阶段 13：基础功能完善（浏览体验 + 学习记录）

- **日期**：2026-08-04
- **完成内容**：浏览体验：后端 `q`（标题/摘要/正文 LIKE 搜索）+ `difficulty` 过滤；前端统一过滤/排序/加载更多分页。学习记录：`storage.ts` 加阅读历史（已读+进度）、收藏；ArticleCard 加已读徽章+收藏按钮；详情页滚动进度保存/恢复+离开标记已读；新增 `/dashboard` 学习统计页（累计/本周阅读、词数、生词、收藏、最近阅读）；导航加"我的学习"
- **决策记录**：学习记录先落 localStorage（无账号阶段），用户体系上线时再迁移云端；source 过滤移至渲染层修复 tab 塌缩 bug
- **详细记录**：见 [`13-浏览体验增强.md`](./13-浏览体验增强.md)

### 阶段 14：数据可用性

- **日期**：2026-08-04
- **完成内容**：详情页加"查看原文"外链（有 sourceUrl 的文章）；生词本导出 JSON 下载 + 文件导入（去重合并 + 旧格式迁移 FSRS）；词典缓存清理（dashboard 显示条数 + 清理按钮）
- **决策记录**：导入用文件而非粘贴；JSON 保留 FSRS 卡状态（CSV 会丢调度数据）；缓存清理放 dashboard 管理区
- **详细记录**：见 [`14-数据可用性.md`](./14-数据可用性.md)
