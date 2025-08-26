# app/api/rag.py

from multiprocessing.pool import AsyncResult
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional, Literal

from celery.result import AsyncResult
from ..celery_worker import celery_app
from ..tasks import process_documents_task, rebuild_document_group_task

from .. import database
from .dependencies import get_current_user
from ..services.rag_service import RAGService
from ..schemas.rag_schemas import (
    DocumentChunkData, RAGModelData, RAGModelCreate, VectorStoreCreate, 
    VectorStoreData, 
    DocumentGroupData
)

# --- Router Definition ---
router = APIRouter(
    prefix="/api/admin", # (注意) Prefix统一为/api/admin
    tags=["Admin RAG Management"], 
    dependencies=[Depends(get_current_user)]
)

class PaginatedChunksResponse(BaseModel):
    total_count: int
    chunks: List[DocumentChunkData]

class UploadConfig(BaseModel):
    strategy: Literal["chunk", "qa", "excel_qa"]
    group_name: Optional[str] = None
    chunk_size: int = 512
    overlap: int = 50

class RebuildConfig(BaseModel):
    strategy: Literal["chunk", "qa", "excel_qa"]
    chunk_size: int = 512
    overlap: int = 50

# --- RAG Models API Endpoints ---

@router.get("/rag-models", response_model=List[RAGModelData])
async def get_rag_models(db: AsyncSession = Depends(database.get_db)):
    """获取所有RAG模型（Embedding和Rerank）"""
    return await database.get_all_rag_models(db)

@router.post("/rag-models", response_model=RAGModelData)
async def create_rag_model(model_data: RAGModelCreate, db: AsyncSession = Depends(database.get_db)):
    """添加一个新的RAG模型"""
    return await database.add_rag_model(db, model_data.model_dump())

@router.patch("/rag-models/{model_id}/set-active")
async def set_active_rag_model_api(model_id: int, db: AsyncSession = Depends(database.get_db)):
    """激活一个RAG模型，会自动取消同类型的其他模型的激活状态"""
    success = await database.set_active_rag_model(db, model_id)
    if not success:
        raise HTTPException(status_code=404, detail="RAG model not found")
    return {"message": "RAG model activated successfully"}

@router.patch("/rag-models/{model_id}/deactivate")
async def deactivate_rag_model_api(model_id: int, db: AsyncSession = Depends(database.get_db)):
    """取消一个RAG模型的激活状态"""
    success = await database.deactivate_rag_model(db, model_id)
    if not success:
        raise HTTPException(status_code=404, detail="RAG model not found")
    return {"message": "RAG model deactivated successfully"}

@router.delete("/rag-models/{model_id}")
async def delete_rag_model_api(model_id: int, db: AsyncSession = Depends(database.get_db)):
    """删除一个RAG模型"""
    success = await database.delete_rag_model(db, model_id)
    if not success:
        raise HTTPException(status_code=404, detail="RAG model not found")
    return {"message": "RAG model deleted successfully"}

@router.put("/rag-models/{model_id}", response_model=RAGModelData)
async def update_rag_model_api(model_id: int, model_data: RAGModelCreate, db: AsyncSession = Depends(database.get_db)):
    """更新一个RAG模型的信息"""
    updated_model = await database.update_rag_model(db, model_id, model_data.model_dump(exclude_unset=True))
    if not updated_model:
        raise HTTPException(status_code=404, detail="RAG model not found")
    return updated_model

# --- Vector Store & Chunks API Endpoints ---

@router.get("/vector-stores", response_model=List[VectorStoreData])
async def get_vector_stores(db: AsyncSession = Depends(database.get_db)):
    """获取所有案由的向量库及其配置"""
    return await database.get_all_vector_stores(db)

# @router.put("/vector-stores/{store_id}")
# async def update_vector_store_config_api(
#     store_id: int, 
#     config_data: VectorStoreConfigUpdate, 
#     db: AsyncSession = Depends(database.get_db)
# ):
#     """更新向量库的配置（top_k, enable_rerank）"""
#     updated = await database.update_vector_store_config(
#         db, store_id, config_data.model_dump(exclude_unset=True)
#     )
#     if not updated:
#         raise HTTPException(status_code=404, detail="Vector store not found")
#     return updated


