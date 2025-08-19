#!/bin/bash

# 本地部署脚本
# 用于构建和运行包含前后端的 Docker 容器

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置变量
CONTAINER_NAME="my-fullstack-app"
IMAGE_NAME="my-fullstack-app:latest"
HOST_PORT=8000
CONTAINER_PORT=8000

# 数据库配置（根据实际情况修改）
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="myapp_db"
DB_USER="myapp_user"
DB_PASSWORD="myapp_password"

# 检查 Docker 是否安装
check_docker() {
    log_info "检查 Docker 是否安装..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    log_success "Docker 已安装"
}

# 检查必要文件是否存在
check_files() {
    log_info "检查必要文件..."
    
    if [ ! -f "Dockerfile" ]; then
        log_error "Dockerfile 不存在"
        exit 1
    fi
    
    if [ ! -f "frontend/package.json" ]; then
        log_error "frontend/package.json 不存在"
        exit 1
    fi
    
    if [ ! -f "backend/requirements.txt" ]; then
        log_error "backend/requirements.txt 不存在"
        exit 1
    fi
    
    if [ ! -d "backend/alembic" ]; then
        log_warning "alembic 目录不存在，请确认是否已初始化 Alembic"
    fi
    
    log_success "文件检查完成"
}

# 停止并删除现有容器
cleanup_existing() {
    log_info "清理现有容器..."
    
    if docker ps -q --filter "name=$CONTAINER_NAME" | grep -q .; then
        log_info "停止现有容器..."
        docker stop $CONTAINER_NAME
    fi
    
    if docker ps -aq --filter "name=$CONTAINER_NAME" | grep -q .; then
        log_info "删除现有容器..."
        docker rm $CONTAINER_NAME
    fi
    
    log_success "容器清理完成"
}

# 构建 Docker 镜像
build_image() {
    log_info "构建 Docker 镜像..."
    
    docker build -t $IMAGE_NAME . --no-cache
    
    if [ $? -eq 0 ]; then
        log_success "镜像构建成功"
    else
        log_error "镜像构建失败"
        exit 1
    fi
}

# 创建网络（如果不存在）
create_network() {
    local network_name="app-network"
    
    if ! docker network ls | grep -q $network_name; then
        log_info "创建 Docker 网络..."
        docker network create $network_name
        log_success "网络创建成功"
    else
        log_info "Docker 网络已存在"
    fi
}

# 启动数据库（PostgreSQL 示例）
start_database() {
    local db_container_name="postgres-db"
    
    log_info "检查数据库容器..."
    
    if ! docker ps --filter "name=$db_container_name" | grep -q $db_container_name; then
        log_info "启动 PostgreSQL 数据库..."
        
        docker run -d \
            --name $db_container_name \
            --network app-network \
            -e POSTGRES_DB=$DB_NAME \
            -e POSTGRES_USER=$DB_USER \
            -e POSTGRES_PASSWORD=$DB_PASSWORD \
            -p $DB_PORT:5432 \
            -v postgres_data:/var/lib/postgresql/data \
            postgres:15-alpine
        
        log_info "等待数据库启动..."
        sleep 10
        log_success "数据库启动完成"
    else
        log_info "数据库容器已在运行"
    fi
}

# 运行数据库迁移
run_migrations() {
    log_info "运行数据库迁移..."
    
    # 在容器中运行 Alembic 迁移
    docker run --rm \
        --network app-network \
        -e DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@postgres-db:5432/$DB_NAME" \
        -v "$(pwd)/backend:/app" \
        -w /app \
        python:3.11-slim \
        bash -c "
            pip install alembic psycopg2-binary sqlalchemy &&
            alembic upgrade head
        "
    
    if [ $? -eq 0 ]; then
        log_success "数据库迁移完成"
    else
        log_error "数据库迁移失败"
        exit 1
    fi
}

# 启动应用容器
start_container() {
    log_info "启动应用容器..."
    
    docker run -d \
        --name $CONTAINER_NAME \
        --network app-network \
        -p $HOST_PORT:$CONTAINER_PORT \
        -e DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@postgres-db:5432/$DB_NAME" \
        -e PYTHONPATH="/app" \
        $IMAGE_NAME
    
    if [ $? -eq 0 ]; then
        log_success "容器启动成功"
        log_info "应用访问地址: http://localhost:$HOST_PORT"
    else
        log_error "容器启动失败"
        exit 1
    fi
}

# 检查应用健康状态
check_health() {
    log_info "检查应用健康状态..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:$HOST_PORT/health &> /dev/null; then
            log_success "应用健康检查通过"
            return 0
        fi
        
        log_info "等待应用启动... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    log_warning "应用健康检查超时，请手动检查"
}

# 显示日志
show_logs() {
    if [ "$1" = "--logs" ] || [ "$1" = "-l" ]; then
        log_info "显示应用日志..."
        docker logs -f $CONTAINER_NAME
    fi
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  -l, --logs     启动后显示日志"
    echo "  --no-db        跳过数据库启动"
    echo "  --no-migrate   跳过数据库迁移"
    echo "  --rebuild      强制重新构建镜像"
    echo ""
    echo "示例:"
    echo "  $0              # 标准部署"
    echo "  $0 --logs       # 部署并显示日志"
    echo "  $0 --no-db      # 跳过数据库启动"
    echo "  $0 --rebuild    # 强制重新构建"
}

# 主函数
main() {
    local skip_db=false
    local skip_migrate=false
    local rebuild=false
    local show_logs_flag=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -l|--logs)
                show_logs_flag=true
                shift
                ;;
            --no-db)
                skip_db=true
                shift
                ;;
            --no-migrate)
                skip_migrate=true
                shift
                ;;
            --rebuild)
                rebuild=true
                shift
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    log_info "开始本地部署..."
    
    # 执行部署步骤
    check_docker
    check_files
    cleanup_existing
    
    if [ "$rebuild" = true ] || ! docker images | grep -q $IMAGE_NAME; then
        build_image
    else
        log_info "使用现有镜像: $IMAGE_NAME"
    fi
    
    create_network
    
    if [ "$skip_db" = false ]; then
        start_database
    fi
    
    if [ "$skip_migrate" = false ]; then
        run_migrations
    fi
    
    start_container
    check_health
    
    log_success "部署完成！"
    log_info "应用访问地址: http://localhost:$HOST_PORT"
    log_info "查看日志: docker logs $CONTAINER_NAME"
    log_info "停止应用: docker stop $CONTAINER_NAME"
    
    if [ "$show_logs_flag" = true ]; then
        show_logs --logs
    fi
}

# 执行主函数
main "$@"