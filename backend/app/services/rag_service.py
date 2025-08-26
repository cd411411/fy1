# app/services/rag_service.py

import io
import mimetypes
from typing import List, Dict, Any, Literal, Optional, Tuple
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
import orjson as json
import os
import uuid
import asyncio
from pathlib import Path
import pandas as pd  # 导入 pandas

# LangChain and custom components
from langchain_community.document_loaders import Docx2txtLoader, TextLoader, UnstructuredExcelLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema import Document

# Project-specific services and modules
# (修复) 确保正确导入文件服务中的函数
from app.services.file_service import save_upload_file_to_temp, safe_delete_temp_file
from .langchain_loaders import SmartPDFLoader  # 导入我们自己的智能加载器

from .. import database
from ..config.config import settings
from . import ai_service
from ..rag.strategies import QdrantVectorStore, VectorStoreStrategy, ChromaVectorStore

# 定义持久化存储路径
PERSISTENT_STORAGE_PATH = Path("persistent_storage/rag_files")
PERSISTENT_STORAGE_PATH.mkdir(parents=True, exist_ok=True)


# --- RAG服务工厂函数 (不变) ---
_vector_store_instance = None


def get_vector_store_strategy() -> VectorStoreStrategy:
    provider = settings.VECTOR_STORE_PROVIDER

    if provider == "chroma":
        # 每次都创建一个新的实例
        return ChromaVectorStore(path=settings.CHROMA_DB_PATH)
    elif provider == "qdrant":
        # 每次都创建一个新的实例
        return QdrantVectorStore(
            host=settings.QDRANT_HOST, port=settings.QDRANT_PORT
        )
    else:
        raise ValueError(f"Unknown or unsupported vector store provider: {provider}")


