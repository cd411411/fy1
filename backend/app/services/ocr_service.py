# app/services/ocr_service.py

import logging
from typing import Optional, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from .. import database

logger = logging.getLogger(__name__)

# --- 全局变量，用于单例模式 ---
_ocr_engine: Optional[Any] = None


def _initialize_ocr_engine():
    """
    初始化PaddleOCR引擎
    
    该函数尝试初始化PaddleOCR引擎，首先检查是否可以使用GPU进行加速，
    如果GPU不可用则回退到CPU模式。使用PP-OCRv5版本，支持中文识别。

    Returns:
        Optional[Any]: 初始化的PaddleOCR引擎实例，如果初始化失败则返回None

    Example:
        >>> engine = _initialize_ocr_engine()
        >>> if engine:
        ...     print("OCR引擎初始化成功")
    """
    from paddleocr import PaddleOCR
    import cv2
    import numpy as np

    def _is_gpu_available():
        """
        检查GPU是否可用
        
        通过检查PaddlePaddle是否编译了CUDA支持以及当前设备是否为GPU来判断GPU是否可用。

        Returns:
            str: "gpu" 如果GPU可用，否则返回 "cpu"
        """
        try:
            import paddle
            if paddle.device.is_compiled_with_cuda() and paddle.device.get_device().startswith('gpu'):
                return "gpu"
            else:
                return "cpu"
        except Exception:
            return "cpu"

    logger.info("Initializing PaddleOCR engine...")
    try:
        device = _is_gpu_available()
        ocr_engine = PaddleOCR(
            ocr_version="PP-OCRv5",
            lang='ch',
            device=device)
        print(
            f"PaddleOCR engine initialized successfully with device={device}.")
        return ocr_engine
    except Exception as e:
        logger.error(f"Failed to initialize PaddleOCR engine: {e}")
        logger.info("Trying to initialize PaddleOCR engine with CPU...")
        # 尝试使用CPU初始化
        try:
            ocr_engine = PaddleOCR(
                ocr_version="PP-OCRv5",
                lang='ch',
                device="cpu")
            logger.info("PaddleOCR engine initialized successfully with CPU.")
            return ocr_engine
        except Exception as cpu_e:
            ocr_engine = None
            print(
                f"CRITICAL: Failed to initialize PaddleOCR engine with CPU: {cpu_e}")
            print("OCR functionality will be disabled.")
            return ocr_engine


async def get_ocr_engine(db: AsyncSession) -> Optional[Any]:
    """
    获取PaddleOCR引擎的单例（懒加载）
    
    该函数实现了单例模式，确保在整个应用程序生命周期中只初始化一次OCR引擎。
    同时检查功能开关，如果本地OCR功能被禁用，则不初始化引擎。

    Args:
        db (AsyncSession): 数据库会话，用于查询功能开关状态

    Returns:
        Optional[Any]: PaddleOCR引擎实例，如果功能被禁用或初始化失败则返回None

    Example:
        >>> engine = await get_ocr_engine(db_session)
        >>> if engine:
        ...     # 执行OCR操作
        ...     pass
    """
    global _ocr_engine

    flag = await database.get_feature_flag_by_key(db, "use_local_ocr")
    if not flag or not flag.is_enabled:
        print(
            "INFO: Local OCR service is disabled by feature flag. Skipping initialization.")
        return None

    _ocr_engine = _initialize_ocr_engine()

    return _ocr_engine


def ocr_images(images_bytes: List[bytes]) -> str:
    """
    对图片列表执行OCR识别并返回识别文本
    
    该函数接收一个包含图片字节数据的列表，使用PaddleOCR引擎对每张图片进行文字识别，
    并将所有识别结果按页组织后返回。

    Args:
        images_bytes (List[bytes]): 图片字节流列表，每个元素是一张图片的字节数据

    Returns:
        str: 所有识别出的文本，用分页符分隔，格式为 "第一页内容\n\n--- Page Break ---\n\n第二页内容"

    Raises:
        RuntimeError: 当PaddleOCR引擎未初始化或不可用时抛出异常

    Example:
        >>> with open("image1.png", "rb") as f1, open("image2.png", "rb") as f2:
        ...     images = [f1.read(), f2.read()]
        >>> text = ocr_images(images)
        >>> print(text)
        '第一页识别内容\n\n--- Page Break ---\n\n第二页识别内容'
    """
    import cv2
    import numpy as np

    if not _ocr_engine:
        raise RuntimeError("PaddleOCR engine is not available.")

    full_text = []

    for i, img_bytes in enumerate(images_bytes):
        try:
            # 将字节流解码为OpenCV可以读取的格式
            np_arr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            if img is None:
                print(
                    f"Warning: Could not decode image at index {i}. Skipping.")
                full_text.append(
                    f"\n--- [ERROR: FAILED TO DECODE IMAGE {i+1}] ---\n")
                continue

            # 执行OCR
            result = _ocr_engine.predict(img)
            # print(f"OCR result for image {i+1}: {result}")
            # with open("ocr_result.txt", "a",encoding="utf-8") as f:
            #     f.write(str(result))
            # 提取并拼接文本
            page_texts = []
            if result:
                for item in result:
                    # 遍历result中的每个dict，并提取rec_texts键的值
                    if hasattr(item, 'rec_texts'):
                        page_texts.extend(item.rec_texts)
                    elif isinstance(item, dict) and 'rec_texts' in item:
                        page_texts.extend(item['rec_texts'])

                full_text.append("\n".join(page_texts))
            else:
                full_text.append("")

        except Exception as e:
            # 捕获单张图片处理的错误，避免整个任务失败
            logger.error(f"Error processing image at index {i}: {e}")
            full_text.append(
                f"\n--- [ERROR: FAILED TO PROCESS PAGE {i+1}] ---\n")

    return "\n\n--- Page Break ---\n\n".join(full_text)