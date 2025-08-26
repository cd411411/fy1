# app/rag/strategies.py
"""
向量存储策略模块

该模块实现了多种向量存储后端的抽象和具体实现，包括:
- ChromaDB: 基于文件的向量数据库
- PGVector: 基于PostgreSQL的向量数据库
- Qdrant: 专业的向量搜索引擎

所有实现都遵循统一的VectorStoreStrategy接口，支持在不同后端之间切换
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
import chromadb
from ..config.config import settings
import uuid
import hashlib
from .. import database
import orjson as json
# --- For Qdrant
from qdrant_client import QdrantClient, models
from qdrant_client.http.models import Distance, VectorParams, PointStruct


# --- 辅助函数 ---
def _sanitize_collection_name(name: str) -> str:
    """
    将任意字符串转换为向量数据库兼容的集合名称。

    此函数解决了向量数据库对集合名称的限制问题，特别是对中文字符的支持:
    - 使用 MD5 哈希将中文字符转换为唯一的 ASCII 字符串
    - 添加前缀以提高可读性和识别度
    - 确保生成的名称符合各向量数据库的命名规范

    Args:
        name (str): 原始集合名称，可能包含中文或其他特殊字符

    Returns:
        str: 符合向量数据库命名规范的安全集合名称

    Example:
        >>> _sanitize_collection_name("劳动争议")
        'cc_9e107d9d372bb6826bd81d3542a419d6'
    """
    # 使用 MD5 哈希算法
    hasher = hashlib.md5()
    # 将字符串编码为 utf-8 以进行哈希
    hasher.update(name.encode("utf-8"))
    # 获取十六进制的哈希摘要
    hash_str = hasher.hexdigest()

    # 构造一个合法且唯一的名称，例如 "cc_9e107d9d372bb6826bd81d3542a419d6"
    # "cc" 代表 "case_cause"
    collection_name = f"cc_{hash_str}"

    # 确保名称长度在各向量数据库的限制内 (3-63 in older versions, 3-512 in newer)
    # MD5 哈希是32个字符，加上前缀 "cc_" 总共35个字符，完全在安全范围内。
    return collection_name


# --- 抽象基类 / 接口定义 ---


class VectorStoreStrategy(ABC):
    """
    向量存储策略抽象基类

    定义所有向量存储后端都必须实现的通用接口，确保不同实现之间的一致性
    """

    @abstractmethod
    async def add_documents(
        self, case_cause: str, group_id: int, source_filename: str,
        contents: List[Dict[str, Any]], embeddings: List[List[float]], strategy: str
    ) -> None:
        """
        向向量库中添加文档块

        Args:
            case_cause (str): 案由，用于确定存储的集合
            group_id (int): 文档组ID，用于标识文档来源
            source_filename (str): 源文件名
            contents (List[Dict[str, Any]]): 文档内容列表，每个元素为包含文档信息的字典
            embeddings (List[List[float]]): 对应内容的向量嵌入列表
            strategy (str): 分块策略名称
        """
        pass

    @abstractmethod
    async def similarity_search(
        self, case_cause: str, query_embedding: List[float], top_k: int
    ) -> List[Dict[str, Any]]:
        """
        在指定案由的向量库中执行相似度搜索

        Args:
            case_cause (str): 案由，用于确定搜索的集合
            query_embedding (List[float]): 查询向量
            top_k (int): 返回最相似的K个结果

        Returns:
            List[Dict[str, Any]]: 搜索结果列表，每个元素包含content和metadata字段
        """
        pass

    @abstractmethod
    async def delete_store(self, case_cause: str) -> None:
        """
        删除整个案由的向量库

        Args:
            case_cause (str): 需要删除的案由对应的向量库
        """
        pass

    @abstractmethod
    async def delete_documents_by_group(self, case_cause: str, group_id: int) -> None:
        pass


# --- ChromaDB (文件后端) 策略实现 ---


class ChromaVectorStore(VectorStoreStrategy):
    """
    ChromaDB向量存储实现

    使用单例模式确保全局只有一个ChromaDB客户端实例，基于文件系统存储向量数据
    适用于开发和小规模生产环境
    """

    def __init__(self, path: str = "./chroma_db"):
        """
        初始化ChromaDB客户端

        Args:
            path (str): ChromaDB数据存储路径，默认为"./chroma_db"
        """
        self.client = chromadb.PersistentClient(path=path)
        self._initialized = True
        print(f"ChromaDB client initialized at path: {path}")

    async def add_documents(
        self, case_cause: str, group_id: int, source_filename: str,
        contents: List[Dict[str, Any]], embeddings: List[List[float]], strategy: str
    ) -> None:
        """
        向ChromaDB中添加文档向量

        Args:
            case_cause (str): 案由，用于确定存储的集合
            group_id (int): 文档组ID
            source_filename (str): 源文件名
            contents (List[Dict[str, Any]]): 文档内容列表
            embeddings (List[List[float]]): 对应的向量嵌入
            strategy (str): 分块策略名称
        """
        # 使用转换后的名称
        collection_name = _sanitize_collection_name(case_cause)
        collection = self.client.get_or_create_collection(name=collection_name)

        if not embeddings: return

        ids = [str(uuid.uuid4()) for _ in contents]
        
        # (核心修改) 移除无法识别的类型注解
        metadatas = [
            {"source": source_filename, "group_id": group_id, "content_type": strategy}
            for _ in contents
        ]
        documents_str = [json.dumps(content).decode("utf-8") for content in contents]
        
        # 修复类型错误：将List[List[float]]转换为ChromaDB期望的格式
        collection.add(
            ids=ids,
            embeddings=[list(embedding) for embedding in embeddings],
            metadatas=metadatas,  # type: ignore
            documents=documents_str
        )
        print(f"Added {len(contents)} documents to Chroma collection: {collection_name} (for case cause: {case_cause})")

    async def similarity_search(
        self, case_cause: str, query_embedding: List[float], top_k: int
    ) -> List[Dict[str, Any]]:
        """
        在ChromaDB中执行相似度搜索

        Args:
            case_cause (str): 案由，用于确定搜索的集合
            query_embedding (List[float]): 查询向量
            top_k (int): 返回最相似的K个结果

        Returns:
            List[Dict[str, Any]]: 搜索结果列表，每个元素包含content和metadata字段
        """
        # 使用转换后的名称
        collection_name = _sanitize_collection_name(case_cause)
        try:
            collection = self.client.get_collection(name=collection_name)
        except ValueError:
            print(
                f"Chroma collection '{collection_name}' (for case cause: '{case_cause}') not found."
            )
            return []

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["metadatas", "documents"],
        )

        output = []
        if results and results["documents"] and results["metadatas"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            for doc_str, meta in zip(docs, metas):
                output.append({"content": doc_str, "metadata": meta})
        return output

    async def delete_store(self, case_cause: str) -> None:
        """
        删除指定案由的ChromaDB集合

        Args:
            case_cause (str): 需要删除的案由对应的向量库
        """
        # 使用转换后的名称
        collection_name = _sanitize_collection_name(case_cause)
        try:
            self.client.delete_collection(name=collection_name)
            print(
                f"Deleted Chroma collection: {collection_name} (for case cause: {case_cause})"
            )
        except ValueError:
            print(
                f"Attempted to delete non-existent Chroma collection: {collection_name}"
            )

    async def delete_documents_by_group(self, case_cause: str, group_id: int) -> None:
        """删除指定 group_id 的所有向量"""
        collection_name = _sanitize_collection_name(case_cause)
        try:
            collection = self.client.get_collection(name=collection_name)
            collection.delete(where={"group_id": group_id})
            print(
                f"Deleted documents from Chroma collection '{collection_name}' for group_id {group_id}")
        except ValueError:
            print(f"Collection '{collection_name}' not found for deletion.")


# Qdrant 策略实现
class QdrantVectorStore(VectorStoreStrategy):
    """
    Qdrant向量存储实现

    基于Qdrant向量搜索引擎的实现，适用于大规模向量搜索和高性能要求的生产环境
    使用单例模式确保全局只有一个Qdrant客户端实例
    """

    def __init__(self, host: str = "localhost", port: int = 6333):
        """
        初始化Qdrant客户端

        Args:
            host (str): Qdrant服务主机地址，默认为"localhost"
            port (int): Qdrant服务端口，默认为6333
        """
        self.client = QdrantClient(host=host, port=port, timeout=30)
        self._initialized = True
        print(f"Qdrant client initialized, connected to {host}:{port}")

    async def add_documents(
        self, case_cause: str, group_id: int, source_filename: str,
        contents: List[Dict[str, Any]], embeddings: List[List[float]], strategy: str
    ) -> None:
        """
        向Qdrant中添加文档向量

        Args:
            case_cause (str): 案由，用于确定存储的集合
            group_id (int): 文档组ID
            source_filename (str): 源文件名
            contents (List[Dict[str, Any]]): 文档内容列表
            embeddings (List[List[float]]): 对应的向量嵌入
            strategy (str): 分块策略名称
        """
        collection_name = _sanitize_collection_name(case_cause)
        if not embeddings: return
        vector_dim = len(embeddings[0])

        try:
            self.client.get_collection(collection_name=collection_name)
        except Exception:
            self.client.recreate_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=vector_dim, distance=Distance.COSINE),
            )

        points = [
            PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload={
                    "source": source_filename, "group_id": group_id, "content_type": strategy,
                    "content": json.dumps(content).decode("utf-8"),
                }
            ) for content, embedding in zip(contents, embeddings)
        ]
        self.client.upsert(collection_name=collection_name, points=points, wait=True)
        print(f"Upserted {len(points)} points to Qdrant collection: {collection_name}")

    async def similarity_search(
        self, case_cause: str, query_embedding: List[float], top_k: int
    ) -> List[Dict[str, Any]]:
        """
        在Qdrant中执行相似度搜索

        Args:
            case_cause (str): 案由，用于确定搜索的集合
            query_embedding (List[float]): 查询向量
            top_k (int): 返回最相似的K个结果

        Returns:
            List[Dict[str, Any]]: 搜索结果列表，每个元素包含content和metadata字段，
                                其中metadata还包含相似度分数score
        """
        collection_name = _sanitize_collection_name(case_cause)
        try:
            search_result = self.client.search(
                collection_name=collection_name,
                query_vector=query_embedding,
                limit=top_k,
                with_payload=True,  # 确保返回 payload
            )

            # 转换回我们的标准格式
            output = []
            for hit in search_result:
                payload = hit.payload or {}
                output.append({
                    "content": payload.get("content"),
                    "metadata": {
                        "source": payload.get("source"),
                        "group_id": payload.get("group_id"),
                        "content_type": payload.get("content_type"),
                        "score": hit.score,
                    },
                })
            return output
        except Exception as e:
            # 当 collection 不存在时，Qdrant 可能会抛出 UnexpectedResponse 异常
            print(f"Qdrant search failed for collection '{collection_name}'. It might not exist. Error: {e}")
            return []       

    async def delete_store(self, case_cause: str) -> None:
        """
        删除指定案由的Qdrant集合

        Args:
            case_cause (str): 需要删除的案由对应的向量库
        """
        collection_name = _sanitize_collection_name(case_cause)
        self.client.delete_collection(collection_name=collection_name)
        print(f"Deleted Qdrant collection: {collection_name}")

    async def delete_documents_by_group(self, case_cause: str, group_id: int) -> None:
        """(新增) 删除指定 group_id 的所有点"""
        collection_name = _sanitize_collection_name(case_cause)

        print(
            f"Deleting points from Qdrant collection '{collection_name}' for group_id {group_id}...")

        self.client.delete(
            collection_name=collection_name,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="group_id",
                            match=models.MatchValue(value=group_id)
                        )
                    ]
                )
            ),
            wait=True
        )
        print(f"Deletion successful. {case_cause}:{group_id}")
