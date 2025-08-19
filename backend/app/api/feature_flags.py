# app/api/feature_flags.py (新文件)

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from .. import database
from typing import List

router = APIRouter(prefix="/api/feature-flags", tags=["Feature Flags"])

PUBLIC_FLAGS = ["autocomplete", "risk_analysis"] # 定义哪些是公开的

@router.get("/public")
async def get_public_feature_flags(db: AsyncSession = Depends(database.get_db)):
    """获取所有对公众开放的功能开关状态"""
    all_flags = await database.get_all_feature_flags(db)
    # 只返回在 PUBLIC_FLAGS 列表中的开关
    public_flags = [flag for flag in all_flags if flag.key in PUBLIC_FLAGS]
    return public_flags