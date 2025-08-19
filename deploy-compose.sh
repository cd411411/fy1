#!/bin/bash

# Docker Compose 部署脚本
# 使用 Docker Compose 进行本地部署

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 检查必要文件
check_files() {
    log_info "检查必要文件..."
    
    if [ ! -f "docker-compose.yml" ]; then
        log_error "docker-compose.yml 不存在"
        exit 1
    fi
    
    if [ ! -f "Dockerfile" ]; then
        log_error "Dockerfile 不存在"
        exit 1
    fi
    
    log_success "文件检查完成"
}

# 检查 Docker 和 Docker Compose
check_docker() {
    log_info "检查 Docker 环境..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose 未安装"
        exit 1
    fi
    
    log_success "Docker 环境检查通过"
}

# 获取 Docker Compose 命令
get_compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        echo "docker compose"
    fi
}

# 停止所有服务
stop_services() {
    local compose_cmd=$(get_compose_cmd)
    
    log_info "停止现有服务..."
    $compose_cmd down
    log_success "服务停止完成"
}

# 构建镜像
build_images() {
    local compose_cmd=$(get_compose_cmd)
    local no_cache=""
    
    if [ "$1" = "--no-cache" ]; then
        no_cache="--no-cache"
        log_info "强制重新构建镜像..."
    else
        log_info "构建镜像..."
    fi
    
    $compose_cmd build $no_cache
    
    if [ $? -eq 0 ]; then
        log_success "镜像构建完成"
    else
        log_error "镜像构建失败"
        exit 1
    fi
}

# 启动数据库
start_database() {
    local compose_cmd=$(get_compose_cmd)
    
    log_info "启动数据库服务..."
    $compose_cmd up -d db redis
    
    log_info "等待数据库就绪..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if $compose_cmd exec -T db pg_isready -U myapp_user -d myapp_db &> /dev/null; then
            log_success "数据库已就绪"
            return 0
        fi
        
        log_info "等待数据库启动... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    log_error "数据库启动超时"
    exit 1
}

# 运行数据库迁移
run_migrations() {
    local compose_cmd=$(get_compose_cmd)
    
    log_info "运行数据库迁移..."
    
    # 使用 docker-compose run 运行一次性迁移任务
    $compose_cmd run --rm migrate
    
    if [ $? -eq 0 ]; then
        log_success "数据库迁移完成"
    else
        log_error "数据库迁移失败"
        exit 1
    fi
}

# 启动应用
start_app() {
    local compose_cmd=$(get_compose_cmd)
    
    log_info "启动应用服务..."
    $compose_cmd up -d app
    
    if [ $? -eq 0 ]; then
        log_success "应用启动成功"
    else
        log_error "应用启动失败"
        exit 1
    fi
}

# 检查服务状态
check_services() {
    local compose_cmd=$(get_compose_cmd)
    
    log_info "检查服务状态..."
    $compose_cmd ps
    
    # 检查应用健康状态
    log_info "检查应用健康状态..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:8000/health &> /dev/null; then
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
    local compose_cmd=$(get_compose_cmd)
    
    if [ "$1" = "--logs" ] || [ "$1" = "-l" ]; then
        log_info "显示应用日志..."
        $compose_cmd logs -f app
    fi
}

# 清理资源
cleanup() {
    local compose_cmd=$(get_compose_cmd)
    
    log_info "清理 Docker 资源..."
    $compose_cmd down -v --remove-orphans
    
    # 可选：清理未使用的镜像
    if docker images -f "dangling=true" -q | grep -q .; then
        docker rmi $(docker images -f "dangling=true" -q)
    fi
    
    log_success "资源清理完成"
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help        显示帮助信息"
    echo "  -l, --logs        启动后显示日志"
    echo "  --build           强制重新构建镜像"
    echo "  --no-cache        构建时不使用缓存"
    echo "  --no-migrate      跳过数据库迁移"
    echo "  --cleanup         清理所有资源并退出"
    echo "  --stop            停止所有服务并退出"
    echo ""
    echo "示例:"
    echo "  $0                 # 标准部署"
    echo "  $0 --logs          # 部署并显示日志"
    echo "  $0 --build         # 重新构建并部署"
    echo "  $0 --no-cache      # 强制重新构建所有镜像"
    echo "  $0 --cleanup       # 清理所有资源"
    echo "  $0 --stop          # 停止所有服务"
}

# 主函数
main() {
    local rebuild=false
    local no_cache=false
    local skip_migrate=false
    local show_logs_flag=false
    local cleanup_flag=false
    local stop_flag=false
    
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
            --build)
                rebuild=true
                shift
                ;;
            --no-cache)
                no_cache=true
                rebuild=true
                shift
                ;;
            --no-migrate)
                skip_migrate=true
                shift
                ;;
            --cleanup)
                cleanup_flag=true
                shift
                ;;
            --stop)
                stop_flag=true
                shift
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查环境
    check_docker
    check_files
    
    # 处理特殊操作
    if [ "$cleanup_flag" = true ]; then
        cleanup
        exit 0
    fi
    
    if [ "$stop_flag" = true ]; then
        stop_services
        exit 0
    fi
    
    log_info "开始 Docker Compose 部署..."
    
    # 停止现有服务
    stop_services
    
    # 构建镜像
    if [ "$rebuild" = true ]; then
        if [ "$no_cache" = true ]; then
            build_images --no-cache
        else
            build_images
        fi
    fi
    
    # 启动数据库
    start_database
    
    # 运行迁移
    if [ "$skip_migrate" = false ]; then
        run_migrations
    fi
    
    # 启动应用
    start_app
    
    # 检查服务状态
    check_services
    
    log_success "部署完成！"
    log_info "应用访问地址: http://localhost:8000"
    log_info "数据库端口: localhost:5432"
    log_info "Redis 端口: localhost:6379"
    echo ""
    log_info "常用命令:"
    echo "  查看日志: $(get_compose_cmd) logs -f app"
    echo "  查看状态: $(get_compose_cmd) ps"
    echo "  停止服务: $(get_compose_cmd) down"
    echo "  进入容器: $(get_compose_cmd) exec app bash"
    
    if [ "$show_logs_flag" = true ]; then
        show_logs --logs
    fi
}

# 执行主函数
main "$@"