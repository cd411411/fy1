# app/tasks.py

import os
from .celery_worker import celery_app
from .services.rag_service import RAGService
from .database import AsyncSessionLocal
from typing import List, Dict, Any, Literal
import asyncio
import subprocess # (核心) 导入 subprocess
import sys
import pickle

# (核心) 将异步任务逻辑移到顶层，以便 run_async_task.py 可以导入它们
async def _process_documents_async(case_cause: str, group_name: str, 
                                  files_data: List[Dict[str, Any]], 
                                  strategy: Literal["chunk", "qa", "excel_qa"],
                                  chunk_size: int, overlap: int):
    async with AsyncSessionLocal() as db:
        rag_service = RAGService(db)
        await rag_service.process_and_embed_documents(
            case_cause=case_cause, group_name=group_name, files_data=files_data,
            strategy=strategy, chunk_size=chunk_size, overlap=overlap
        )

async def _rebuild_document_group_async(group_id: int, 
                                       strategy: Literal["chunk", "qa", "excel_qa"],
                                       chunk_size: int, overlap: int):
    async with AsyncSessionLocal() as db:
        rag_service = RAGService(db)
        await rag_service.rebuild_document_group(
            group_id=group_id, strategy=strategy, chunk_size=chunk_size, overlap=overlap
        )


def run_task_in_subprocess(task_name: str, *args, **kwargs):
    """
    在一个新的子进程中，通过执行一个独立的脚本来运行任务。
    """
    # 获取当前 Python 解释器的路径
    python_executable = sys.executable
    # 获取我们的任务执行脚本的路径
    script_path = os.path.join(os.path.dirname(__file__), 'run_async_task.py')
    
    # 将任务名和参数序列化，以便通过 stdin 传递
    data_to_pass = pickle.dumps((task_name, args, kwargs))

    # 启动子进程
    process = subprocess.Popen(
        [python_executable, script_path],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE, # 捕获标准输出
        stderr=subprocess.PIPE  # 捕获标准错误
    )
    
    # 将序列化的数据写入子进程的标准输入
    stdout, stderr = process.communicate(input=data_to_pass)

    # 检查子进程的返回码
    if process.returncode != 0:
        # 如果返回码非零，说明子进程出错了
        # 将子进程的 stderr 打印到 Celery worker 的日志中
        error_message = stderr.decode('utf-8', errors='ignore')
        print(f"Subprocess task '{task_name}' failed with exit code {process.returncode}.")
        print(f"--- Subprocess Stderr ---\n{error_message}\n---------------------------")
        # 抛出一个异常，让 Celery 知道任务失败了
        raise RuntimeError(f"Subprocess execution failed: {error_message}")
    
    # 打印子进程的标准输出以供调试
    if stdout:
        print(f"--- Subprocess Stdout ---\n{stdout.decode('utf-8', errors='ignore')}\n---------------------------")


@celery_app.task(bind=True, name="process_documents_for_rag")
def process_documents_task(self, case_cause: str, group_name: str, 
                           files_data: List[Dict[str, Any]], 
                           strategy: Literal["chunk", "qa", "excel_qa"],
                           chunk_size: int, overlap: int):
    try:
        print(f"Celery task {self.request.id}: Dispatching to subprocess executor.")
        run_task_in_subprocess(
            "process_documents", # 任务名，对应 TASK_MAP 中的 key
            case_cause, group_name, files_data, strategy, chunk_size, overlap
        )
        print(f"Celery task {self.request.id}: Subprocess finished successfully.")
        return {"status": "SUCCESS", "message": f"Successfully processed {len(files_data)} files for group '{group_name}'."}
    except Exception as e:
        print(f"Celery task {self.request.id}: Processing failed. Error: {e}")
        self.update_state(
            state='FAILURE', meta={'exc_type': type(e).__name__, 'exc_message': str(e)}
        )
        raise e

@celery_app.task(bind=True, name="rebuild_document_group")
def rebuild_document_group_task(self, group_id: int, 
                                strategy: Literal["chunk", "qa", "excel_qa"],
                                chunk_size: int, overlap: int):
    try:
        print(f"Celery task {self.request.id}: Dispatching rebuild task to subprocess executor.")
        run_task_in_subprocess(
            "rebuild_group", # 任务名
            group_id, strategy, chunk_size, overlap
        )
        print(f"Celery task {self.request.id}: Subprocess rebuild finished successfully.")
        return {"status": "SUCCESS", "message": f"Successfully rebuilt document group {group_id}."}
    except Exception as e:
        print(f"Celery task {self.request.id}: Rebuild failed. Error: {e}")
        self.update_state(
            state='FAILURE', meta={'exc_type': type(e).__name__, 'exc_message': str(e)}
        )
        raise e