from fastapi import HTTPException
import orjson as json
from typing import AsyncGenerator, List, Dict, Any, Optional, Tuple
from openai import AsyncOpenAI, APIError
from ..schemas.document_schemas import ChatMessage
from ..database import get_active_ai_model, AIModel, ModelType, log_ai_usage
from sqlalchemy.ext.asyncio import AsyncSession
import base64
from openai.types.chat import (
    ChatCompletionSystemMessageParam,
    ChatCompletionUserMessageParam,
    ChatCompletionAssistantMessageParam,
    ChatCompletionMessageParam,
    ChatCompletionContentPartParam,
    ChatCompletionContentPartTextParam,
    ChatCompletionContentPartImageParam,
)
from ..log_queue import log_queue
from ..services import ocr_service
from ..database import get_feature_flag_by_key
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from ..services.rag_service import RAGService

async def _get_openai_client_and_model(
    db: AsyncSession, model_type: ModelType
) -> Tuple[AsyncOpenAI, AIModel]:
    active_model = await get_active_ai_model(db, model_type)
    if not active_model:
        raise ValueError(f"数据库中没有找到激活的 '{model_type}' 类型AI模型。")

    client = AsyncOpenAI(
        api_key=active_model.api_key,
        base_url=active_model.base_url,
        timeout=180.0,
    )
    return client, active_model


# 配置常量
DEFAULT_TEMPERATURE = 0.7
DEFAULT_MAX_TOKENS = 4096


async def stream_ai_chat(
    history: List[ChatMessage], db: AsyncSession
) -> AsyncGenerator[str, None]:
    """与AI API进行流式通信"""

    if not history:
        yield f"data: {json.dumps({'error': '聊天历史不能为空'}).decode('utf-8')}\n\n"
        return

    try:
        client, active_model = await _get_openai_client_and_model(db, "general")
        model_name = active_model.model_name

        messages_for_api: List[ChatCompletionMessageParam] = []
        for msg in history:
            if msg.role == "system":
                messages_for_api.append(
                    ChatCompletionSystemMessageParam(role="system", content=msg.content)
                )
            elif msg.role == "user":
                messages_for_api.append(
                    ChatCompletionUserMessageParam(role="user", content=msg.content)
                )
            elif msg.role == "assistant":
                messages_for_api.append(
                    ChatCompletionAssistantMessageParam(
                        role="assistant", content=msg.content
                    )
                )

        print(f"Sending stream request to API with model: {model_name}")

        params = {
            "model": active_model.model_name,
            "messages": [msg.model_dump() for msg in history],
            "stream": True,
            "temperature": (
                active_model.temperature
                if active_model.temperature is not None
                else DEFAULT_TEMPERATURE
            ),
            "top_p": active_model.top_p if active_model.top_p is not None else None,
            "max_tokens": (
                active_model.max_tokens
                if active_model.max_tokens is not None
                else DEFAULT_MAX_TOKENS
            ),
        }

        params = {k: v for k, v in params.items() if v is not None}

        stream = await client.chat.completions.create(**params)

        async for chunk in stream:
            if (
                chunk.choices
                and chunk.choices[0].delta
                and chunk.choices[0].delta.content
            ):
                content = chunk.choices[0].delta.content
                yield f"data: {json.dumps({'content': content}).decode('utf-8')}\n\n"

        yield f"data: {json.dumps({'done': True}).decode('utf-8')}\n\n"
        print("Stream completed successfully")

    except APIError as e:
        error_message = f"AI服务返回错误: {e}"
        print(f"OpenAI API Error: {error_message}")
        yield f"data: {json.dumps({'error': error_message}).decode('utf-8')}\n\n"
    except ValueError as e:  # 捕获 get_active_ai_model 抛出的错误
        print(f"Configuration Error: {e}")
        yield f"data: {json.dumps({'error': str(e)}).decode('utf-8')}\n\n"
    except Exception as e:
        print(f"An unexpected error occurred in stream_ai_chat: {e}")
        yield f"data: {json.dumps({'error': '发生未知错误，请联系管理员'}).decode('utf-8')}\n\n"


