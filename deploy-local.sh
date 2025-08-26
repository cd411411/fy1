#!/bin/bash

# 本地开发环境自动部署脚本
# 用于快速搭建前后端分离的开发环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 配置变量
FRONTEND_DIR="frontend"
BACKEND_DIR="backend"
VENV_NAME="venv"
NODE_MIN_VERSION="16"
PYTHON_MIN_VERSION="3.8"

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

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# 显示横幅
show_banner() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                   开发环境自动部署工具                        ║"
    echo "║               Development Environment Setup                   ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 检查操作系统
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 获取版本号
get_version() {
    local cmd="$1"
    local version_flag="$2"
    local version_pattern="$3"
    
    if command_exists "$cmd"; then
        $cmd $version_flag 2>/dev/null | grep -oE "$version_pattern" | head -n1
    else
        echo ""
    fi
}

# 比较版本号
version_ge() {
    local version1="$1"
    local version2="$2"
    [ "$(printf '%s\n' "$version2" "$version1" | sort -V | head -n1)" = "$version2" ]
}

# 检查并安装 Node.js
check_install_nodejs() {
    log_step "检查 Node.js 环境..."
    
    local node_version
    local npm_version
    local os_type=$(detect_os)
    
    if command_exists node; then
        node_version=$(get_version "node" "--version" "[0-9]+\.[0-9]+\.[0-9]+")
        log_info "发现 Node.js 版本: $node_version"
        
        if version_ge "$node_version" "$NODE_MIN_VERSION.0.0"; then
            log_success "Node.js 版本满足要求 (>= $NODE_MIN_VERSION)"
        else
            log_warning "Node.js 版本过低，需要升级"
            install_nodejs "$os_type"
        fi
    else
        log_warning "未发现 Node.js，开始安装..."
        install_nodejs "$os_type"
    fi
    
    # 检查 npm
    if command_exists npm; then
        npm_version=$(get_version "npm" "--version" "[0-9]+\.[0-9]+\.[0-9]+")
        log_success "npm 版本: $npm_version"
    else
        log_error "npm 未安装，请手动安装 Node.js"
        exit 1
    fi
}

# 安装 Node.js
install_nodejs() {
    local os_type="$1"
    
    case $os_type in
        "linux")
            if command_exists apt-get; then
                log_info "使用 apt 安装 Node.js..."
                curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
                sudo apt-get install -y nodejs
            elif command_exists yum; then
                log_info "使用 yum 安装 Node.js..."
                curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
                sudo yum install -y nodejs npm
            else
                log_error "不支持的 Linux 发行版，请手动安装 Node.js"
                exit 1
            fi
            ;;
        "macos")
            if command_exists brew; then
                log_info "使用 Homebrew 安装 Node.js..."
                brew install node
            else
                log_warning "未发现 Homebrew，请先安装 Homebrew 或手动安装 Node.js"
                echo "Homebrew 安装命令: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
                exit 1
            fi
            ;;
        "windows")
            log_error "Windows 系统请手动下载安装 Node.js: https://nodejs.org/"
            exit 1
            ;;
        *)
            log_error "不支持的操作系统，请手动安装 Node.js"
            exit 1
            ;;
    esac
}

# 检查并安装 Python
check_install_python() {
    log_step "检查 Python 环境..."
    
    local python_cmd=""
    local python_version=""
    
    # 检查 python3
    if command_exists python3; then
        python_cmd="python3"
        python_version=$(get_version "python3" "--version" "[0-9]+\.[0-9]+\.[0-9]+")
    elif command_exists python; then
        python_version=$(get_version "python" "--version" "[0-9]+\.[0-9]+\.[0-9]+")
        if [[ $python_version == 3.* ]]; then
            python_cmd="python"
        fi
    fi
    
    if [ -n "$python_cmd" ] && [ -n "$python_version" ]; then
        log_info "发现 Python 版本: $python_version"
        if version_ge "$python_version" "$PYTHON_MIN_VERSION.0"; then
            log_success "Python 版本满足要求 (>= $PYTHON_MIN_VERSION)"
            echo "$python_cmd"
        else
            log_error "Python 版本过低，请升级到 $PYTHON_MIN_VERSION 或更高版本"
            exit 1
        fi
    else
        log_error "未发现合适的 Python 3 版本，请安装 Python 3.$PYTHON_MIN_VERSION+"
        exit 1
    fi
}

# 检查并安装 uv
check_install_uv() {
    log_step "检查 uv 包管理器..."
    
    if command_exists uv; then
        local uv_version=$(get_version "uv" "--version" "[0-9]+\.[0-9]+\.[0-9]+")
        log_success "uv 版本: $uv_version"
    else
        log_info "安装 uv 包管理器..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
        
        # 重新加载环境变量
        export PATH="$HOME/.cargo/bin:$PATH"
        
        if command_exists uv; then
            log_success "uv 安装成功"
        else
            log_warning "uv 安装失败，使用 pip 作为备选方案"
            return 1
        fi
    fi
}

