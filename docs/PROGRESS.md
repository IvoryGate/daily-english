# DailyEnglish 开发进度（总索引）

> **定位**：本文件是开发记录的**导航页**，只放最新状态和阶段列表。
> 每个阶段的**详细记录**（口语化、为博客积累素材）见各自的独立文档：`docs/01-项目规划.md`、`docs/02-环境搭建.md`…
> 知识库侧（oh-my-wiki）按本文件 + git log 同步到 `workspace/topics/DailyEnglish/`。

## 当前进度

**当前阶段：03 前端基础**（02 环境搭建已完成，详见 [`02-环境搭建.md`](./02-环境搭建.md)）

---

## 阶段总览

| 编号 | 阶段 | 详细文档 | 状态 |
|---|---|---|---|
| 00 | 初始化（git 仓库 + 协作约定） | — | ✅ |
| 01 | 项目规划（产品定位、技术选型、MVP 边界） | [`01-项目规划.md`](./01-项目规划.md) | ✅ |
| 02 | 环境搭建（Node/Python 环境、前后端骨架） | [`02-环境搭建.md`](./02-环境搭建.md) | ✅ |
| 03 | 前端基础（Vite+React+TS、Tailwind+shadcn/ui、组件化） | `03-前端基础.md`（待建） | ⏳ 进行中 |
| 03 | 前端基础（Vite+React+TS、Tailwind+shadcn/ui、组件化） | `03-前端基础.md`（待建） | ⬜ |
| 04 | 前端框架（路由、数据请求、mock 数据） | `04-前端框架.md`（待建） | ⬜ |
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
