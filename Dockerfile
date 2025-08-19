# 多阶段构建 Dockerfile

# 第一阶段：构建前端
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制前端的 package.json 和 package-lock.json（如果存在）
COPY frontend/package*.json ./

# 安装依赖
RUN npm install

# 复制前端源码
COPY frontend/ ./

# 构建前端
RUN npm run build

# 第二阶段：构建最终镜像
FROM python:3.11-slim

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 设置工作目录
WORKDIR /app

# 安装系统依赖（如果需要）
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 复制 requirements.txt 并安装 Python 依赖
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir uv && \
    uv pip install --no-cache-dir -r requirements.txt --system && \
    uv pip install --no-cache-dir gunicorn --system

# 复制后端应用代码
COPY backend/ ./

# 从第一阶段复制构建好的前端静态文件到后端的 static 目录
COPY --from=frontend-builder /app/frontend/dist/ ./app/static/

# 创建非 root 用户（安全最佳实践）
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 定义容器启动命令
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8000"]