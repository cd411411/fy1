# app/services/file_service.py

import io
import time
import fitz  # PyMuPDF
import pandas as pd
from pymupdf4llm import to_markdown
from fastapi import UploadFile
from typing import Dict, Any, List, Union
import tempfile
import uuid
import os
import gc
import aiofiles

# 定义统一的返回类型
ExtractionResult = Union[str, List[bytes], List[Dict[str, str]]]

# --- 核心内容提取函数 ---
async def extract_content_from_upload(file: UploadFile) -> ExtractionResult:
    """
    从上传的文件中智能提取内容 (已支持Excel, PDF扫描件, Word, Txt, 图片)。
    """
    content_type = file.content_type
    print(f"Extracting content from '{file.filename}' with content type '{content_type}'")
    
    # 必须先读取字节流，因为 UploadFile 可能是一次性的
    file_bytes = await file.read()
    # 将文件指针重置，以便后续操作（如保存临时文件）可以再次读取
    await file.seek(0) 

    # --- Excel文件处理 ---
    if content_type in [
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]:
        try:
            df = pd.read_excel(io.BytesIO(file_bytes))
            if "question" not in df.columns or "answer" not in df.columns:
                raise ValueError("Excel文件必须包含 'question' 和 'answer' 两列表头。")
            df.dropna(subset=['question', 'answer'], inplace=True)
            qa_list: List[Dict[str, str]] = [
                {"question": str(row["question"]), "answer": str(row["answer"])}
                for _, row in df.iterrows()
            ]
            return qa_list
        except Exception as e:
            raise ValueError(f"处理Excel文件失败: {e}")

    # --- 纯文本/图片文件直接在内存中处理 ---
    if content_type and content_type.startswith("text/"):
        return file_bytes.decode('utf-8')

    if content_type and content_type.startswith("image/"):
        return [file_bytes]

    # --- 复杂文件（PDF, DOCX）创建临时文件进行处理 ---
    temp_file_path = ""
    try:
        # 使用我们已有的辅助函数来创建临时文件
        temp_file_path = await save_upload_file_to_temp(file)
        
        if content_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"]:
            with fitz.open(temp_file_path) as doc:
                text = "".join(page.get_text() for page in doc) # type: ignore
            return text

        elif content_type == "application/pdf":
            # 1. 尝试快速提取纯文本来判断PDF类型
            text_from_pdf = ""
            with fitz.open(temp_file_path) as doc:
                text_from_pdf = "".join(page.get_text() for page in doc) # type: ignore
            
            # 2. 根据文本量决定策略
            if len(text_from_pdf.strip()) > 100: # 阈值可以调整
                 print(f"PDF '{file.filename}' identified as text-based. Using markdown conversion.")
                 # 对于文本型PDF，pymupdf4llm 的 markdown 转换能更好地保留格式
                 return to_markdown(temp_file_path)
            else:
                print(f"PDF '{file.filename}' identified as scanned document. Extracting images.")
                # 对于扫描件，提取图片
                return _extract_images_from_pdf_bytes(file_bytes)
            
        else:
            raise ValueError(f"Unsupported complex file type: {content_type}")
            
    except Exception as e:
        print(f"Error during content extraction for file '{file.filename}': {e}")
        raise ValueError(f"无法处理文件 '{file.filename}'。")
    finally:
        # 确保临时文件在使用后被删除
        safe_delete_temp_file(temp_file_path)

def _extract_images_from_pdf_bytes(pdf_bytes: bytes) -> List[bytes]:
    """
    从PDF的字节流中提取所有页面的高质量图片。
    """
    images = []
    try:
        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
            for page in doc:
                pix = page.get_pixmap(dpi=200) # type: ignore
                img_bytes = pix.tobytes("png") # type: ignore
                images.append(img_bytes)
    except Exception as e:
        print(f"Failed to extract images from PDF bytes: {e}")
    return images

# --- 辅助函数，LangChain 流程会用到 ---
async def save_upload_file_to_temp(file: UploadFile) -> str:
    """
    将上传的文件保存到一个临时文件中，并返回其路径。
    这个临时文件需要由调用者在使用后手动删除。
    """
    temp_dir = tempfile.gettempdir()
    temp_file_path = os.path.join(temp_dir, f"{uuid.uuid4()}-{file.filename or 'tempfile'}")

    async with aiofiles.open(temp_file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
        # 确保文件指针回到开头，以便其他函数可以再次读取
        await file.seek(0)

    return temp_file_path

def safe_delete_temp_file(file_path: str):
    """
    安全地删除一个临时文件。
    """
    if not file_path: return
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Error deleting temporary file {file_path}: {e}")