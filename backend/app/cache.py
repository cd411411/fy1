# app/cache.py
"""
缓存模块，提供Redis连接池和客户端获取功能。

该模块使用Redis作为缓存后端，通过连接池管理连接以提高性能和资源利用率。
"""
import redis.asyncio as redis
from typing import Dict, Any, Optional
from .config.config import settings


# 创建一个全局的、可复用的Redis连接池
# ConnectionPool参数说明:
#   host: Redis服务器主机名或IP地址，从配置中获取
#   port: Redis服务器端口号，从配置中获取
#   db: 数据库编号，0表示使用第一个数据库
#   decode_responses: 是否自动解码响应，True表示将字节数据自动解码为字符串
redis_pool = redis.ConnectionPool(
    host=settings.REDIS_HOST, 
    port=settings.REDIS_PORT, 
    db=0, 
    decode_responses=True
)


def get_redis_client() -> redis.Redis:
    """
    获取一个Redis客户端实例
    
    通过复用全局连接池创建Redis客户端，避免重复建立和断开连接的开销。
    客户端支持异步操作，适用于FastAPI异步环境。
    
    Returns:
        redis.Redis: Redis客户端实例
    """
    return redis.Redis(connection_pool=redis_pool)


async def get_redis_pool_stats() -> Dict[str, Any]:
    """
    获取Redis连接池的统计信息
    
    Returns:
        Dict[str, Any]: 包含连接池统计信息的字典
            - max_connections: 最大连接数
            - connection_kwargs: 连接参数
    """
    return {
        "max_connections": redis_pool.max_connections,
        "connection_kwargs": redis_pool.connection_kwargs
    }


async def check_redis_health() -> bool:
    """
    检查Redis服务的健康状态
    
    Returns:
        bool: Redis服务是否健康可用
    """
    try:
        client = get_redis_client()
        await client.ping()
        return True
    except Exception:
        return False


async def get_redis_info() -> Optional[Dict[str, Any]]:
    """
    获取Redis服务器信息
    
    Returns:
        Optional[Dict[str, Any]]: Redis服务器信息字典，如果无法连接则返回None
    """
    try:
        client = get_redis_client()
        info = await client.info()
        return info
    except Exception:
        return None


def get_redis_client_with_db(db: int) -> redis.Redis:
    """
    获取指定数据库的Redis客户端实例
    
    Args:
        db (int): 数据库编号
        
    Returns:
        redis.Redis: 指定数据库的Redis客户端实例
    """
    return redis.Redis(
        connection_pool=redis.ConnectionPool(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=db,
            decode_responses=True
        )
    )