async def extract_info_from_image(
    image_bytes: bytes,
    party_type: str,
    db: AsyncSession,
    request_source: Optional[str] = None,
) -> Dict[str, Any]:
    """
    智能地处理单张图片并提取信息。
    如果启用了本地OCR，则先OCR再调用常规LLM；否则直接调用多模态模型。

    Args:
        image_bytes: 图片的字节数据
        party_type: 当事人类型，决定使用的提示词模板
        db: 数据库会话，用于查询模型配置和功能开关
        request_source: 请求来源，用于日志记录

    Returns:
        从图片中提取的信息，以字典形式返回
    """
    # 1. 检查功能开关
    use_local_ocr_flag = await get_feature_flag_by_key(db, "use_local_ocr")
    
    # 根据 party_type 构建不同的 prompt
    if party_type == "natural_person_id_card":
        prompt = """请仔细分析这张身份证或护照图片，按照以下要求提取信息：

**提取字段：**
- 姓名 (name)
- 性别 (gender)
- 出生日期 (birthDate)
- 民族 (nation)
- 工作单位 (workUnit)
- 职务 (title)
- 联系电话 (phone)
- 住所地址 (address)
- 经常居住地 (currentAddress)
- 证件类型 (idType)
- 证件号码 (idNumber)

**格式要求：**
- 严格按照JSON格式返回
- 出生日期格式：YYYY-MM-DD
- 证件类型仅能为"身份证"或"护照"
- 如果某个字段无法识别或不存在，请设为以空值""返回
- 住所地址和经常居住地如果相同，可以设为相同值

**返回格式示例：**
```
{
    "name": "张三",
    "gender": "男",
    "birthDate": "1985-03-15",
    "nation": "汉族",
    "workUnit": "广州某某科技公司",
    "title": "总经理",
    "phone": "13812345678",
    "address": "广州市天河区某某路2号楼3单元401室",
    "currentAddress": "广州市天河区某某路2号楼3单元401室",
    "idType": "身份证",
    "idNumber": "440101198503151234"
}
```

请仅返回JSON格式的结果，不要添加其他解释文字。"""
    elif party_type == "legal_entity_license":
        prompt = """请仔细分析这张中国营业执照图片，按照以下要求提取信息：

**提取字段：**
- 企业名称 (entityName)
- 住所地址 (entityAddress)
- 注册地址 (registeredAddress)
- 法定代表人/负责人 (legalRepName)
- 法定代表人职务 (legalRepTitle)
- 企业联系电话 (entityPhone)
- 统一社会信用代码 (entityId)
- 企业类型 (entityType)
- 所有制性质 (ownership)

**格式要求：**
- 严格按照JSON格式返回
- 住所地址和注册地址如果相同，可以设为相同值
- 所有制性质分为：国有、民营、其他，请根据企业类型判断
- 如果某个字段无法识别，请设为null

**返回格式示例：**
```
{
    "entityName": "广州某科技有限公司",
    "entityAddress": "广州市天河区某某路6号",
    "registeredAddress": "广州市天河区某某路6号",
    "legalRepName": "李四",
    "legalRepTitle": "总经理",
    "entityPhone": "010-65432100",
    "entityId": "91110000123456789X",
    "entityType": "有限责任公司",
    "ownership": {
        "mainType": "民营",
        "stateOwnedSubType": null,
        "otherDetails": null
    }
}
```

请仅返回JSON格式的结果，不要添加其他解释文字。"""
    else:
        prompt = "请分析这张图片，提取其中所有的关键文本信息。"

    if use_local_ocr_flag and use_local_ocr_flag.is_enabled:
        print("Using local OCR + General LLM strategy for single image.")

        try:
            # 2. 执行本地OCR
            extracted_text = ocr_service.ocr_images([image_bytes])
            if not extracted_text.strip():
                raise ValueError("Local OCR did not return any text.")

            # 3. 将提取的文本注入到Prompt中，并调用常规LLM
            final_prompt = f"""
            你是一名顶级的法律助理，任务是分析一份由OCR从图片中提取的文档内容。

            [OCR提取的文档全文]:
            ---
            {extracted_text}
            ---

            **你的任务:**
            请根据OCR提取的文档内容，严格按照以下JSON格式和要求进行分析。
            (这里是原始的 vision prompt 的后半部分，要求AI做什么)
            {prompt} 
            """
            
            # 使用 "general" 模型处理纯文本
            return await get_ai_json_response(final_prompt, db, "general", request_source)

        except Exception as e:
                    print(f"Local OCR strategy failed: {e}")
                    # 如果本地OCR失败，可以考虑是否要回退到Vision模型，或者直接报错
                    # 尝试使用Vision模型作为备选方案
                    print("Falling back to Vision LLM strategy.")
                    try:
                        return await _extract_info_using_vision_model(image_bytes, prompt, db, request_source)
                    except Exception as fallback_e:
                        print(f"Vision model also failed: {fallback_e}")
                        # 如果Vision模型也失败，则返回空结果
                        return {}
    else:
        print("Using Vision LLM strategy for single image.")
        try:
            return await _extract_info_using_vision_model(image_bytes, prompt, db, request_source)
        except Exception as e:
            print(f"Vision model failed: {e}")
            # 如果Vision模型失败，则返回空结果
            return {}


