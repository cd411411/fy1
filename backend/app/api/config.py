# app/api/config.py
from fastapi import APIRouter,Depends
from ..config.config import settings
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/api/config", tags=["Config"])

@router.get("/app-mode")
async def get_app_mode():
    return {"app_mode": settings.APP_MODE}