# app/services/file_service.py

import io
import time
import fitz  # PyMuPDF
from pymupdf4llm import to_markdown
from fastapi import UploadFile
from typing import Dict, Any, List, Union
import tempfile
import uuid
import os
import gc

# 定义一个统一的返回类型
ExtractionResult = Union[str, List[bytes]]

async def extract_content_from_upload(file: UploadFile) -> ExtractionResult:
    """
    从上传的文件中智能提取内容。
    - 对DOCX, TXT, 和可提取文本的PDF，返回文本字符串。
    - 对扫描件PDF或图片，返回一个包含每页图片的bytes列表。
    """
    content_type = file.content_type
    print(f"Processing file '{file.filename}' with content type '{content_type}'")
    file_bytes = await file.read()
    
    # 创建一个临时文件来处理PDF
    temp_file_path = ""
    try:
        # 仅为PDF和DOCX创建临时文件
        if content_type == "application/pdf" or content_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"]:
            # 创建一个带唯一名字的临时文件
            with tempfile.NamedTemporaryFile(delete=False, suffix=f"-{uuid.uuid4()}-{file.filename}") as temp_file:
                temp_file.write(file_bytes)
                temp_file_path = temp_file.name
        
        if content_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"]:
            with fitz.open(temp_file_path) as doc:
                text = "".join(page.get_text() for page in doc) # type: ignore
            return text

        elif content_type and content_type.startswith("text/"):
            return file_bytes.decode('utf-8')

        elif content_type == "application/pdf":
            # 将文件路径传递给 to_markdown
            md_text = to_markdown(temp_file_path)
            
            if len(md_text.strip()) > 50:
                 return md_text
            else:
                print(f"PDF '{file.filename}' text is too short, treating as scanned document.")
                # _extract_images_from_pdf_bytes 仍然可以使用 bytes
                return _extract_images_from_pdf_bytes(file_bytes)

        elif content_type and content_type.startswith("image/"):
            return [file_bytes]
            
        else:
            raise ValueError(f"Unsupported file type: {content_type}")
            
    except Exception as e:
        print(f"Error extracting content from file '{file.filename}': {e}")
        raise ValueError(f"无法处理文件 '{file.filename}'。")
    finally:
        # 确保临时文件在使用后被删除
        if temp_file_path and os.path.exists(temp_file_path):
            _safe_delete_temp_file(temp_file_path)


def _safe_delete_temp_file(file_path: str) -> None:
    """
    安全删除临时文件，避免文件锁定问题
    """
    # 尝试多次删除文件，增加成功几率
    for attempt in range(5):
        try:
            # 清理可能的文件引用
            gc.collect()
            
            # 检查文件是否存在
            if not os.path.exists(file_path):
                return
                
            # 尝试删除文件
            os.remove(file_path)
            print(f"Successfully deleted temporary file: {file_path}")
            return
        except PermissionError as e:
            # 文件被锁定，等待一段时间后重试
            print(f"Attempt {attempt + 1}: Permission denied when deleting '{file_path}': {e}")
            time.sleep(0.5)
        except Exception as e:
            # 其他异常，记录后重试
            print(f"Attempt {attempt + 1}: Error deleting temporary file '{file_path}': {e}")
            time.sleep(0.5)
    
    # 如果所有尝试都失败了，记录错误
    print(f"Failed to delete temporary file '{file_path}' after 5 attempts")


def _extract_images_from_pdf_bytes(pdf_bytes: bytes) -> List[bytes]:
    """
    从PDF的字节流中提取所有页面的高质量图片。
    """
    images = []
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for page in doc:
            # 使用较高的DPI以获得清晰的图片
            pix = page.get_pixmap(dpi=200)  # type: ignore
            img_bytes = pix.tobytes("png") # 输出为PNG格式
            images.append(img_bytes)
    return images