async def _extract_info_using_vision_model(
    image_bytes: bytes,
    prompt: str,
    db: AsyncSession,
    request_source: Optional[str] = None,
) -> Dict[str, Any]:
    """
    使用Vision模型从图片中提取信息

    Args:
        image_bytes: 图片的字节数据
        prompt: 提示词
        db: 数据库会话
        request_source: 请求来源

    Returns:
        从图片中提取的信息
    """
    # 将图片字节转换为Base64编码，这是API需要的格式
    client, active_model = await _get_openai_client_and_model(db, "vision")
    model_name = active_model.model_name
    base64_image = base64.b64encode(image_bytes).decode("utf-8")

    print(f"Calling Vision API with model: {model_name}")
    response = await client.chat.completions.create(
        model=model_name,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        },
                    },
                ],
            }
        ],
        stream=False,
        response_format={"type": "json_object"},
    )
    if response.usage:
        log_data = {
            "model_id": active_model.id,
            "model_name": active_model.model_name,
            "usage_data": response.usage.model_dump(),
            "request_source": request_source,
        }
        await log_queue.put(log_data)
    content = response.choices[0].message.content
    return json.loads(content) if content else {}


# async def get_vision_analysis(image_path: str, prompt: str, db: AsyncSession, request_source: Optional[str] = None) -> dict:
#     """调用AI视觉识别API分析图片内容"""

#     client, active_model = await _get_openai_client_and_model(db, "vision")
#     model_name = active_model.model_name

#     with open(image_path, "rb") as image_file:
#         base64_image = base64.b64encode(image_file.read()).decode('utf-8')

#     try:
#         response = await client.chat.completions.create(
#             model=model_name,
#             messages=[
#                 {
#                     "role": "user",
#                     "content": [
#                         {
#                             "type": "text",
#                             "text": prompt
#                         },
#                         {
#                             "type": "image_url",
#                             "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
#                         }
#                     ],
#                 }
#             ],
#             stream=False,
#             response_format={"type": "json_object"},
#         )
#         if response.usage:
#             log_data = {
#                 "model_id": active_model.id,
#                 "model_name": active_model.model_name,
#                 "usage_data": response.usage.model_dump(),
#                 "request_source": request_source
#             }
#             await log_queue.put(log_data)
#         content = response.choices[0].message.content
#         return json.loads(content) if content else {}
#     except Exception as e:
#         print(f"Error calling Vision API: {e}")
#         return {}


def _parse_and_clean_json(content: str) -> dict:
    try:
        return json.loads(content)
    except Exception:
        cleaned_content = content.strip()
        if cleaned_content.startswith("```json"):
            cleaned_content = cleaned_content[7:]
        if cleaned_content.endswith("```"):
            cleaned_content = cleaned_content[:-3]
        try:
            return json.loads(cleaned_content)
        except Exception as e:
            print(f"Failed to parse cleaned JSON: {e}")
            raise ValueError(
                f"Unable to parse AI response as JSON after cleaning: {content}"
            )


