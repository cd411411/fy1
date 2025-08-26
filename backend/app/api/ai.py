from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from ..schemas.document_schemas import AIQueryRequest # request模型已更新
from ..services import ai_service
from .. import database
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/ai", tags=["AI"])

@router.post("/chat-stream")
async def chat_stream(
    request: AIQueryRequest,
    db: AsyncSession = Depends(database.get_db)
):
    return StreamingResponse(
        ai_service.stream_ai_chat(
            history=request.history,
            db=db
        ), 
        media_type="text/event-stream"
    )