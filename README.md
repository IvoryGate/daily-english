# DailyEnglish

个人英语学习网站（阅读方向），边学边做的全栈项目。

## 功能特性

- **文章阅读**：杂志式首页、难度分级、搜索筛选、配图展示
- **精读工具**：逐词点查、生词本、FSRS 间隔复习闪卡
- **AI 助手**：对话式学习、联网搜索、工具循环、笔记生成
- **学习体系**：等级路径、每日目标、连续打卡、成就徽章、词汇量估算
- **笔记编辑**：所见即所得 Markdown 编辑器（MDX Editor）
- **内容源**：内置语料 + VOA/卫报/大西洋月刊爬虫（公有领域优先）
- **主题系统**：Claude 温暖 / Notion 专注双风格，明暗模式自适应

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vite 8 + React 19 + TypeScript 6 + Tailwind CSS 4 + shadcn/ui |
| 后端 | FastAPI + SQLAlchemy 2.0 + SQLite |
| 部署 | Linux + Nginx（配置已就绪，待服务器） |

## 快速开始

### 前端开发

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

### 后端开发

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --port 8000 --reload
```

健康检查：`GET http://localhost:8000/api/health`

### 构建与检查

```bash
cd frontend
npm run build    # TypeScript 类型检查 + Vite 打包
npm run lint     # oxlint 代码检查
```

## 项目结构

```
daily-english/
├── frontend/          # Vite + React + TypeScript
│   ├── src/
│   │   ├── api/       # 后端接口封装
│   │   ├── components/# 通用组件（shadcn/ui）
│   │   ├── pages/     # 页面组件
│   │   ├── hooks/     # 自定义 hooks
│   │   └── lib/       # 工具函数
│   └── ...
├── backend/           # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── main.py    # FastAPI 入口
│   │   ├── models.py  # ORM 模型
│   │   ├── routers/   # API 路由
│   │   └── crawler/   # 爬虫模块（可插拔来源）
│   └── data/          # SQLite 数据库（gitignore）
├── deploy/            # Nginx 配置 + systemd 服务 + 发布脚本
└── docs/              # 开发文档（阶段记录）
```

## 开发进度

项目已完成 31 个开发阶段，详见 [docs/PROGRESS.md](./docs/PROGRESS.md)。

核心里程碑：
- 阶段 07：MVP 前后端联调通过
- 阶段 15：用户体系（登录认证、数据云端化）
- 阶段 20：AI 深度集成（工具循环、联网搜索）
- 阶段 22：杂志式首页重构
- 阶段 31：所见即所得笔记编辑器

## 相关文档

- [项目规划](./docs/01-项目规划.md) - 产品定位、技术选型、MVP 边界
- [开发进度](./docs/PROGRESS.md) - 全部阶段索引
- [部署指南](./docs/08-部署上线.md) - Linux + Nginx 部署配置

## 许可

个人学习项目，文章内容来源：
- 内置公版语料（Aesop 寓言等）
- VOA Learning English（公有领域）
- 用户自供内容（粘贴/导入）

## 开发环境提示

- Windows WSL 环境：`/mnt/f/` 挂载盘 IO 较慢，pip 建议用清华镜像
- 后端 Python：使用 `backend/.venv` 虚拟环境
- 编辑器 Python 路径：指向 `backend/.venv/bin/python`
