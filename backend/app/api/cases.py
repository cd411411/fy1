# app/api/cases.py
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from sqlalchemy import update

from app.api.dependencies import get_current_user

from .. import database
from ..database import Case
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/cases", tags=["Cases"], dependencies=[Depends(get_current_user)]
)


@router.get("/") # 建议为API响应添加Pydantic模型
async def get_all_cases(
    search_term: Optional[str] = None, # (新增)
    case_cause: Optional[str] = None, 
    db: AsyncSession = Depends(database.get_db)
):
    try:
        cases = await database.get_cases(db=db, search_term=search_term, case_cause=case_cause)
        return cases
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{case_number}/documents")
async def get_documents_for_case(
    case_number: str, db: AsyncSession = Depends(database.get_db)
):
    """获取特定案件的完整信息（案件、被告、文书）"""
    full_case_data = await database.get_documents_by_case_number(
        db=db, case_number=case_number
    )
    if not full_case_data:
        raise HTTPException(status_code=404, detail="未找到该案号的案件")
    return full_case_data


class UpdateCaseNumberRequest(BaseModel):
    new_case_number: str


@router.patch("/{case_id}/case-number")
async def update_case_number(
    case_id: int,
    request: UpdateCaseNumberRequest,
    db: AsyncSession = Depends(database.get_db),
    user: dict = Depends(get_current_user),  # 保护此接口
):
    if not request.new_case_number or not request.new_case_number.strip():
        raise HTTPException(status_code=400, detail="新案号不能为空")

    try:
        stmt = (
            update(Case)
            .where(Case.id == case_id)
            .values(case_number=request.new_case_number)
        )
        result = await db.execute(stmt)
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="案件未找到")
        await db.commit()
        return {"message": "案号更新成功"}
    except Exception as e:
        await db.rollback()
        # 处理 unique constraint 错误
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=409, detail=f"案号 '{request.new_case_number}' 已存在。"
            )
        raise HTTPException(status_code=500, detail="数据库更新失败")
