# app/main.py

import logging
from fastapi import FastAPI, Request, Response
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from .api import documents, ai, parties, text, legal, templates, cases, config, admin, feature_flags, rag,chat
from .database import AsyncSessionLocal, engine, Base
from pathlib import Path
from . import log_queue
from app import database
from .services import ocr_service
from .templates.template_cache import initialize_template_cache


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理。
    在开发环境中，这将自动创建数据库表（如果尚不存在）。
    在生产环境中，数据库迁移应由 Alembic 手动管理。
    """
    # --- Startup ---
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
        await database.create_feature_flag_if_not_exists(
            db, 
            "use_local_ocr", 
            "启用本地OCR替代多模态模型", 
            "开启后，图片识别将使用本地PaddleOCR提取文本，再交由常规LLM分析。可降低成本和保护隐私。", 
            False # 默认关闭
        )
        await database.create_admin_user_if_not_exists(db)

        await ocr_service.get_ocr_engine(db)
    logger.info("Initializing template cache...")
    await initialize_template_cache() 
    log_queue.start_log_worker()  # (新增) 启动工作者 
    print("Database tables checked/created.")
    print("Application startup complete.")

    # Runtime
    yield

    # --- Shutdown ---
    print("Application shutdown...")
    log_queue.stop_log_worker()
    
    # 显式关闭数据库引擎
    print("Disposing database engine...")
    await engine.dispose()
    print("Database engine disposed.")
    
    print("Application shutdown complete.")




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

# 所有API路由
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
app.include_router(rag.router)
app.include_router(chat.router)


# 然后挂载静态文件
# app.mount("/assets", StaticFiles(directory=STATIC_FILES_DIR / "assets"), name="assets")

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