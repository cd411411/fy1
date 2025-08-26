# app/api/admin.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.rag import VectorStoreData
from app.services.ai_service import get_ai_json_response
from .. import database
import orjson as json
from .dependencies import get_current_user
from typing import Any, Dict, Optional, List
from pydantic import BaseModel, Field, field_validator
from ..database import ModelType
from fastapi.security import OAuth2PasswordRequestForm
from ..security import create_access_token, verify_password
from datetime import timedelta
from ..config.config import settings

auth_router = APIRouter(prefix="/api/admin", tags=["Admin Auth"])

# 2. 创建一个受保护的、用于管理后台API的 router
admin_api_router = APIRouter(
    prefix="/api/admin", 
    tags=["Admin API"], 
    dependencies=[Depends(get_current_user)]
)

# --- Pydantic Models ---


class AIModelData(BaseModel):
    id: int
    model_name: str
    api_key: str 
    base_url: str
    description: Optional[str] = None
    
    # 新增的字段
    capabilities: List[str] = Field(default_factory=list)
    is_active_general: bool
    is_active_vision: bool
    is_active_fast: bool

    @field_validator('capabilities', mode='before')
    @classmethod
    def capabilities_from_json(cls, v):
        # 如果数据库字段是 NULL (在Python中是None)，或空字符串，返回空列表
        if v is None or v == '':
            return []
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return []
        return v
    
    class Config:
        from_attributes = True

class AIModelCreate(BaseModel):
    model_name: str
    api_key: str
    base_url: str
    description: Optional[str] = None
    capabilities: List[str] = []


class SetActiveModelRequest(BaseModel):
    model_type: ModelType

# --- Dashboard & Cases APIs ---


@admin_api_router.get("/stats")
async def get_stats(db: AsyncSession = Depends(database.get_db)):
    """
    获取系统统计数据
    
    Args:
        db (AsyncSession): 数据库会话依赖
        
    Returns:
        Dict[str, Any]: 包含系统各项统计数据的字典
    """
    return await database.get_system_stats(db)


@admin_api_router.get("/pending-cases")
async def get_pending_cases_api(
    search_term: Optional[str] = None, # (新增)
    db: AsyncSession = Depends(database.get_db)
):
    """
    获取待处理案件列表
    
    Args:
        search_term (Optional[str]): 搜索关键词，用于筛选案件
        db (AsyncSession): 数据库会话依赖
        
    Returns:
        List[Dict[str, Any]]: 待处理案件列表，包含案件基本信息
    """
    return await database.get_pending_cases(db=db, search_term=search_term)

# --- AI Model Management APIs (已移除重复依赖) ---


@admin_api_router.get("/ai-models", response_model=List[AIModelData])
async def get_all_ai_models(db: AsyncSession = Depends(database.get_db)):
    """
    获取所有AI模型配置
    
    Args:
        db (AsyncSession): 数据库会话依赖
        
    Returns:
        List[AIModelData]: 所有AI模型的配置信息列表
    """
    models = await database.get_ai_models(db)
    return models


@admin_api_router.post("/ai-models", response_model=AIModelData)
async def create_ai_model(model: AIModelCreate, db: AsyncSession = Depends(database.get_db)):
    """
    添加一个新的AI模型
    
    Args:
        model (AIModelCreate): 新模型的配置信息
        db (AsyncSession): 数据库会话依赖
        
    Returns:
        AIModelData: 新创建的模型信息
        
    Raises:
        HTTPException: 当模型创建失败或出现验证错误时
    """
    try:
        new_model = await database.add_ai_model(db, model.model_dump())
        return new_model
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"添加模型失败: {str(e)}")