# 检查目录结构
check_project_structure() {
    log_step "检查项目结构..."
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        log_error "前端目录 '$FRONTEND_DIR' 不存在"
        exit 1
    fi
    
    if [ ! -d "$BACKEND_DIR" ]; then
        log_error "后端目录 '$BACKEND_DIR' 不存在"
        exit 1
    fi
    
    if [ ! -f "$FRONTEND_DIR/package.json" ]; then
        log_error "前端 package.json 不存在"
        exit 1
    fi
    
    if [ ! -f "$BACKEND_DIR/requirements.txt" ]; then
        log_error "后端 requirements.txt 不存在"
        exit 1
    fi
    
    log_success "项目结构检查通过"
}

# 设置前端环境
setup_frontend() {
    log_step "设置前端开发环境..."
    
    cd "$FRONTEND_DIR"
    
    # 检查 node_modules
    if [ -d "node_modules" ]; then
        log_info "发现现有 node_modules，清理中..."
        rm -rf node_modules package-lock.json
    fi
    
    # 安装依赖
    log_info "安装前端依赖..."
    npm install
    
    if [ $? -eq 0 ]; then
        log_success "前端依赖安装完成"
    else
        log_error "前端依赖安装失败"
        exit 1
    fi
    
    cd ..
}

# 设置后端环境
setup_backend() {
    log_step "设置后端开发环境..."
    
    local python_cmd=$(check_install_python)
    cd "$BACKEND_DIR"
    
    # 创建虚拟环境
    if [ -d "$VENV_NAME" ]; then
        log_info "发现现有虚拟环境，清理中..."
        rm -rf "$VENV_NAME"
    fi
    
    log_info "创建 Python 虚拟环境..."
    $python_cmd -m venv "$VENV_NAME"
    
    # 激活虚拟环境
    source "$VENV_NAME/bin/activate"
    
    # 升级 pip
    log_info "升级 pip..."
    pip install --upgrade pip
    
    # 安装 uv 并使用它安装依赖
    if check_install_uv; then
        log_info "使用 uv 安装后端依赖..."
        uv pip install -r requirements.txt
    else
        log_info "使用 pip 安装后端依赖..."
        pip install -r requirements.txt
    fi
    
    if [ $? -eq 0 ]; then
        log_success "后端依赖安装完成"
        log_info "虚拟环境位置: $(pwd)/$VENV_NAME"
    else
        log_error "后端依赖安装失败"
        exit 1
    fi
    
    # 检查是否需要运行数据库迁移
    if [ -d "alembic" ]; then
        log_info "发现 Alembic 配置，准备数据库迁移..."
        log_warning "请确保数据库已启动，然后运行: alembic upgrade head"
    fi
    
    cd ..
}

# 创建启动脚本
create_start_scripts() {
    log_step "创建启动脚本..."
    
    # 前端启动脚本
    cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "启动前端开发服务器..."
cd frontend
npm run dev
EOF
    
    # 后端启动脚本
    cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "启动后端开发服务器..."
cd backend
source venv/bin/activate

# 检查是否需要运行迁移
if [ -d "alembic" ] && [ ! -f ".migration_done" ]; then
    echo "运行数据库迁移..."
    alembic upgrade head
    touch .migration_done
fi

# 启动开发服务器
if [ -f "main.py" ]; then
    python main.py
elif [ -f "app/main.py" ]; then
    python -m app.main
elif [ -f "manage.py" ]; then
    python manage.py runserver
else
    echo "未找到启动文件，请手动启动应用"
    echo "常用命令:"
    echo "  uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    echo "  python -m app.main"
    echo "  flask run"
fi
EOF
    
    # 数据库启动脚本（使用 Docker）
    cat > start-database.sh << 'EOF'
#!/bin/bash
echo "启动开发数据库..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "Docker 未安装，请手动启动数据库"
    exit 1
fi

# 启动 PostgreSQL
docker run -d \
    --name dev-postgres \
    -e POSTGRES_DB=myapp_db \
    -e POSTGRES_USER=myapp_user \
    -e POSTGRES_PASSWORD=myapp_password \
    -p 5432:5432 \
    -v postgres_dev_data:/var/lib/postgresql/data \
    postgres:15-alpine

echo "数据库启动命令已执行"
echo "数据库连接信息："
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: myapp_db"
echo "  Username: myapp_user"
echo "  Password: myapp_password"
EOF
    
    # 给脚本执行权限
    chmod +x start-frontend.sh start-backend.sh start-database.sh
    
    log_success "启动脚本创建完成"
}

