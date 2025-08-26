# app/celery_worker.py

from celery import Celery
from .config.config import settings
import os

# 确保在 Celery worker 进程中也能加载 Django/FastAPI 等应用的环境
# (对于 FastAPI 通常不是必需的，但这是一个好习惯)
os.environ.setdefault('CELERY_CONFIG_MODULE', 'app.celery_worker')

# 创建 Celery 实例
# broker 使用 Redis 数据库 1, backend 使用 Redis 数据库 2, 以便隔离
celery_app = Celery(
    'tasks',
    broker=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/1",
    backend=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/2",
    include=['app.tasks']  # 明确告知 Celery 去哪里寻找任务函数
)

# 可选的 Celery 配置
celery_app.conf.update(
    task_track_started=True,
    result_expires=3600,  # 任务结果一小时后过期
    broker_connection_retry_on_startup=True, # 确保启动时能连上 broker
)

# 如果您有更复杂的配置，可以从 settings 对象加载
# celery_app.config_from_object(settings, namespace='CELERY')