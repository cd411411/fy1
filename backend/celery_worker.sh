#!/bin/sh

set -e

# 激活虚拟环境
. .venv/bin/activate

# 启动 Celery Worker
echo "Starting Celery Worker..."
celery -A app.celery_worker worker --loglevel=info -P gevent