from fastapi import APIRouter, HTTPException, Depends, Query
from .. import database
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Dict, Any
from ..services.ai_service import get_ai_json_response
from ..templates.template_database import TEMPLATE_DATABASE


router = APIRouter(prefix="/api/templates", tags=["Templates"])


@router.get("/{doc_type}/{category}")
def get_templates_by_category(doc_type: str, category: str) -> List[Dict[str, Any]]:
    return TEMPLATE_DATABASE.get(doc_type, {}).get(category, [])

class RecommendTemplateRequest(BaseModel):
    description: str
    available_templates: List[Dict[str, Any]] # 将当前可用的模板列表传给AI

@router.post("/recommend")
async def recommend_template(request: RecommendTemplateRequest,db: AsyncSession = Depends(database.get_db)):
    """根据用户描述，推荐最合适的模板"""

    # 将模板列表格式化成一个简单的字符串，方便AI阅读
    template_list_str = "\n".join([
        f"- ID: {t['id']}, 名称: {t['name']}, 描述: {t['description']}" 
        for t in request.available_templates
    ])

    prompt = f"""
    你是一位经验丰富的法律导诉员。你的任务是阅读用户的“案情简述”，然后从“可用模板列表”中，推荐一个最匹配的模板。

    你必须严格按照以下JSON格式返回，只推荐一个最合适的模板ID。

    输出格式:
    {{
      "recommended_template_id": "【最匹配的模板ID】",
      "reason": "【你推荐这个模板的简短理由】"
    }}

    可用模板列表:
    ---
    {template_list_str}
    ---

    案情简述:
    ---
    {request.description}
    ---
    """

    try:
        response_json = await get_ai_json_response(prompt,db)
        return response_json
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI推荐失败: {str(e)}")
    
class PathResponse(BaseModel):
    path: str

@router.get("/find-path")
async def find_template_path_by_cause(
    doc_type_name: str = Query(..., description="文书类型，例如：'起诉状' 或 '答辩状'"),
    case_cause: str = Query(..., description="案由，例如：'离婚纠纷'")
) -> PathResponse:
    """
    根据文书类型和案由，在所有类别中查找对应的模板路径。
    """
    
    doc_type_key = 'claim' if doc_type_name == '起诉状' else 'defense' if doc_type_name == '答辩状' else 'application'
    
    # 在 TEMPLATE_DATABASE 中进行全面搜索
    if doc_type_key in TEMPLATE_DATABASE:
        for category_data in TEMPLATE_DATABASE[doc_type_key].values():
            for template in category_data:
                if template.get("name") == case_cause:
                    return PathResponse(path=template["path"])

    # 如果没有找到匹配项
    raise HTTPException(
        status_code=404,
        detail=f"未能找到与案由 '{case_cause}' 和文书类型 '{doc_type_name}' 匹配的模板路径。"
    )
