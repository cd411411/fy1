# app/schemas/rag_schemas.py (新文件)

from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional, Literal, Dict, Any

# --- RAG Models ---

class RAGModelData(BaseModel):
    id: int
    name: str
    api_endpoint: str
    model_type: Literal["embedding", "rerank"]
    is_active: bool
    api_key: Optional[str] = None
    output_dim: Optional[int] = None
    similarity_top_k: Optional[int] = None
    rerank_top_k: Optional[int] = None

    class Config:
        from_attributes = True

class RAGModelCreate(BaseModel):
    name: str
    api_endpoint: str
    model_type: Literal["embedding", "rerank"]
    api_key: Optional[str] = None
    output_dim: Optional[int] = None
    similarity_top_k: Optional[int] = None
    rerank_top_k: Optional[int] = None


# --- Vector Stores ---

class VectorStoreData(BaseModel):
    id: int
    case_cause: str
    description: Optional[str] = None
    # 移除 top_k 和 enable_rerank

    class Config:
        from_attributes = True

class VectorStoreCreate(BaseModel):
    case_cause: str

class VectorStoreConfigUpdate(BaseModel):
    top_k: Optional[int] = None
    enable_rerank: Optional[bool] = None

# --- Document Groups ---

class DocumentGroupData(BaseModel):
    id: int
    name: str
    source_filenames: List[str]
    embedding_model_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Document Chunks ---

class DocumentChunkData(BaseModel):
    id: int
    store_id: int
    source_document_name: str
    content_type: str
    content: Dict[str, Any]
    
    class Config:
        from_attributes = True