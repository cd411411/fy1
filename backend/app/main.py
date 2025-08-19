# app/main.py

from fastapi import FastAPI, Request, Response
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from .api import documents, ai, parties, text, legal, templates, cases, config, admin, feature_flags
from .database import AsyncSessionLocal, engine, Base
from pathlib import Path

from app import database

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理。
    在开发环境中，这将自动创建数据库表（如果尚不存在）。
    在生产环境中，数据库迁移应由 Alembic 手动管理。
    """
    print("Application startup...")
    async with engine.begin() as conn:
        # 使用 conn.run_sync 来运行同步的 Alembic/SQLAlchemy DDL 命令
        # 这对于开发非常方便，但在生产中应该注释掉或通过环境变量控制。
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as db:
        await database.create_feature_flag_if_not_exists(
            db, "risk_analysis", "AI风险预警", "在用户字段失焦时，分析内容是否存在法律风险。", True
        )
        await database.create_feature_flag_if_not_exists(
            db, "autocomplete", "AI智能续写", "在用户输入停顿时，提供续写建议。", True
        )
        
    print("Database tables checked/created.")
    yield
    
    print("Application shutdown...")


STATIC_FILES_DIR = Path(__file__).parent / "static"
INDEX_HTML_PATH = STATIC_FILES_DIR / "index.html"

app = FastAPI(title="要素式生成平台API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 首先注册所有API路由
app.include_router(documents.router)
app.include_router(ai.router)
app.include_router(parties.router)
app.include_router(text.router)
app.include_router(legal.router)
app.include_router(templates.router)
app.include_router(cases.router)
app.include_router(admin.auth_router)
app.include_router(admin.admin_api_router)
app.include_router(config.router)
app.include_router(feature_flags.router)


# 然后挂载静态文件
app.mount("/assets", StaticFiles(directory=STATIC_FILES_DIR / "assets"), name="assets")

# 根路径处理器 - 放在通配符路由之前
@app.get("/")
async def root():
    if INDEX_HTML_PATH.exists():
        return FileResponse(INDEX_HTML_PATH)
    else:
        return Response("Frontend not built yet.", status_code=503)

# 通配符路由处理器 - 放在最后
@app.get("/{full_path:path}")
async def serve_react_app(request: Request, full_path: str):
    if "." in full_path.split("/")[-1]:
        return Response(status_code=404)
        
    if INDEX_HTML_PATH.exists():
        return FileResponse(INDEX_HTML_PATH)
    else:
        return Response("Frontend not built yet.", status_code=503)