async def get_ai_json_response(
    prompt: str,
    db: AsyncSession,
    model_type: ModelType = "general",
    request_source: Optional[str] = None,
    use_rag: bool = False,
    case_cause: Optional[str] = None,
    user_query: Optional[str] = None
) -> dict:
    """
    调用AI并期望返回一个JSON对象，并可选地先通过RAG增强上下文

    该函数通过配置的AI模型向OpenAI兼容的API发送请求，要求返回JSON格式的响应。它会自动处理模型选择、
    参数配置、使用量记录等操作，并解析返回的JSON内容。

    Args:
        prompt (str): 发送给AI的提示词，应该明确指示AI返回JSON格式的数据
        db (AsyncSession): 数据库会话，用于获取AI模型配置信息
        model_type (ModelType, optional): 模型类型，可以是"general"、"reasoning"或"fast"，默认为"general"
        request_source (Optional[str], optional): 请求来源标识，用于日志记录

    Returns:
        dict: 解析后的JSON响应内容

    Raises:
        ValueError: 当AI没有返回任何内容时抛出异常
    """
    from ..services.rag_service import RAGService
    final_prompt = prompt

    if use_rag and case_cause and user_query:
        print(f"RAG enabled for case cause: {case_cause}, query: {user_query}")
        try:
            rag_service = RAGService(db)
            retrieved_context = await rag_service.retrieve_and_rerank(case_cause, user_query)
            
            if retrieved_context:
                context_str = "\n\n".join(retrieved_context)
                # (核心) 构建RAG Prompt
                final_prompt = f"""
                请严格根据以下背景知识和参考资料来回答问题。你的回答必须优先、且仅限于使用提供的参考资料。

                [参考资料]:
                {context_str}
                
                [原始指令]:
                ---
                {prompt}
                ---
                """
            else:
                print("RAG retrieved no context, using original prompt.")
        except Exception as e:
            print(f"WARNING: RAG process failed, falling back to original prompt. Error: {e}")

    # 获取AI客户端和模型配置
    client, active_model = await _get_openai_client_and_model(db, model_type)
    model_name = active_model.model_name

    print(f"Sending JSON request to API with model: {model_name}")
    # 构建API请求参数
    params = {
        "model": active_model.model_name,
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant designed to output JSON.",
            },
            {"role": "user", "content": final_prompt},
        ],
        "response_format": {"type": "json_object"},
        "temperature": (
            active_model.temperature
            if active_model.temperature is not None
            else DEFAULT_TEMPERATURE
        ),
        "top_p": active_model.top_p if active_model.top_p is not None else None,
        "max_tokens": (
            active_model.max_tokens
            if active_model.max_tokens is not None
            else DEFAULT_MAX_TOKENS
        ),
        "reasoning_effort": "none" if model_type == "fast" else None,
    }
    # 过滤掉值为None的参数
    params = {k: v for k, v in params.items() if v is not None}

    # 发送请求到AI API
    response = await client.chat.completions.create(**params)

    # 记录使用量信息
    if response.usage:
        log_data = {
            "model_id": active_model.id,
            "model_name": active_model.model_name,
            "usage_data": response.usage.model_dump(),
            "request_source": request_source,
        }
        await log_queue.put(log_data)

    # 解析并返回响应内容
    content = response.choices[0].message.content
    if not content:
        raise ValueError("AI没有返回任何内容，请检查您提交的内容，或稍后重试")
    return _parse_and_clean_json(content)


