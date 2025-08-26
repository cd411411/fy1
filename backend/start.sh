#!/bin/sh
# backend/deployment/start.sh

set -e

. /app/.venv/bin/activate
export PYTHONPATH=/app:$PYTHONPATH

# 1. 运行 Alembic 数据库迁移 (确保表结构最新)
echo "Running database migrations..."
alembic upgrade head

# 2. 启动 FastAPI 应用
echo "Starting Gunicorn server..."
gunicorn -w 1 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 120 app.main:app