# backend/app/api/chat.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from .. import database
from ..services.rag_service import RAGService
from ..services.ai_service import stream_ai_chat
from ..schemas.document_schemas import ChatMessage # 复用现有的ChatMessage

router = APIRouter(prefix="/api/chat", tags=["Chat"])

class RAGQueryRequest(BaseModel):
    history: List[ChatMessage]
    case_cause: Optional[str] = None # 案由，用于选择知识库

@router.post("/rag-stream")
async def rag_chat_stream(
    request: RAGQueryRequest,
    db: AsyncSession = Depends(database.get_db)
):
    """
    处理RAG聊天请求，根据案由从知识库检索上下文，并流式返回答案。
    """
    if not request.history:
        raise HTTPException(status_code=400, detail="聊天记录为空")

    user_query_message = request.history[-1]
    if user_query_message.role != 'user':
        raise HTTPException(status_code=400, detail="最新的消息不是用户消息，请检查输入")

    user_query = user_query_message.content
    
    # 1. 如果提供了案由，则执行RAG检索
    context_str = ""
    if request.case_cause:
        try:
            rag_service = RAGService(db)
            retrieved_contexts = await rag_service.retrieve_and_rerank(request.case_cause, user_query)
            if retrieved_contexts:
                context_str = "\n\n".join(retrieved_contexts)
        except Exception as e:
            print(f"RAG retrieval failed for case cause '{request.case_cause}': {e}")
            # 即使RAG失败，我们仍然可以继续，只是没有上下文
    
    # 2. 构建新的 Prompt
    system_prompt_content = "你是一名专业的法律AI助理。请根据下面提供的[参考资料]来精准、专业地回答用户的问题。如果[参考资料]中没有相关信息，请根据你自身的法律知识进行回答。回答应清晰、有条理。回复中请不要提及“根据参考资料” “根据数据库” “根据您提供的资料”等知识来源说明。"
    
    if context_str:
        final_user_query = f"""
            [参考资料]:
            ---
            {context_str}
            ---

            [用户问题]:
            {user_query}
            """
    else:
        final_user_query = user_query

    # 3. 准备发送给LLM的消息历史
    # 我们将 system_prompt 和增强后的 user_query 组合成新的历史记录
    # 这里的 history_for_api 不包含之前的对话，以确保每次都基于最新的RAG结果
    history_for_api = [
        ChatMessage(role="system", content=system_prompt_content),
        # 保持原始的用户问题历史，让模型理解对话上下文
        *request.history[:-1],
        ChatMessage(role="user", content=final_user_query),
    ]

    # 4. 调用流式AI聊天服务
    return StreamingResponse(
        stream_ai_chat(history=history_for_api, db=db),
        media_type="text/event-stream"
    )