@router.get("/vector-stores/{store_id}/chunks", response_model=PaginatedChunksResponse)
async def get_chunks_api(
    store_id: int, 
    page: int = 1, 
    page_size: int = 10, 
    db: AsyncSession = Depends(database.get_db)
):
    """(已升级) 分页获取指定知识库的文本块，并返回总数"""
    chunks, total_count = await database.get_chunks_for_store(db, store_id, page, page_size)
    return {"total_count": total_count, "chunks": chunks}

@router.delete("/chunks/{chunk_id}")
async def delete_chunk_api(chunk_id: int, db: AsyncSession = Depends(database.get_db)):
    """删除一个文本块"""
    success = await database.delete_chunk_by_id(db, chunk_id)
    if not success:
        raise HTTPException(status_code=404, detail="Chunk not found")
    return {"message": "Chunk deleted successfully"}

@router.delete("/vector-stores/{store_id}")
async def delete_store_api(store_id: int, db: AsyncSession = Depends(database.get_db)):
    """删除一个完整的案由知识库"""
    success = await database.delete_vector_store(db, store_id)
    if not success:
        raise HTTPException(status_code=404, detail="Vector store not found")
    return {"message": "Vector store and all its content deleted successfully"}

@router.post("/vector-stores") # (新增) 创建案由库
async def create_vector_store_api(payload: VectorStoreCreate, db: AsyncSession = Depends(database.get_db)):
    try:
        return await database.create_vector_store(db, payload.case_cause)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

@router.get("/vector-stores/{store_id}/groups", response_model=List[DocumentGroupData])
async def get_document_groups_api(store_id: int, db: AsyncSession = Depends(database.get_db)):
    """获取指定知识库下的所有文档组"""
    return await database.get_document_groups_by_store_id(db, store_id)

@router.post("/vector-stores/{case_cause}/upload")
async def upload_and_process_documents_api(
    case_cause: str,
    files: List[UploadFile] = File(...),
    strategy: Literal["chunk", "qa", "excel_qa"] = Form(...),
    group_name: Optional[str] = Form(None),
    chunk_size: int = Form(512),
    overlap: int = Form(50)
):
    """接收文件，并将处理任务分派给 Celery"""
    
    final_group_name = group_name
    if not final_group_name or not final_group_name.strip():
        final_group_name = ", ".join([f.filename for f in files if f.filename]) or "未命名文档组"

    file_data_for_task = []
    for file in files:
        content = await file.read()
        file_data_for_task.append({
            "content": content, "filename": file.filename, "content_type": file.content_type
        })
    
    task = process_documents_task.delay(
        case_cause=case_cause, group_name=final_group_name, files_data=file_data_for_task,
        strategy=strategy, chunk_size=chunk_size, overlap=overlap
    )
    
    return {"message": "任务已提交后台处理。", "task_id": task.id}

@router.delete("/document-groups/{group_id}")
async def delete_document_group_api(group_id: int, db: AsyncSession = Depends(database.get_db)):
    """删除一个文档组及其所有文本块"""
    rag_service = RAGService(db)
    success = await rag_service.delete_document_group(group_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Document group not found")
    return {"message": "Document group and all its content deleted successfully"}

@router.get("/tasks/{task_id}/status")
async def get_task_status(task_id: str):
    """
    根据任务ID查询 Celery 任务的状态和结果。
    """
    task_result = AsyncResult(task_id, app=celery_app)
    
    response = {
        "task_id": task_id,
        "status": task_result.status,
        "result": task_result.result,
    }
    
    if task_result.status == 'FAILURE':
        # 如果任务失败，结果中会包含我们设置的 meta 信息
        response['result'] = task_result.info # info 属性通常包含异常信息
        
    return response

@router.post("/document-groups/{group_id}/rebuild")
async def rebuild_document_group_api(
    group_id: int,
    config: RebuildConfig,
):
    """将重构任务分派给 Celery"""
    task = rebuild_document_group_task.delay(
        group_id=group_id, strategy=config.strategy,
        chunk_size=config.chunk_size, overlap=config.overlap
    )
    return {"message": "重构任务已提交后台处理。", "task_id": task.id}

@router.delete("/vector-stores/delete-all-metadata", status_code=204)
async def delete_all_vector_store_metadata_api(db: AsyncSession = Depends(database.get_db)):
    """
    !!! 危险操作 !!!
    删除所有 vector_stores 和 document_groups 表中的元数据。
    用于在切换向量存储提供者后进行清理。
    """
    await database.truncate_rag_metadata(db)
    return
# 可以在这里继续添加其他管理API，例如：
# - POST /vector-stores/rebuild-all (触发一键重构)