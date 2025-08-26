# Docker部署说明

## 使用Docker Compose部署

本项目提供了 [docker-compose.yml](file:///i:/python/ElementaryComplaintGenerator/backend/docker-compose.yml) 文件，可以一键部署包含应用和数据库的完整环境。

### 快速开始

1. 确保已安装 Docker 和 Docker Compose
2. 配置环境变量（参考下方说明）
3. 在项目根目录下运行：
   ```bash
   docker-compose up -d
   ```
4. 应用将在端口 8000 上可用: http://localhost:8000

### 环境变量配置

项目使用 [.env](file:///i:/python/ElementaryComplaintGenerator/backend/.env) 文件来配置环境变量。默认配置如下：

- `APP_MODE`: 应用模式，默认为 "court"
- `DATABASE_URL`: 数据库连接URL，默认使用 SQLite 数据库
- `ADMIN_USERNAME`: 管理员用户名，默认为 "admin"
- `ADMIN_PASSWORD`: 管理员密码，默认为 "a_very_secure_password_change_me"
- `SECRET_KEY`: JWT 密钥
- `ALGORITHM`: JWT 算法，默认为 "HS256"
- `ACCESS_TOKEN_EXPIRE_MINUTES`: 访问令牌过期时间，默认为 480 分钟

如需使用 PostgreSQL 数据库，请取消注释并配置以下变量：
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

### Docker Compose 配置说明

[docker-compose.yml](file:///i:/python/ElementaryComplaintGenerator/backend/docker-compose.yml) 包含两个服务：

1. `backend`: 应用服务
   - 映射主机端口 8000 到容器端口 8000
   - 使用项目中的 [.env](file:///i:/python/ElementaryComplaintGenerator/backend/.env) 文件配置环境变量
   - 挂载以下卷以实现数据持久化：
     - `uploads`: 上传文件存储
     - `outputs`: 输出文件存储
     - `templates`: 模板文件存储
     - `ai_prompts`: AI 提示模板存储

2. `db`: PostgreSQL 数据库服务（可选）
   - 使用 postgres:15-alpine 镜像
   - 数据存储在 `postgres_data` Docker 卷中

### 数据持久化

应用数据通过 Docker 卷进行持久化存储：
- PostgreSQL 数据存储在 `postgres_data` 卷中
- 上传文件存储在 `uploads` 卷中
- 输出文件存储在 `outputs` 卷中
- 模板文件存储在 `templates` 卷中
- AI 提示模板存储在 `ai_prompts` 卷中

### 常用命令

- 启动服务: `docker-compose up -d`
- 停止服务: `docker-compose down`
- 查看日志: `docker-compose logs -f backend`
- 执行应用容器中的命令: `docker-compose exec backend <command>`
- 重新构建镜像: `docker-compose build`

### 开发环境配置1

对于开发环境，您可以使用 `docker-compose.override.yml` 来覆盖默认配置。创建该文件并添加开发特定的配置，例如：
- 代码热重载
- 文件卷挂载
- 调试端口暴露

### 单独使用Docker

如果您只想运行应用容器，可以使用：
```bash
docker build -t backend .
docker run -p 8000:8000 backend
```