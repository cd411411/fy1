#!/bin/sh
# backend/deployment/start-backend.sh

# 退出脚本，如果任何命令失败
set -e

# 等待数据库完全启动 (需要 docker-compose 中的 healthcheck)
# 这是一个简单的循环，生产环境可以用更复杂的工具如 wait-for-it.sh
echo "Waiting for database to be ready..."
# 这里我们假设 healthcheck 已经处理了等待，但一个简单的 sleep 也是一种保障
sleep 5

# 运行 Alembic 数据库迁移
echo "Running database migrations..."
alembic upgrade head

# 启动 FastAPI 应用
echo "Starting Gunicorn server for FastAPI app..."
gunicorn -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 120 app.main:app