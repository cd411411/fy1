import json
import logging
from typing import Dict, Any, List, Optional
from ..cache import get_redis_client
from .template_database import TEMPLATE_DATABASE

logger = logging.getLogger(__name__)

# Redis中存储模板数据的键名
TEMPLATE_CACHE_KEY = "legal_template_database"
TEMPLATE_CACHE_EXPIRE = 3600  # 缓存过期时间(秒)，设置为1小时


async def initialize_template_cache() -> bool:
    """
    初始化模板缓存，将模板数据库中的数据存储到Redis中
    
    Returns:
        bool: 初始化是否成功
    """
    try:
        redis_client = get_redis_client()
        # 将模板数据转换为JSON字符串并存储到Redis
        await redis_client.set(
            TEMPLATE_CACHE_KEY,
            json.dumps(TEMPLATE_DATABASE, ensure_ascii=False),
            ex=TEMPLATE_CACHE_EXPIRE
        )
        logger.info("模板缓存初始化成功")
        return True
    except Exception as e:
        logger.error(f"模板缓存初始化失败: {e}")
        return False


async def get_template_from_cache() -> Optional[Dict[str, Any]]:
    """
    从Redis缓存中获取模板数据
    
    Returns:
        Optional[Dict[str, Any]]: 模板数据，如果缓存不存在或过期则返回None
    """
    try:
        redis_client = get_redis_client()
        cached_data = await redis_client.get(TEMPLATE_CACHE_KEY)
        if cached_data:
            logger.info("从缓存中获取模板数据成功")
            return json.loads(cached_data)
        return None
    except Exception as e:
        logger.error(f"从缓存获取模板数据失败: {e}")
        return None


async def refresh_template_cache() -> bool:
    """
    刷新模板缓存
    
    Returns:
        bool: 刷新是否成功
    """
    return await initialize_template_cache()


async def get_templates_by_category(doc_type: str, category: str) -> List[Dict[str, Any]]:
    """
    根据文档类型和分类获取模板列表
    
    Args:
        doc_type (str): 文档类型 (claim/defense/application)
        category (str): 分类 (civil/criminal/administrative)
        
    Returns:
        List[Dict[str, Any]]: 模板列表
    """
    template_data = await get_template_from_cache()
    if template_data is None:
        # 如果缓存不可用，回退到直接使用内存中的数据
        template_data = TEMPLATE_DATABASE
        
    return template_data.get(doc_type, {}).get(category, [])


async def find_template_path_by_cause(doc_type_key: str, case_cause: str) -> Optional[str]:
    """
    根据文档类型和案由查找模板路径
    
    Args:
        doc_type_key (str): 文档类型键 (claim/defense/application)
        case_cause (str): 案由名称
        
    Returns:
        Optional[str]: 模板路径，未找到返回None
    """
    template_data = await get_template_from_cache()
    if template_data is None:
        # 如果缓存不可用，回退到直接使用内存中的数据
        template_data = TEMPLATE_DATABASE
    
    # 在模板数据中进行全面搜索
    if doc_type_key in template_data:
        for category_data in template_data[doc_type_key].values():
            for template in category_data:
                if template.get("name") == case_cause:
                    return template["path"]
    
    return None