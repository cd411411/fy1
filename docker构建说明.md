# 项目目录结构

```
your-project/
├── Dockerfile                 # 多阶段构建 Dockerfile
├── docker-compose.yml         # Docker Compose 配置
├── .dockerignore              # Docker 忽略文件
├── frontend/                  # 前端代码目录
│   ├── package.json
│   ├── package-lock.json
│   ├── src/
│   ├── public/
│   └── dist/                  # 构建输出目录（构建后生成）
├── backend/                   # 后端代码目录
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py
│   │   ├── static/           # 静态文件目录（Dockerfile 会将前端 dist 复制到这里）
│   │   └── ...
│   └── ...
├── nginx/                     # Nginx 配置目录
│   ├── nginx.conf            # 主配置文件
│   ├── conf.d/
│   │   └── default.conf      # 站点配置
│   ├── logs/                 # 日志目录
│   └── ssl/                  # SSL 证书目录（可选）
├── db/                       # 数据库初始化脚本（可选）
│   └── init/
└── logs/                     # 应用日志目录
```

## 构建步骤

### 1. 构建和运行

#### 开发环境
```bash
# 构建镜像
docker-compose build

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

#### 生产环境
```bash
# 构建并启动（后台运行）
docker-compose up -d --build

# 重启特定服务
docker-compose restart nginx

# 查看服务状态
docker-compose ps
```

### 2. 访问应用

- 前端应用: http://localhost
- API 接口: http://localhost/api/
- 健康检查: http://localhost/health

### 3. 监控和维护

```bash
# 查看实时日志
docker-compose logs -f backend
docker-compose logs -f nginx

# 进入容器调试
docker-compose exec backend bash
docker-compose exec nginx sh

# 更新服务
docker-compose pull
docker-compose up -d
```

## 配置说明

### 环境变量
在 `docker-compose.yml` 中的 `environment` 部分添加你需要的环境变量。

### 数据库配置
如果需要数据库，取消注释 `docker-compose.yml` 中的数据库部分。

### SSL/HTTPS 配置
1. 将 SSL 证书放在 `nginx/ssl/` 目录下
2. 取消注释 `nginx/conf.d/default.conf` 中的 HTTPS 部分
3. 修改域名配置

### 性能优化
- 调整 Gunicorn worker 数量 (`-w` 参数)
- 配置 Nginx 缓存
- 启用 HTTP/2 和 Gzip 压缩

## 故障排除

### 常见问题
1. **前端构建失败**: 检查 `frontend/package.json` 和依赖
2. **后端启动失败**: 检查 `backend/requirements.txt` 和 Python 版本
3. **Nginx 502 错误**: 检查后端服务是否正常启动
4. **静态文件 404**: 确认前端构建产物在 `dist` 目录

### 调试命令
```bash
# 检查容器状态
docker-compose ps

# 查看构建日志
docker-compose build --no-cache

# 检查网络连接
docker-compose exec nginx ping backend
```