from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from ..services.ai_service import get_ai_json_response
from sqlalchemy.ext.asyncio import AsyncSession
from .. import database


# --- Pydantic 模型 ---


class OptimizeTextRequest(BaseModel):
    text: str
    context: str = ""


class OptimizedVersion(BaseModel):
    version_text: str = Field(..., description="优化后的文本版本")
    focus_or_merits: str = Field(..., description="该版本的侧重点或优点")


class MultipleVersionsResponse(BaseModel):
    versions: List[OptimizedVersion]


router = APIRouter(prefix="/api/text", tags=["Text"])


@router.post("/optimize-multiple-versions", response_model=MultipleVersionsResponse)
async def optimize_text_multiple_versions(request: OptimizeTextRequest,db: AsyncSession = Depends(database.get_db)):
    """接收文本，一次性返回三种优化版本及其优点"""

    # 构造一个非常精密的、要求JSON输出的Prompt
    prompt = f"""
            你是一位顶级的法律文书撰写专家。你的任务是将以下"原始文本"优化成三个不同风格的专业版本，并为每个版本提供简短的"侧重点/优点"说明。

            三个版本的风格应各有侧重：
            1. **版本一 (严谨规范)**: 语言风格严谨、客观、书面化，用词准确规范，句式工整，完全符合传统法律文书的语言标准。
            2. **版本二 (简洁明确)**: 在保持专业性的前提下，语言更精炼、直接，删除冗余表述，突出核心要点，提高表达效率。
            3. **版本三 (逻辑优化)**: 重新梳理表述逻辑，优化语句间的衔接关系，增强论证的条理性和说服力，必要时调整段落结构。

            你必须严格按照以下JSON格式返回，不要包含任何额外的解释或文本。

            输出格式:
            {{
            "versions": [
                {{
                "version_text": "【版本一优化后的文本】",
                "focus_or_merits": "【版本一的侧重点或优点说明】"
                }},
                {{
                "version_text": "【版本二优化后的文本】",
                "focus_or_merits": "【版本二的侧重点或优点说明】"
                }},
                {{
                "version_text": "【版本三优化后的文本】",
                "focus_or_merits": "【版本三的侧重点或优点说明】"
                }}
            ]
            }}

            原始文本是基于: {request.context or '通用法律文书'}

            ---
            原始文本:
            "{request.text}"
            ---
            """

    try:
        # 调用一个新的、非流式的AI服务函数
        response_json = await get_ai_json_response(prompt,db)
        # 使用Pydantic模型进行验证和解析
        return MultipleVersionsResponse(**response_json)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"AI aalysis failed: {str(e)}")