@admin_api_router.delete("/ai-models/{model_id}")
async def remove_ai_model(model_id: int, db: AsyncSession = Depends(database.get_db)):
    """
    删除一个AI模型
    
    Args:
        model_id (int): 要删除的模型ID
        db (AsyncSession): 数据库会话依赖
        
    Returns:
        Dict[str, str]: 删除成功消息
        
    Raises:
        HTTPException: 当模型未找到或无法删除时
    """
    try:
        success = await database.delete_ai_model(db, model_id)
        if not success:
            raise HTTPException(status_code=404, detail="模型未找到")
        return {"message": "模型删除成功"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@admin_api_router.patch("/ai-models/{model_id}/set-active")
async def activate_ai_model(
    model_id: int,
    request: SetActiveModelRequest,
    db: AsyncSession = Depends(database.get_db)
):
    """
    激活指定AI模型为特定类型
    
    Args:
        model_id (int): 要激活的模型ID
        request (SetActiveModelRequest): 包含模型类型的请求体
        db (AsyncSession): 数据库会话依赖
        
    Returns:
        Dict[str, str]: 激活成功消息
        
    Raises:
        HTTPException: 当模型未找到或无法激活时
    """
    try:
        success = await database.set_active_ai_model(db, model_id, request.model_type)
        if not success:
            raise HTTPException(status_code=404, detail="模型未找到")
        return {"message": f"模型已成功激活为 '{request.model_type}' 类型"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@auth_router.post("/token")
async def login_for_access_token(
    db: AsyncSession = Depends(database.get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    用户登录认证并获取访问令牌
    
    Args:
        db (AsyncSession): 数据库会话依赖
        form_data (OAuth2PasswordRequestForm): 登录表单数据，包含用户名和密码
        
    Returns:
        Dict[str, str]: 访问令牌和令牌类型
        
    Raises:
        HTTPException: 当认证失败时
    """
    # 开源版，任意用户密码都可以登录
    if not settings.is_court_mode:
        access_token = create_access_token(data={"sub": form_data.username})
        return {"access_token": access_token, "token_type": "bearer"}

    # 1. 根据用户名从数据库查找用户
    user = await database.get_user_by_username(db, username=form_data.username)
    
    # 2. 如果用户不存在，或者密码不匹配，则验证失败
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. 验证成功，为该用户创建JWT
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

class DeactivateModelRequest(BaseModel):
    model_type: ModelType

@admin_api_router.patch("/ai-models/deactivate")
async def deactivate_model(
    request: DeactivateModelRequest,
    db: AsyncSession = Depends(database.get_db)
):
    """
    取消指定类型模型的激活状态
    
    Args:
        request (DeactivateModelRequest): 包含模型类型的请求体
        db (AsyncSession): 数据库会话依赖
        
    Returns:
        Dict[str, str]: 取消激活成功消息
        
    Raises:
        HTTPException: 当操作失败时
    """
    try:
        success = await database.deactivate_ai_model(db, request.model_type)
        if not success:
            # 即使没有行被更新（本来就没激活的），也视为成功
            pass
        return {"message": f"'{request.model_type}' 类型的模型已取消激活"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    
class StatsForAIRequest(BaseModel):
    stats: Dict[str, Any]

@admin_api_router.post("/ai-insights") # (修改) 改为POST，接收数据
async def get_ai_insights(
    request: StatsForAIRequest,
    db: AsyncSession = Depends(database.get_db)
):
    """
    获取AI对统计数据的分析洞察
    
    Args:
        request (StatsForAIRequest): 包含统计数据的请求体
        db (AsyncSession): 数据库会话依赖
        
    Returns:
        Dict[str, List[str]]: AI生成的分析洞察列表
    """
    stats_text = json.dumps(request.stats).decode('utf-8')
    
    prompt = f"""
    你是一名高级法院数据分析师，任务是为管理者解读本月的立案统计数据，发现潜在问题或趋势，并提出管理建议。

    [本月立案核心统计数据]:
    ---
    {stats_text}
    ---

    **你的任务 (以JSON格式返回):**
    请基于上述JSON数据，生成2-3条具有洞察力的分析或建议。分析应聚焦于数据本身，例如案由的集中度、与上月对比的趋势（如果可推断）、待立案与已立案的比例等。
    
    **输出格式:**
    {{
      "insights": [
        "【洞察一：例如，'本月“买卖合同纠纷”案件占比较高({request.stats['monthly_top_causes'][0]['count']}件)，提示可能需要关注相关领域的商业活动风险。'】",
        "【洞察二：例如，'待立案案件数量({request.stats['pending_cases']})与本月已立案数量({request.stats['this_month_filed']})比例较高，建议加快立案审查流程以提高效率。'】",
        "【洞察三：例如，'本周案件量在周三({request.stats['weekly_daily_trend'][2]['date']})达到峰值，反映了每周中段的收案压力。'】"
      ]
    }}
    """
    try:
        response = await get_ai_json_response(prompt, db, "general",request_source="立案统计")
        return response
    except Exception as e:
        return {"insights": [f"AI洞察分析失败: {e}"]}
    
class AIModelUpdate(BaseModel):
    model_name: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    description: Optional[str] = None
    capabilities: Optional[List[str]] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    max_tokens: Optional[int] = None

@admin_api_router.put("/ai-models/{model_id}", response_model=AIModelData)
async def edit_ai_model(
    model_id: int,
    model_update: AIModelUpdate,
    db: AsyncSession = Depends(database.get_db)
):
    """
    更新AI模型配置信息
    
    Args:
        model_id (int): 要更新的模型ID
        model_update (AIModelUpdate): 包含要更新字段的请求体
        db (AsyncSession): 数据库会话依赖
        
    Returns:
        AIModelData: 更新后的模型信息
        
    Raises:
        HTTPException: 当模型未找到时
    """
    # model_dump(exclude_unset=True) 只包含前端实际发送的字段
    updated_model = await database.update_ai_model(db, model_id, model_update.model_dump(exclude_unset=True))
    if not updated_model:
        raise HTTPException(status_code=404, detail="模型未找到")
    return updated_model

class FeatureFlagUpdate(BaseModel):
    is_enabled: bool

@auth_router.get("/feature-flags")
async def get_flags(db: AsyncSession = Depends(database.get_db)):
    """
    获取所有功能开关状态
    
    Args:
        db (AsyncSession): 数据库会话依赖
        
    Returns:
        List[FeatureFlag]: 返回所有功能开关的列表，包括开关的键名、名称、描述和启用状态
    """
    return await database.get_all_feature_flags(db)

@admin_api_router.patch("/feature-flags/{key}")
async def update_flag(key: str, payload: FeatureFlagUpdate, db: AsyncSession = Depends(database.get_db)):
    """
    更新功能开关状态
    
    Args:
        key (str): 功能开关的键名
        payload (FeatureFlagUpdate): 包含新状态的请求体
        db (AsyncSession): 数据库会话依赖
        
    Returns:
        FeatureFlag: 更新后的功能开关信息
        
    Raises:
        HTTPException: 当功能开关未找到时
    """
    updated_flag = await database.update_feature_flag(db, key, payload.is_enabled)
    if not updated_flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    return updated_flag

@admin_api_router.get("/ai-usage-stats")
async def get_usage_stats(db: AsyncSession = Depends(database.get_db)):
    """获取AI Token使用量的统计数据"""
    return await database.get_ai_usage_stats(db)

class VectorStoreCreate(BaseModel):
    case_cause: str

@admin_api_router.post("/vector-stores", response_model=VectorStoreData)
async def create_vector_store_api(
    payload: VectorStoreCreate,
    db: AsyncSession = Depends(database.get_db)
):
    """为指定的案由创建一个新的向量库配置"""
    try:
        return await database.create_vector_store(db, payload.case_cause)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e)) # 409 Conflict
