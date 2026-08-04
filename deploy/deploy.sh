#!/usr/bin/env bash
# DailyEnglish 部署发布脚本
#
# 用法（在本机源码目录执行）：
#   ./deploy/deploy.sh [tag]
#   tag 可选，默认用 git 短 commit hash，作为压缩包文件名，便于追溯版本
#
# 产出：
#   build/release/<tag>.tar.gz
#   解压后结构：
#     backend/    # 后端源码 + requirements.txt（venv 在服务器上建）
#     frontend/   # 前端构建产物（Nginx 直接服务）
#
# 服务器上安装步骤见 docs/08-部署上线.md。

set -euo pipefail
cd "$(dirname "$0")/.."

TAG="${1:-$(git rev-parse --short HEAD)}"
RELEASE_DIR="build/release"
TMP_DIR="build/tmp/${TAG}"

echo "==> 1/3 构建前端产物"
(cd frontend && npm ci --registry=https://registry.npmmirror.com && npm run build)

echo "==> 2/3 组装部署目录"
rm -rf "${TMP_DIR}"
mkdir -p "${TMP_DIR}/backend" "${TMP_DIR}/frontend"

# 前端：只发布构建产物
cp -r frontend/dist/* "${TMP_DIR}/frontend/"

# 后端：源码 + 依赖清单（.venv 和 data/ 不入包，服务器上另建）
cp -r backend/app backend/requirements.txt "${TMP_DIR}/backend/"

# 清理 Python 缓存目录，保持发布包干净
find "${TMP_DIR}" -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true

echo "==> 3/3 打包"
mkdir -p "${RELEASE_DIR}"
tar -czf "${RELEASE_DIR}/${TAG}.tar.gz" -C "${TMP_DIR}" .

echo "完成：${RELEASE_DIR}/${TAG}.tar.gz"
echo "上传：scp ${RELEASE_DIR}/${TAG}.tar.gz user@server:/tmp/"
