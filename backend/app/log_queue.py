# app/log_queue.py (新文件)
import asyncio
from typing import Dict, Any
from . import database
from .database import AsyncSessionLocal

# 创建一个全局的、无大小限制的异步队列
log_queue = asyncio.Queue()

async def log_writer_worker():
    """一个持续运行的后台工作者，负责将队列中的日志写入数据库。"""
    print("Log writer worker started.")
    while True:
        try:
            # 从队列中异步地获取一个任务，如果队列为空，会在此等待
            log_data: Dict[str, Any] = await log_queue.get()
            
            # 创建一个独立的数据库会话来处理这个任务
            async with AsyncSessionLocal() as db:
                await database.log_ai_usage(
                    db=db,
                    model_id=log_data["model_id"],
                    model_name=log_data["model_name"],
                    usage_data=log_data["usage_data"],
                    request_source=log_data["request_source"]
                )
            
            # 标记任务已完成
            log_queue.task_done()
            print(f"Logged AI usage for model: {log_data['model_name']}")

        except asyncio.CancelledError:
            print("Log writer worker is shutting down.")
            break
        except Exception as e:
            print(f"Error in log writer worker: {e}")
            # 等待一秒后继续，防止因持续错误而耗尽CPU
            await asyncio.sleep(1)

# 用于在应用关闭时优雅地停止工作者
worker_task = None

def start_log_worker():
    """在应用启动时创建并启动工作者任务。"""
    global worker_task
    worker_task = asyncio.create_task(log_writer_worker())

def stop_log_worker():
    """在应用关闭时取消工作者任务。"""
    if worker_task:
        worker_task.cancel()