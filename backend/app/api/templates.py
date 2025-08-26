from fastapi import APIRouter, HTTPException, Depends, Query

from app.templates.template_database import TEMPLATE_DATABASE
from .. import database
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Dict, Any
from ..services.ai_service import get_ai_json_response
from ..templates.template_cache import get_templates_by_category, find_template_path_by_cause

router = APIRouter(prefix="/api/templates", tags=["Templates"])


@router.get("/{doc_type}/{category}")
async def get_templates_by_category_endpoint(doc_type: str, category: str) -> List[Dict[str, Any]]:
    return await get_templates_by_category(doc_type, category)

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
    你是一位经验丰富的法律导诉员。你的任务是阅读用户的“案情简述”，然后从“可用模板列表”中，推荐一个最匹配的模板。因为你直接面对用户，因此请用‘您’来称呼对方。

    你必须严格按照以下JSON格式返回，只推荐一个最合适的模板ID。如果找不到合适的模版，则返回"recommended_template_id": "null"

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
        response_json = await get_ai_json_response(prompt,db,request_source="模版匹配",model_type="fast")
        return response_json
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI推荐失败: {str(e)}")
    
class PathResponse(BaseModel):
    path: str

@router.get("/find-path")
async def find_template_path_by_cause_endpoint(
    doc_type_name: str = Query(..., description="文书类型，例如：'起诉状' 或 '答辩状'"),
    case_cause: str = Query(..., description="案由，例如：'离婚纠纷'")
) -> PathResponse:
    """
    根据文书类型和案由，在所有类别中查找对应的模板路径。
    """
    
    doc_type_key = 'claim' if doc_type_name == '起诉状' else 'defense' if doc_type_name == '答辩状' else 'application'
    
    # 在缓存中查找模板路径
    path = await find_template_path_by_cause(doc_type_key, case_cause)
    
    if path:
        return PathResponse(path=path)

    # 如果没有找到匹配项
    raise HTTPException(
        status_code=404,
        detail=f"未能找到与案由 '{case_cause}' 和文书类型 '{doc_type_name}' 匹配的模板路径。"
    )

@router.get("/all-case-causes")
async def get_all_supported_case_causes():
    """
    从模板数据库中提取并返回所有支持的、唯一的案由列表。
    """
    all_causes = set()
    
    for doc_type_data in TEMPLATE_DATABASE.values():
        for category_data in doc_type_data.values():
            for template in category_data:
                # 只添加未被禁用的模板的案由
                if not template.get("disabled"):
                    all_causes.add(template["name"])
                    
    return sorted(list(all_causes))

@router.get("/all-structured")
async def get_all_structured_case_causes() -> Dict[str, List[Dict[str, Any]]]:
    """
    获取所有按类别组织的、支持的案由模板列表。
    """
    structured_causes: Dict[str, List[Dict[str, Any]]] = {
        "民事案由": [],
        "刑事案由": [],
        "行政案由": [],
        "申请事项": [],
    }
    
    # 定义类别映射
    category_map = {
        "civil": "民事案由",
        "criminal": "刑事案由",
        "administrative": "行政案由",
    }

    # 遍历所有“起诉状”模板
    for category_key, templates in TEMPLATE_DATABASE.get("claim", {}).items():
        display_category = category_map.get(category_key)
        if display_category:
            for template in templates:
                if not template.get("disabled"):
                    structured_causes[display_category].append(template)
    
    # 遍历所有“申请”模板
    for category_key, templates in TEMPLATE_DATABASE.get("application", {}).items():
         for template in templates:
            if not template.get("disabled"):
                # 将所有申请事项统一归类
                structured_causes["申请事项"].append(template)

    # 移除没有模板的类别
    return {k: v for k, v in structured_causes.items() if v}
