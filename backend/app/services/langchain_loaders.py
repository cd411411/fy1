# app/services/langchain_loaders.py

from typing import List
from langchain_core.document_loaders.base import BaseLoader
from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFLoader
import fitz # PyMuPDF
from . import ai_service
from ..database import AsyncSessionLocal
import asyncio

# 定义一个阈值，少于这个字符数的PDF页面被认为是扫描件
TEXT_LENGTH_THRESHOLD = 50

class SmartPDFLoader(BaseLoader):
    """
    一个智能的PDF加载器，能够区分文本型和扫描型PDF，并对后者使用多模态模型进行OCR。
    """
    def __init__(self, file_path: str):
        self.file_path = file_path

    async def _load_with_pymupdf(self) -> List[Document]:
        """使用 PyMuPDF (fitz) 快速检查文本内容"""
        text_content = ""
        doc_pages = []
        try:
            pdf_doc = fitz.open(self.file_path)
            for page_num, page in enumerate(pdf_doc):
                text = page.get_text()
                text_content += text
                # 保留每个页面的文本，以便后续创建Document对象
                doc_pages.append(Document(
                    page_content=text,
                    metadata={"source": self.file_path, "page": page_num}
                ))
            pdf_doc.close()

            if len(text_content.strip()) > TEXT_LENGTH_THRESHOLD:
                print(f"SmartPDFLoader: '{self.file_path}' identified as text-based PDF.")
                return doc_pages
            else:
                return [] # 返回空列表，表示需要OCR
        except Exception as e:
            print(f"Error during PyMuPDF text extraction: {e}")
            return [] # 出错时也尝试OCR

    async def _load_with_vision_ocr(self) -> List[Document]:
        """使用多模态模型进行OCR"""
        print(f"SmartPDFLoader: '{self.file_path}' identified as scanned PDF. Using Vision model for OCR.")
        images_bytes: List[bytes] = []
        try:
            pdf_doc = fitz.open(self.file_path)
            for page in pdf_doc:
                pix = page.get_pixmap(dpi=200)
                img_bytes = pix.tobytes("png")
                images_bytes.append(img_bytes)
            pdf_doc.close()

            if not images_bytes:
                return []
            
            # (关键) 调用我们已有的ai_service
            # 需要一个数据库会话
            async with AsyncSessionLocal() as db:
                full_text = await ai_service.get_text_from_images(images_bytes, db, "rag_pdf_ocr")
            
            # Vision API通常返回整个文档的文本，我们将其作为一个Document
            return [Document(
                page_content=full_text,
                metadata={"source": self.file_path, "page": 0, "ocr_engine": "vision"}
            )]

        except Exception as e:
            print(f"Error during Vision OCR processing: {e}")
            return []
            
    def load(self) -> List[Document]:
        """
        同步加载方法，LangChain 的标准接口。
        我们在内部运行异步逻辑。
        """
        # 首先尝试快速文本提取
        docs = asyncio.run(self._load_with_pymupdf())
        
        # 如果没有提取到足够文本，则启动OCR
        if not docs:
            docs = asyncio.run(self._load_with_vision_ocr())
            
        return docs