# --- 核心RAG服务类 ---
class RAGService:
    def __init__(self, db: AsyncSession):
        """初始化RAG服务实例。"""
        self.db = db
        self.vector_store = get_vector_store_strategy()

    async def _get_model_from_db(self, model_type: Literal["embedding", "rerank"]):
        """从数据库获取指定类型的活动模型配置。"""
        model = await database.get_active_rag_model(self.db, model_type)
        if not model:
            raise ValueError(f"No active '{model_type}' model configured.")
        return model

    async def get_embedding_from_api(self, texts: List[str], batch_size: int = 16) -> List[List[float]]:
        """调用外部API获取文本嵌入向量。"""
        if not texts:
            return []
        model = await self._get_model_from_db('embedding')
        headers = {
            "Authorization": f"Bearer {model.api_key}"} if model.api_key else {}
        all_embeddings: List[List[float]] = []
        async with httpx.AsyncClient(timeout=120.0) as client:
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i:i + batch_size]
                print(
                    f"Processing embedding batch {i//batch_size + 1}, size: {len(batch_texts)}")
                payload = {"input": batch_texts, "model": model.name}
                try:
                    response = await client.post(model.api_endpoint, json=payload, headers=headers)
                    response.raise_for_status()
                    data = response.json()
                    embeddings_data = data.get("data", [])
                    if embeddings_data and isinstance(embeddings_data[0], dict) and "embedding" in embeddings_data[0]:
                        batch_embeddings = [item["embedding"]
                                            for item in embeddings_data]
                        all_embeddings.extend(batch_embeddings)
                    elif embeddings_data and isinstance(embeddings_data[0], list):
                        all_embeddings.extend(embeddings_data)
                    else:
                        raise ValueError(
                            f"Unrecognized embedding API response format for batch: {data}")
                except httpx.HTTPStatusError as e:
                    print(
                        f"HTTP error during embedding batch: {e.response.status_code} - {e.response.text}")
                    raise e
        return all_embeddings

    async def rerank_with_api(self, query: str, chunks: List[str]) -> List[int]:
        """调用外部API对文本块进行重排。"""
        model = await self._get_model_from_db('rerank')
        headers = {
            "Authorization": f"Bearer {model.api_key}"} if model.api_key else {}
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(model.api_endpoint, json={"query": query, "texts": chunks, "model": model.name}, headers=headers)
            response.raise_for_status()
            results = response.json().get("results", [])
            return [result["index"] for result in results]

    async def _save_uploaded_file(self, filename: str, content: bytes, group_id: int) -> Path:
        """将内存中的文件内容保存到持久化存储。"""
        import aiofiles
        group_storage_path = PERSISTENT_STORAGE_PATH / str(group_id)
        group_storage_path.mkdir(exist_ok=True)
        file_path = group_storage_path / \
            (filename or f"untitled_{uuid.uuid4()}")
        async with aiofiles.open(file_path, "wb") as buffer:
            await buffer.write(content)
        return file_path

    async def _load_and_split_documents_with_langchain(
        self, file_path: str, file_name: str,
        chunk_size: int, overlap: int
    ) -> List[Document]:
        """使用 LangChain 根据文件类型加载并分割文档，支持智能PDF处理。"""
        ext = Path(file_name).suffix.lower()
        loader = None

        if ext == ".pdf":
            loader = SmartPDFLoader(file_path)
        elif ext == ".docx":
            loader = Docx2txtLoader(file_path)
        elif ext in [".txt", ".md"]:
            loader = TextLoader(file_path, encoding='utf-8')
        elif ext in [".xls", ".xlsx"]:
            loader = UnstructuredExcelLoader(file_path, mode="elements")
        else:
            print(
                f"No suitable LangChain loader for extension '{ext}'. Skipping.")
            return []

        # 运行同步的 load 方法在线程池中
        docs = await asyncio.to_thread(loader.load)
        if not docs:
            print(f"Loader for '{file_name}' returned no documents.")
            return []

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=overlap,
            length_function=len,
        )
        return text_splitter.split_documents(docs)

    async def _process_file_content(
        self, db_session: AsyncSession, file_path: str, filename: str, strategy: str, chunk_size: int, overlap: int
    ) -> Tuple[List[Dict[str, Any]], List[str]]:
        """
        (公共辅助函数)
        处理单个文件路径，返回待存储内容和待向量化文本。
        现在接收 db_session 以便 generate_qa_pairs_with_ai 使用。
        """
        contents: List[Dict[str, Any]] = []
        texts_to_embed: List[str] = []

        if strategy == "excel_qa":
            try:
                # (修复) 确保 pd.read_excel 接收的是文件路径
                df = pd.read_excel(file_path)
                if "question" in df.columns and "answer" in df.columns:
                    df.dropna(subset=['question', 'answer'], inplace=True)
                    qa_pairs = df[["question", "answer"]].to_dict('records')
                    contents = [{"question": str(qa["question"]), "answer": str(
                        qa["answer"])} for qa in qa_pairs]
                    texts_to_embed = [qa["question"] for qa in contents]
                else:
                    print(
                        f"Warning: Excel file '{filename}' for excel_qa strategy is missing 'question' or 'answer' columns.")
            except Exception as e:
                print(
                    f"Error processing Excel file '{filename}' for QA import: {e}")
        else:
            split_docs = await self._load_and_split_documents_with_langchain(
                file_path, filename, chunk_size, overlap
            )

            if strategy == "chunk":
                texts_to_embed = [doc.page_content for doc in split_docs]
                contents = [{"text": content} for content in texts_to_embed]
            elif strategy == "qa":
                full_text = "\n\n".join(
                    [doc.page_content for doc in split_docs])
                # (修复) 在传递给 generate_qa_pairs_with_ai 之前进行截断
                MAX_TEXT_FOR_QA_GENERATION = 4000  # 限制QA生成时的文本长度
                truncated_text = full_text[:MAX_TEXT_FOR_QA_GENERATION]

                if truncated_text.strip():
                    # (修复) 传入 db_session
                    contents = await generate_qa_pairs_with_ai(db_session, truncated_text)
                    texts_to_embed = [qa["question"]
                                      for qa in contents if "question" in qa]

        return contents, texts_to_embed

    async def process_and_embed_documents(
        self, case_cause: str, group_name: str,
        files_data: List[Dict[str, Any]],
        strategy: Literal["chunk", "qa", "excel_qa"],
        chunk_size: int, overlap: int
    ):
        """(已重构) 通过策略接口写入数据，实现后端解耦"""
        filenames = [f["filename"] or "untitled" for f in files_data]
        active_embedding_model = await self._get_model_from_db('embedding')

        # database.create_document_group 依然是必要的，因为它管理元数据
        group = await database.create_document_group(
            self.db, case_cause, group_name or ", ".join(filenames),
            filenames, active_embedding_model.name
        )

        for file_data in files_data:
            temp_file_path_for_processing = ""
            try:
                # 先保存到持久化存储
                await self._save_uploaded_file(file_data["filename"], file_data["content"], group.id)

                # 为 LangChain 加载器创建临时文件
                pseudo_file_for_temp = UploadFile(
                    filename=file_data["filename"], file=io.BytesIO(file_data["content"]))
                temp_file_path_for_processing = await save_upload_file_to_temp(pseudo_file_for_temp)

                # (修复) 传入 db_session
                contents, texts_to_embed = await self._process_file_content(
                    self.db, temp_file_path_for_processing, file_data[
                        "filename"], strategy, chunk_size, overlap
                )

                if not texts_to_embed:
                    print(
                        f"No content to embed for file {file_data['filename']}. Skipping.")
                    continue

                embeddings = await self.get_embedding_from_api(texts_to_embed)
                await self.vector_store.add_documents(
                    case_cause=case_cause,
                    group_id=group.id,
                    source_filename=file_data['filename'] or "untitled",
                    contents=contents,
                    embeddings=embeddings,
                    strategy=strategy
                )
                print(
                    f"Successfully processed and embedded file via {settings.VECTOR_STORE_PROVIDER}: {file_data['filename']}")

            except Exception as e:
                print(
                    f"Failed to process file {file_data['filename']}. Error: {e}")
            finally:
                # 确保删除的是当前循环创建的临时文件
                safe_delete_temp_file(temp_file_path_for_processing)

    async def rebuild_document_group(
        self, group_id: int, strategy: str, chunk_size: int, overlap: int
    ):
        """一键重构的核心逻辑"""
        print(f"Starting rebuild for document group ID: {group_id}")
        group = await database.get_document_group_by_id(self.db, group_id)
        if not group:
            print(f"Rebuild failed: Document group with ID {group_id} not found.")
            return

        case_cause = group.store.case_cause
        
        await self.vector_store.delete_documents_by_group(case_cause, group_id)
        print(f"Deleted old chunks for group {group_id} from {settings.VECTOR_STORE_PROVIDER}")

        group_storage_path = PERSISTENT_STORAGE_PATH / str(group_id)
        if not group_storage_path.is_dir():
            print(f"Rebuild failed: Storage path for group {group_id} not found.")
            return

        for filename in group.source_filenames:
            file_path = str(group_storage_path / filename)
            if not os.path.exists(file_path):
                print(f"Warning: Original file '{filename}' not found in storage. Skipping.")
                continue
            
            try:
                contents, texts_to_embed = await self._process_file_content(
                    self.db, file_path, filename, strategy, chunk_size, overlap
                )

                if not texts_to_embed: continue
                
                embeddings = await self.get_embedding_from_api(texts_to_embed)
                
                # (核心修改) 写入也通过策略进行，不再调用 database.add_chunks_to_group
                await self.vector_store.add_documents(
                    case_cause=case_cause,
                    group_id=group.id,
                    source_filename=filename,
                    contents=contents,
                    embeddings=embeddings,
                    strategy=strategy
                )
                print(f"Successfully rebuilt and stored chunks for {filename}.")

            except Exception as e:
                print(f"Failed to re-process file {filename} during rebuild. Error: {e}")
        
        active_embedding_model = await self._get_model_from_db('embedding')
        await database.update_document_group_metadata(self.db, group_id, {"embedding_model_name": active_embedding_model.name})
        
        print(f"Finished rebuild for document group ID: {group_id}")

    async def retrieve_and_rerank(self, case_cause: str, query: str) -> List[str]:
        """检索并重排相关文档"""
        active_embedding_model = await database.get_active_rag_model(self.db, 'embedding')
        if not active_embedding_model:
            raise ValueError("没有找到激活的 Embedding 模型，无法执行检索。")

        active_rerank_model = await database.get_active_rag_model(self.db, 'rerank')

        enable_rerank = active_rerank_model is not None
        retrieval_k = active_embedding_model.similarity_top_k or 20
        final_k = active_rerank_model.rerank_top_k or 5 if enable_rerank else retrieval_k

        if enable_rerank and retrieval_k < final_k:
            retrieval_k = final_k * 4

        query_embedding = (await self.get_embedding_from_api([query]))[0]

        retrieved_docs = await self.vector_store.similarity_search(
            case_cause, query_embedding, retrieval_k
        )

        if enable_rerank and retrieved_docs and active_rerank_model:
            try:
                passages_to_rerank = [doc["content"]
                                      for doc in retrieved_docs if doc and "content" in doc]
                if passages_to_rerank:
                    reranked_indices = await self.rerank_with_api(query, passages_to_rerank)
                    retrieved_docs = [retrieved_docs[i]
                                      for i in reranked_indices]
            except Exception as e:
                print(
                    f"Reranking failed, falling back to vector search results. Error: {e}")

        final_docs = retrieved_docs[:final_k]

        final_context = []
        for i, doc in enumerate(final_docs):
            if not doc:
                continue

            metadata = doc.get("metadata", {}) or {}
            source = metadata.get("source", "未知来源")
            content_type = metadata.get("content_type", "chunk")

            content_data = doc.get("content")
            context_text = ""

            if content_type == 'qa_pair':
                if isinstance(content_data, str):
                    try:
                        content_data = json.loads(content_data)
                    except:
                        content_data = {}

                if isinstance(content_data, dict):
                    question = content_data.get('question', '')
                    answer = content_data.get('answer', '')
                    context_text = f"问：{question}\n答：{answer}"
            else:
                context_text = str(content_data) if content_data else ""

            final_context.append(
                f"--- 参考资料 {i+1} (来源: {source}) ---\n{context_text}")

        return final_context

    async def delete_document_group(self, group_id: int) -> bool:
        """(新增) 完整地删除一个文档组及其所有相关数据"""
        # 1. 从数据库获取 group 元数据，我们需要 case_cause
        group = await database.get_document_group_by_id(self.db, group_id)
        if not group:
            print(
                f"Deletion failed: Document group with ID {group_id} not found.")
            return False

        case_cause = group.store.case_cause

        # 2. 调用向量存储策略删除向量数据
        await self.vector_store.delete_documents_by_group(case_cause, group_id)

        # 3. 删除持久化存储中的原始文件
        group_storage_path = PERSISTENT_STORAGE_PATH / str(group_id)
        if group_storage_path.is_dir():
            import shutil
            shutil.rmtree(group_storage_path)
            print(f"Deleted persistent storage for group {group_id}")

        # 4. 从 PostgreSQL 删除元数据记录
        # (重要) 这一步必须在最后，因为它会删除 group 对象
        success = await database.delete_document_group(self.db, group_id)

        return success


