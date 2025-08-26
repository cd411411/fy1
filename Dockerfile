# ./Dockerfile

# --- Stage 1: Frontend Builder ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# 复制前端的 package.json 和 lock 文件
COPY frontend/package*.json ./

# 安装前端依赖
RUN npm install --frozen-lockfile

# 复制前端所有代码
COPY frontend/ ./

# 构建前端静态文件
RUN npm run build


# --- Stage 2: Backend Builder (with UV) ---
FROM python:3.12-slim-bookworm AS backend-builder
WORKDIR /app

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# 安装系统依赖 (为 PaddleOCR 等)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 安装 UV
RUN pip install uv

# 创建虚拟环境
RUN uv venv /app/.venv

# 复制后端依赖定义文件
COPY backend/pyproject.toml backend/poetry.lock* ./backend/

# 使用 uv 安装依赖 (激活 venv 环境)
# 注意：uv 会自动查找 pyproject.toml
RUN . /app/.venv/bin/activate && \
    uv pip install --no-cache-dir -r backend/pyproject.toml


# --- Stage 3: Final Runner Image ---
FROM python:3.12-slim-bookworm

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV APP_HOME=/app

# 安装运行 PaddleOCR 所需的系统依赖 (最终镜像也需要)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 创建非 root 用户
RUN groupadd -r app && useradd --no-log-init -r -g app app
WORKDIR ${APP_HOME}

# 从 backend-builder 阶段复制虚拟环境
COPY --from=backend-builder --chown=app:app /app/.venv ./.venv

# 将 venv 添加到 PATH
ENV PATH="${APP_HOME}/.venv/bin:$PATH"

# 复制后端代码
COPY --chown=app:app backend/ ./

# 从 frontend-builder 阶段复制构建好的静态文件
COPY --from=frontend-builder --chown=app:app /app/dist/ ./app/static/

# 创建必要的目录并设置权限
RUN mkdir -p persistent_storage/rag_files outputs uploads && \
    chown -R app:app persistent_storage outputs uploads

# 赋予启动脚本执行权限
RUN chmod +x ./deployment/start-backend.sh && \
    chmod +x ./deployment/start-celery.sh

# 切换到非 root 用户
USER app

# 暴露端口
EXPOSE 8000

# 默认启动 FastAPI 应用。docker-compose 中会覆盖 celery worker 的启动命令
CMD ["./deployment/start-backend.sh"]