# AGENTS.md

## 项目背景

**DailyEnglish**：个人英语学习网站（阅读方向），边学边做的全栈项目。

- 参考课程：《零到全栈：AI时代的全栈开发》（李勃老师）
- 技术栈：前端 Vite + React + TypeScript，后端 FastAPI (Python)，数据库 SQLite，部署 Linux + Nginx
- 最终形态：部署到自备服务器，对外提供服务

## 仓库现状

- 前后端骨架已就绪（阶段 02 完成）：`frontend/`（Vite 8 + React 19 + TS 6 + oxlint）、`backend/`（FastAPI + SQLAlchemy + venv）
- 可运行命令：
  - 前端：`cd frontend && npm install && npm run dev`（开发，端口 5173）；`npm run build`（tsc 类型检查 + 打包）；`npm run lint`（oxlint）
  - 后端：`cd backend && ./.venv/bin/uvicorn app.main:app --port 8000`（健康检查 `GET /api/health`）
- `README.md` 目前只是占位符（仅一行标题）
- 阶段规划与编号见 `docs/PROGRESS.md` 头部（01-项目规划 ~ 09-复盘），提交时按 `stage: <编号>` 标注

## Skills（已安装，位于 `.opencode/skills/`）

- 前端设计：`design-taste-frontend`（taste-skill）、`impeccable`（20 个设计命令）
- 前端规范：`vercel-react-best-practices`、`vite-react-best-practices`、`typescript-pro`
- 工程规范：`conventional-commits`、`github-actions`
- 组件库方向：shadcn/ui（Tailwind 原生，代码进项目可控），备选 Radix / MUI

## 开发环境提示

- Python 系统环境无 pip/venv 且无 sudo：使用 `~/.local` 的 pip 和 `virtualenv`，后端统一用 `backend/.venv`
- 项目在 Windows 挂载盘 `/mnt/f/`（WSL），跨文件系统 IO 慢：pip 用清华镜像 `-i https://pypi.tuna.tsinghua.edu.cn/simple`，npm 可加 `--registry=https://registry.npmmirror.com`
- 编辑器若对 `backend/app/*.py` 报 Import 错误：把 Python 解释器指向 `backend/.venv/bin/python`

## 与知识库的协作约定

本项目与个人知识库 `oh-my-wiki` 联动（知识库侧负责结构化记录学习/开发过程）。请遵守：

1. 每个**开发阶段**建立独立文档 `docs/XX-<阶段名>.md`，口语化、尽量详细地记录（这是博客文章素材的原始积累）
   - 模板：背景思考、完成内容、技术决策及理由、实际命令、踩坑记录、下一步
2. 阶段完成时更新 `docs/PROGRESS.md`（总索引）：追加一行阶段记录 + 指向详细文档
3. 阶段完成时使用规范 git commit message（附 `stage: <编号>`），便于知识库侧通过 git log 同步
4. **不要**跨目录修改 `oh-my-wiki` 知识库的任何文件
5. 开发过程中新学到的关键技术点，简要记入对应阶段的 `docs/XX-<阶段名>.md`，知识库侧会提取沉淀

## Git 提交规范

- `feat:` 新功能
- `fix:` 修复
- `docs:` 文档 / 进度记录
- `chore:` 杂项
- 阶段完成时建议附加 `stage: <阶段名>`（如 `stage: 02-环境搭建`）

## 当前阶段

按 `docs/PROGRESS.md` 的最新记录为准。
