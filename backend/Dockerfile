# 使用一个轻量的、生产环境推荐的Python官方镜像
FROM python:3.11-slim

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# 设置工作目录
WORKDIR /app

# 1. 复制 requirements.txt 并安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir uv && \
    uv pip install --no-cache-dir -r requirements.txt --system && \
    uv pip install gunicorn --system

# 2. 复制后端应用的所有内容
# 因为Dockerfile和app目录在同一级，所以 COPY . . 会将所有东西复制到镜像的 /app 目录
COPY . .

# 暴露端口
EXPOSE 8000

# 定义容器启动命令
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8000"]