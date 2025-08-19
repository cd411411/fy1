import orjson as json
from typing import AsyncGenerator, List, Dict, Any, Tuple
from openai import AsyncOpenAI, APIError
from ..schemas.document_schemas import ChatMessage
from ..database import get_active_ai_model, AIModel, ModelType
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


async def _get_openai_client_and_model(db: AsyncSession, model_type: ModelType) -> Tuple[AsyncOpenAI, AIModel]:
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
                messages_for_api.append(ChatCompletionSystemMessageParam(
                    role="system", content=msg.content))
            elif msg.role == "user":
                messages_for_api.append(ChatCompletionUserMessageParam(
                    role="user", content=msg.content))
            elif msg.role == "assistant":
                messages_for_api.append(ChatCompletionAssistantMessageParam(
                    role="assistant", content=msg.content))

        print(f"Sending stream request to API with model: {model_name}")

        params = {
            "model": active_model.model_name,
            "messages": [msg.model_dump() for msg in history],
            "stream": True,
            "temperature": active_model.temperature if active_model.temperature is not None else DEFAULT_TEMPERATURE,
            "top_p": active_model.top_p if active_model.top_p is not None else None,
            "max_tokens": active_model.max_tokens if active_model.max_tokens is not None else DEFAULT_MAX_TOKENS,
        }

        params = {k: v for k, v in params.items() if v is not None}

        stream = await client.chat.completions.create(**params)

        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                yield f"data: {json.dumps({'content': content}).decode('utf-8')}\n\n"

        yield f"data: {json.dumps({'done': True}).decode('utf-8')}\n\n"
        print("Stream completed successfully")

    except APIError as e:
        error_message = f'AI服务返回错误: {e}'
        print(f"OpenAI API Error: {error_message}")
        yield f"data: {json.dumps({'error': error_message}).decode('utf-8')}\n\n"
    except ValueError as e:  # 捕获 get_active_ai_model 抛出的错误
        print(f"Configuration Error: {e}")
        yield f"data: {json.dumps({'error': str(e)}).decode('utf-8')}\n\n"
    except Exception as e:
        print(f"An unexpected error occurred in stream_ai_chat: {e}")
        yield f"data: {json.dumps({'error': '发生未知错误，请联系管理员'}).decode('utf-8')}\n\n"


async def extract_info_from_image(image_bytes: bytes, party_type: str, db: AsyncSession) -> Dict[str, Any]:
    """
    使用多模态模型分析图片。
    """
    # 将图片字节转换为Base64编码，这是API需要的格式
    client, active_model = await _get_openai_client_and_model(db, "vision")
    model_name = active_model.model_name
    base64_image = base64.b64encode(image_bytes).decode('utf-8')

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
```json
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
```json
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

    try:
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
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                        }
                    ],
                }
            ],
            stream=False,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content
        return json.loads(content) if content else {}
    except Exception as e:
        print(f"Error calling Vision API: {e}")
        return {}


async def get_vision_analysis(image_path: str, prompt: str, db: AsyncSession) -> dict:
    """调用AI视觉识别API分析图片内容"""

    client, active_model = await _get_openai_client_and_model(db, "vision")
    model_name = active_model.model_name

    with open(image_path, "rb") as image_file:
        base64_image = base64.b64encode(image_file.read()).decode('utf-8')

    try:
        response = await client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                        }
                    ],
                }
            ],
            stream=False,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content
        return json.loads(content) if content else {}
    except Exception as e:
        print(f"Error calling Vision API: {e}")
        return {}


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
                f"Unable to parse AI response as JSON after cleaning: {content}")


async def get_ai_json_response(prompt: str, db: AsyncSession, model_type: ModelType = "general") -> dict:
    """调用AI并期望返回一个JSON对象"""

    client, active_model = await _get_openai_client_and_model(db, model_type)
    model_name = active_model.model_name

    print(f"Sending JSON request to API with model: {model_name}")
    params = {
        "model": active_model.model_name,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant designed to output JSON."},
            {"role": "user", "content": prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": active_model.temperature if active_model.temperature is not None else DEFAULT_TEMPERATURE,
        "top_p": active_model.top_p if active_model.top_p is not None else None,
        "max_tokens": active_model.max_tokens if active_model.max_tokens is not None else DEFAULT_MAX_TOKENS,
    }
    params = {k: v for k, v in params.items() if v is not None}
    
    response = await client.chat.completions.create(**params)

    content = response.choices[0].message.content
    if not content:
        raise ValueError("AI没有返回任何内容，请检查您提交的内容，或稍后重试")
    return _parse_and_clean_json(content)


async def extract_info_from_multiple_images(images_bytes: List[bytes], prompt: str, db: AsyncSession) -> Dict[str, Any]:
    """
    使用多模态模型分析多张图片，将它们视为一个连续文档。
    """
    client, active_model = await _get_openai_client_and_model(db, "vision")
    model_name = active_model.model_name

    # 构建 OpenAI API 需要的 content 列表
    content_list: List[ChatCompletionContentPartParam] = [
        ChatCompletionContentPartTextParam(type="text", text=prompt)
    ]
    for img_bytes in images_bytes:
        base64_image = base64.b64encode(img_bytes).decode('utf-8')
        content_list.append(
            ChatCompletionContentPartImageParam(
                type="image_url",
                image_url={"url": f"data:image/png;base64,{base64_image}"}
            )
        )

    try:
        print(
            f"Calling Vision API with {len(images_bytes)} images using model: {model_name}")
        response = await client.chat.completions.create(
            model=model_name,
            messages=[ChatCompletionUserMessageParam(role="user", content=content_list)],
            stream=False,
            response_format={"type": "json_object"},
        )
        response_content = response.choices[0].message.content
        if not response_content:
            return {}
        return _parse_and_clean_json(response_content)
    except Exception as e:
        print(f"Error calling Vision API with multiple images: {e}")
        return {}
