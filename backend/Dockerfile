# backend/Dockerfile

# --- Stage 1: Builder ---
    
# 使用一个轻量的Python镜像作为构建环境
FROM python:3.11-slim AS builder

# 设置环境变量，优化Docker构建
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 配置 pip 使用阿里云镜像源
RUN pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/ && \
    pip config set install.trusted-host mirrors.aliyun.com

# 安装 uv - 一个极速的Python包安装器
RUN pip install uv

# 复制依赖定义文件
# 注意：源路径是相对于构建上下文（项目根目录）的
COPY ./pyproject.toml /app/

# 使用 uv 来安装依赖到一个虚拟环境中，并配置阿里云镜像源
RUN uv venv /app/.venv && \
    uv pip install --no-cache-dir -p /app/.venv/bin/python \
    --index-url https://mirrors.aliyun.com/pypi/simple/ \
    --trusted-host mirrors.aliyun.com \
    -r pyproject.toml

# --- Stage 2: Runner ---
# 使用同样的基础镜像作为最终的运行环境
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# 创建一个非root用户和组以增强安全性
RUN addgroup --system app && adduser --system --group app

# 设置工作目录
WORKDIR /app

# 从 builder 阶段复制已经安装好依赖的虚拟环境
COPY --from=builder /app/.venv ./.venv

# 将虚拟环境的可执行文件路径添加到PATH
ENV PATH="/app/.venv/bin:$PATH"

# 复制后端应用代码
COPY ./app /app/app
COPY ./alembic /app/alembic
COPY ./alembic.ini /app/alembic.ini
COPY ./start.sh /start.sh

RUN chmod +x /start.sh && \
    chown -R app:app /app

# 暴露端口
EXPOSE 8000

# 使用启动脚本运行应用
CMD ["/start.sh"]