async def extract_info_from_multiple_images(
    images_bytes: List[bytes],
    prompt: str,
    db: AsyncSession,
    request_source: Optional[str] = None,
) -> Dict[str, Any]:
    """
    智能地处理多张图片并提取信息
    如果启用了本地OCR，则先OCR再调用常规LLM；否则直接调用多模态模型。

    Args:
        images_bytes: 图片的字节数据列表
        prompt: 提示词，用于指导AI分析图片内容
        db: 数据库会话，用于查询模型配置和功能开关
        request_source: 请求来源，用于日志记录

    Returns:
        从图片中提取的信息，以字典形式返回
    """
     # 1. 检查功能开关
    use_local_ocr_flag = await get_feature_flag_by_key(db, "use_local_ocr")
    
    if use_local_ocr_flag and use_local_ocr_flag.is_enabled:
        print("Using local OCR + General LLM strategy.")

        try:
            # 2. 执行本地OCR
            extracted_text = ocr_service.ocr_images(images_bytes)
            if not extracted_text.strip():
                raise ValueError("Local OCR did not return any text.")
            print(f"=========[DEBUG]:OCR extracted text:===============\n{extracted_text}\n==============================")
            # 3. 将提取的文本注入到Prompt中，并调用常规LLM
            final_prompt = f"""
            你是一名顶级的法律助理，任务是分析一份由OCR从图片中提取的文档内容。

            [OCR提取的文档全文]:
            ---
            {extracted_text}
            ---

            你的任务:
            请根据OCR提取的文档内容，严格按照以下JSON格式和要求进行分析。
            {prompt} 
            """
            
            # 使用 "general" 模型处理纯文本
            return await get_ai_json_response(final_prompt, db, "general", request_source)

        except Exception as e:
                    print(f"Local OCR strategy failed: {e}")
                    # 如果本地OCR失败，可以考虑是否要回退到Vision模型，或者直接报错
                    raise HTTPException(status_code=500, detail=f"本地OCR处理失败: {e}")
    else:
        print("Using Vision LLM strategy.")



        # 获取Vision模型的客户端和模型配置
        client, active_model = await _get_openai_client_and_model(db, "vision")
        model_name = active_model.model_name

        # 构建 OpenAI API 需要的 content 列表
        content_list: List[ChatCompletionContentPartParam] = [
            ChatCompletionContentPartTextParam(type="text", text=prompt)
        ]
        # 将所有图片转换为base64编码并添加到内容列表中
        for img_bytes in images_bytes:
            base64_image = base64.b64encode(img_bytes).decode("utf-8")
            content_list.append(
                ChatCompletionContentPartImageParam(
                    type="image_url",
                    image_url={"url": f"data:image/png;base64,{base64_image}"},
                )
            )

        try:
            print(
                f"Calling Vision API with {len(images_bytes)} images using model: {model_name}"
            )
            # 调用Vision模型API处理图片
            response = await client.chat.completions.create(
                model=model_name,
                messages=[
                    ChatCompletionUserMessageParam(role="user", content=content_list)
                ],
                stream=False,
                response_format={"type": "json_object"},
            )
            # 记录API调用的使用情况
            if response.usage:
                log_data = {
                    "model_id": active_model.id,
                    "model_name": active_model.model_name,
                    "usage_data": response.usage.model_dump(),
                    "request_source": request_source,
                }
                await log_queue.put(log_data)
            response_content = response.choices[0].message.content
            if not response_content:
                return {}
            # 解析并清理返回的JSON数据
            return _parse_and_clean_json(response_content)
        except Exception as e:
            print(f"Error calling Vision API with multiple images: {e}")
            return {}

async def get_text_from_images(
    images_bytes: List[bytes], 
    db: AsyncSession,
    request_source: Optional[str] = None
) -> str:
    """
    使用Vision模型从多张图片中提取并合并所有文本。
    """
    if not images_bytes:
        return ""

    client, active_model = await _get_openai_client_and_model(db, "vision")
    
    prompt = "你的任务是作为一名顶级的OCR工具，精确地提取并返回图片中的所有文字内容。请将所有图片中的文字按顺序合并成一个连贯的文本字符串返回。不要添加任何你自己的解释或摘要。"

    content_list: List[ChatCompletionContentPartParam] = [
        ChatCompletionContentPartTextParam(type="text", text=prompt)
    ]
    for img_bytes in images_bytes:
        base64_image = base64.b64encode(img_bytes).decode("utf-8")
        content_list.append(
            ChatCompletionContentPartImageParam(
                type="image_url",
                image_url={"url": f"data:image/png;base64,{base64_image}"},
            )
        )

    try:
        response = await client.chat.completions.create(
            model=active_model.model_name,
            messages=[ChatCompletionUserMessageParam(role="user", content=content_list)],
            stream=False,
        )
        # 记录使用量
        if response.usage:
            log_data = {
                "model_id": active_model.id,
                "model_name": active_model.model_name,
                "usage_data": response.usage.model_dump(),
                "request_source": request_source,
            }
            await log_queue.put(log_data)
        
        return response.choices[0].message.content or ""
    except Exception as e:
        print(f"Error extracting text from images with Vision API: {e}")
        return "未能获取图片中的文本" # 出错时返回空字符串，避免中断整个流程