async def generate_qa_pairs_with_ai(db: AsyncSession, text: str, num_questions: int = 5) -> List[Dict[str, str]]:
    """使用AI将长文本生成高质量的问答(Q&A)对。"""
    print(f"Generating Q&A pairs for text of length {len(text)}...")
    prompt = f"""
    你是一名信息提取和知识库构建专家。你的任务是将以下提供的"原始文本"转换为一系列精确的、一问一答形式的JSON对象。

    **核心要求:**
    1.  **原子性:** 每个问题都应该只关注一个独立、具体的事实或知识点。
    2.  **上下文独立:** 每个问题都应该是完整的，即使脱离原文也能被理解。避免使用"它"、"上述"等代词。
    3.  **答案来自原文:** 答案必须是基于"原始文本"内容的、简洁、准确的陈述。
    4.  **数量:** 请尽力生成大约 {num_questions} 个高质量的问答对。

    **原始文本:**
    ---
    {text} 
    ---

    **输出格式 (必须严格遵守JSON格式，返回一个包含对象的列表):**
    {{
      "qa_pairs": [
        {{
          "question": "【这里是第一个完整、具体的问题】",
          "answer": "【这里是对应的、简洁、准确的答案】"
        }}
      ]
    }}
    """
    try:
        ai_response = await ai_service.get_ai_json_response(prompt, db, "general", "rag_qa_generation")
        qa_pairs = ai_response.get("qa_pairs", [])

        if not isinstance(qa_pairs, list):
            print(f"WARNING: AI returned non-list for qa_pairs: {qa_pairs}")
            return []

        print(f"Successfully generated {len(qa_pairs)} Q&A pairs.")
        return qa_pairs

    except Exception as e:
        print(f"Failed to generate Q&A pairs: {e}")
        return []