# 创建环境变量模板
create_env_template() {
    log_step "创建环境变量模板..."
    
    # 后端环境变量
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        cat > "$BACKEND_DIR/.env.example" << 'EOF'
# 数据库配置
DATABASE_URL=postgresql://myapp_user:myapp_password@localhost:5432/myapp_db

# Redis 配置（可选）
REDIS_URL=redis://localhost:6379/0

# JWT 密钥
SECRET_KEY=your-secret-key-here

# 开发模式
DEBUG=True

# API 配置
API_HOST=0.0.0.0
API_PORT=8000

# CORS 配置
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
EOF
        
        # 复制为实际的 .env 文件
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        log_success "后端环境变量模板创建完成"
    fi
    
    # 前端环境变量
    if [ ! -f "$FRONTEND_DIR/.env" ]; then
        cat > "$FRONTEND_DIR/.env.example" << 'EOF'
# API 基础URL
VITE_API_BASE_URL=http://localhost:8000
# 或者如果使用 React (Create React App)
REACT_APP_API_BASE_URL=http://localhost:8000

# 开发模式
NODE_ENV=development
EOF
        
        # 复制为实际的 .env 文件
        cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
        log_success "前端环境变量模板创建完成"
    fi
}

# 显示使用说明
show_usage_instructions() {
    log_success "开发环境设置完成！"
    echo ""
    echo -e "${CYAN}=== 使用说明 ===${NC}"
    echo ""
    echo -e "${YELLOW}1. 启动数据库：${NC}"
    echo "   ./start-database.sh"
    echo ""
    echo -e "${YELLOW}2. 启动后端服务器（新终端）：${NC}"
    echo "   ./start-backend.sh"
    echo ""
    echo -e "${YELLOW}3. 启动前端服务器（新终端）：${NC}"
    echo "   ./start-frontend.sh"
    echo ""
    echo -e "${YELLOW}手动启动方式：${NC}"
    echo ""
    echo -e "${GREEN}后端：${NC}"
    echo "   cd $BACKEND_DIR"
    echo "   source $VENV_NAME/bin/activate"
    echo "   alembic upgrade head  # 运行数据库迁移"
    echo "   uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    echo ""
    echo -e "${GREEN}前端：${NC}"
    echo "   cd $FRONTEND_DIR"
    echo "   npm run dev"
    echo ""
    echo -e "${YELLOW}常用开发命令：${NC}"
    echo "   后端虚拟环境激活: cd $BACKEND_DIR && source $VENV_NAME/bin/activate"
    echo "   安装新的 Python 包: uv pip install package_name"
    echo "   安装新的 Node 包: cd $FRONTEND_DIR && npm install package_name"
    echo "   数据库迁移: cd $BACKEND_DIR && alembic revision --autogenerate -m \"description\""
    echo "   应用迁移: cd $BACKEND_DIR && alembic upgrade head"
    echo ""
    echo -e "${CYAN}项目访问地址：${NC}"
    echo "   前端: http://localhost:3000 或 http://localhost:5173"
    echo "   后端 API: http://localhost:8000"
    echo "   API 文档: http://localhost:8000/docs"
    echo ""
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help           显示帮助信息"
    echo "  --skip-frontend      跳过前端环境设置"
    echo "  --skip-backend       跳过后端环境设置"
    echo "  --no-scripts         不创建启动脚本"
    echo "  --clean              清理现有环境后重新安装"
    echo ""
    echo "示例:"
    echo "  $0                   # 完整设置开发环境"
    echo "  $0 --skip-frontend   # 只设置后端环境"
    echo "  $0 --clean           # 清理后重新设置"
}

# 清理现有环境
clean_environment() {
    log_step "清理现有开发环境..."
    
    # 清理前端
    if [ -d "$FRONTEND_DIR/node_modules" ]; then
        log_info "清理前端 node_modules..."
        rm -rf "$FRONTEND_DIR/node_modules"
        rm -f "$FRONTEND_DIR/package-lock.json"
    fi
    
    # 清理后端
    if [ -d "$BACKEND_DIR/$VENV_NAME" ]; then
        log_info "清理后端虚拟环境..."
        rm -rf "$BACKEND_DIR/$VENV_NAME"
    fi
    
    # 清理启动脚本
    rm -f start-frontend.sh start-backend.sh start-database.sh
    
    log_success "环境清理完成"
}

# 主函数
main() {
    local skip_frontend=false
    local skip_backend=false
    local no_scripts=false
    local clean_env=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            --skip-frontend)
                skip_frontend=true
                shift
                ;;
            --skip-backend)
                skip_backend=true
                shift
                ;;
            --no-scripts)
                no_scripts=true
                shift
                ;;
            --clean)
                clean_env=true
                shift
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 显示横幅
    show_banner
    
    # 清理环境（如果需要）
    if [ "$clean_env" = true ]; then
        clean_environment
    fi
    
    # 检查项目结构
    check_project_structure
    
    # 检查并安装必要工具
    if [ "$skip_frontend" = false ]; then
        check_install_nodejs
    fi
    
    if [ "$skip_backend" = false ]; then
        check_install_python
    fi
    
    # 设置开发环境
    if [ "$skip_frontend" = false ]; then
        setup_frontend
    fi
    
    if [ "$skip_backend" = false ]; then
        setup_backend
    fi
    
    # 创建配置文件
    create_env_template
    
    # 创建启动脚本
    if [ "$no_scripts" = false ]; then
        create_start_scripts
    fi
    
    # 显示使用说明
    show_usage_instructions
}

# 执行主函数
main "$@"