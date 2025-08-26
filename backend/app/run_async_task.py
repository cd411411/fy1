# app/run_async_task.py

import asyncio
import pickle
import sys
import os
from pathlib import Path

# 在脚本的最开始，手动将项目根目录添加到 sys.path
# 这是绝对可靠的方式
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

# 现在可以安全地从 'app' 导入了
from app.tasks import _process_documents_async, _rebuild_document_group_async

# 一个简单的函数名到函数的映射
TASK_MAP = {
    "process_documents": _process_documents_async,
    "rebuild_group": _rebuild_document_group_async,
}

def main():
    """
    子进程的主入口。
    从 stdin 读取 pickle 序列化后的任务数据，执行任务，然后退出。
    """
    # 从标准输入读取被 pickle 的数据
    # 这是一种在进程间传递复杂数据的健壮方式
    encoded_data = sys.stdin.buffer.read()
    task_name, args, kwargs = pickle.loads(encoded_data)

    if task_name not in TASK_MAP:
        print(f"Error: Task '{task_name}' not found in TASK_MAP.", file=sys.stderr)
        sys.exit(1)

    # 获取要执行的异步函数
    async_func = TASK_MAP[task_name]

    try:
        # 运行异步任务
        asyncio.run(async_func(*args, **kwargs))
        # 成功完成，以状态码 0 退出
        sys.exit(0)
    except Exception as e:
        # 如果发生任何异常，打印到 stderr 并以非零状态码退出
        print(f"Error executing task '{task_name}': {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()