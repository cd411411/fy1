#!/bin/sh
# backend/deployment/start-celery.sh

# 退出脚本，如果任何命令失败
set -e

# 等待 Redis 启动
echo "Waiting for Redis to be ready..."
sleep 5

# 启动 Celery worker
echo "Starting Celery worker..."
celery -A app.celery_worker worker --loglevel=info -P gevent --concurrency=4