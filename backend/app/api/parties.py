# backend/app/api/parties.py
from fastapi import APIRouter, File, UploadFile, HTTPException, Form, Depends
from typing import Dict, Any
from .. import database
from sqlalchemy.ext.asyncio import AsyncSession
from ..services.ai_service import extract_info_from_image

router = APIRouter(prefix="/api/parties", tags=["Parties"])

@router.post("/ocr-fill")
async def ocr_and_fill(
    # 使用 Form 来接收 party_type，因为它和文件一起在 multipart/form-data 中
    party_type: str = Form(...), # e.g., "natural_person_id_card", "legal_entity_license"
    image: UploadFile = File(...),
    db: AsyncSession = Depends(database.get_db)
):
    """
    接收证件图片，进行OCR和信息提取，返回结构化数据。
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file is not an image.")

    try:
        # 读取图片内容
        image_bytes = await image.read()
        # print("Image bytes:", image_bytes)
        
        # 调用专门的AI服务进行处理
        # 这个服务内部会调用多模态模型或OCR+LLM
        extracted_data = await extract_info_from_image(image_bytes, party_type,db)
        
        if not extracted_data:
            raise HTTPException(status_code=500, detail="AI failed to extract information from the image.")
            
        return extracted_data
        
    except Exception as e:
        print(f"Error during OCR processing: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred during image processing: {str(e)}")