# app/api/documents.py (已重构为异步)

from fastapi import APIRouter, File, Form, HTTPException, Query, Depends, UploadFile
from fastapi.responses import FileResponse

from app.services import file_service
from ..schemas.document_schemas import DocumentGenerationRequest, EvidenceChecklistRequest, EvidenceChecklistResponse
from ..services import docx_service, ai_service
from .. import database
from ..config.config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from urllib.parse import quote
from pydantic import BaseModel
from pathlib import Path
import time
from ..database import Case
from typing import Literal, Optional, Dict, Any
import orjson as json

router = APIRouter(prefix="/api/documents", tags=["Documents"])
PROJECT_ROOT = Path(__file__).parent.parent.parent


def _format_final_data_for_display(final_data: Dict[str, Any]) -> Dict[str, str]:
    """
    将 final_data 对象格式化为包含 claims 和 facts 字符串的字典
    
    Args:
        final_data (Dict[str, Any]): 包含案件信息的原始数据字典
        
    Returns:
        Dict[str, str]: 格式化后的字典，包含claims（诉讼请求）和facts（事实与理由）两个字符串键值对
    """
    claims_text = ""
    facts_text = ""

    # 格式化诉讼请求
    claim_items = final_data.get("claimItems", [])
    if claim_items:
        claims_parts = [
            f"{item.get('question', '')}\n{item.get('answers', '')}" for item in claim_items]
        claims_text = "\n\n".join(claims_parts)

    # 格式化事实与理由
    fact_items = final_data.get("factItems", [])
    if fact_items:
        facts_parts = [
            f"{item.get('question', '')}\n{item.get('answers', '')}" for item in fact_items]
        facts_text = "\n\n".join(facts_parts)

    return {"claims": claims_text, "facts": facts_text}


@router.post("/generate-and-save")
async def generate_and_save_document(
    request: DocumentGenerationRequest,
    db: AsyncSession = Depends(database.get_db)
):
    """
    生成并保存法律文书
    
    Args:
        request (DocumentGenerationRequest): 包含文档生成所需信息的请求体
        db (AsyncSession): 数据库会话依赖
        
    Returns:
        FileResponse: 生成的DOCX文件响应
        
    Raises:
        HTTPException: 当文档生成或保存过程中出现错误时
    """
    doc_type = request.document_type
    case_number_req = request.case_number
    form_data = request.payload.formData
    final_data = request.payload.final
    case_cause = final_data.case_type or "未知案由"

    case_obj: Case
    defendant_id: Optional[int] = None
    verification_code: str = ""
    is_new_case = False

    try:
        if doc_type == "答辩状":
            if settings.is_court_mode:
                # 仅在法院模式下，强制要求案号和被告验证码
                if not (case_number_req and case_number_req.strip()):
                     raise HTTPException(status_code=400, detail="法院模式下，填写答辩状必须提供有效的案号。")
                
                defendant_code = form_data.get("basicInfo", {}).get("defendantCode")
                if not defendant_code:
                    raise HTTPException(status_code=400, detail="法院模式下，填写答辩状需要提供被告验证码。")

                defendant_obj = await database.get_defendant_by_code(db, defendant_code)
                if not defendant_obj or defendant_obj.case.case_number != case_number_req:
                    raise HTTPException(status_code=403, detail="案号与被告验证码不匹配。")
                
                case_obj = defendant_obj.case
                defendant_id = defendant_obj.id
                verification_code = defendant_obj.verification_code
            else:
                # 开源模式下，如果提供了案号就查找，否则就创建一个新的
                case_obj = await database.find_or_create_case(db, case_number_req, case_cause, form_data)
                # 在开源模式下，我们假设答辩状的作者是案件中的第一个被告（如果没有的话会被创建）
                await db.refresh(case_obj, ['defendants'])
                if case_obj.defendants:
                    defendant_id = case_obj.defendants[0].id
                    verification_code = case_obj.defendants[0].verification_code

        else:  # 起诉状
            is_new_case = not (case_number_req and case_number_req.strip())
            case_number_internal = case_number_req if not is_new_case else f"新案件-{int(time.time())}"
            case_obj = await database.find_or_create_case(db, case_number_internal, case_cause, form_data)
            verification_code = case_obj.plaintiff_code

        # 刷新以加载最新的关联对象
        await db.refresh(case_obj, ['defendants'])

        await database.save_new_document_version(
            db, case_obj.id, doc_type, form_data, final_data.model_dump(), defendant_id
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"保存文书时发生数据库错误: {e}")

    final_case_number = case_obj.case_number
    filename_for_user = f"{case_cause}-{doc_type}-{final_case_number}.docx"

    try:
        file_path = docx_service.create_docx_from_final_data(
            final_data=final_data,
            template_name="claim_template" if doc_type == "起诉状" else "defense_template",
            output_path=filename_for_user
        )

        encoded_filename = quote(filename_for_user)
        headers = {
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
            "X-Verification-Code": verification_code,
            "Access-Control-Expose-Headers": "X-Case-Number, X-Verification-Code"
        }

        if not is_new_case or doc_type == "答辩状":
            headers["X-Case-Number"] = quote(str(final_case_number))

        return FileResponse(
            path=file_path,
            media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            headers=headers
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成DOCX文件时出错: {e}")


@router.get("/latest-claim/{case_number}")
async def get_latest_claim_document(
    case_number: str,
    case_cause: str = Query(..., description="当前正在填写的文书案由，用于验证匹配"),
    db: AsyncSession = Depends(database.get_db)
):
    """
    (开源版使用)根据案号获取起诉状信息
    
    Args:
        case_number (str): 案件编号
        case_cause (str): 案由，用于验证匹配
        db (AsyncSession): 数据库会话依赖
        
    Returns:
        Dict[str, str]: 格式化后的起诉状信息，包含claims和facts
        
    Raises:
        HTTPException: 当未找到对应起诉状信息时
    """
    doc = await database.get_latest_document_by_case_number_and_cause(db, case_number, "起诉状", case_cause)
    if not doc:
        raise HTTPException(
            status_code=404, detail=f"未能根据案号 [{case_number}] 找到对应的起诉状信息。")

    final_data = json.loads(doc.final_data)
    # 调用辅助函数进行格式化
    return _format_final_data_for_display(final_data)


class AutoFillRequest(BaseModel):
    form_id: str
    full_text: str


def get_form_structure_prompt(form_id: str) -> str:
    """
    获取表单结构提示信息
    
    Args:
        form_id (str): 表单ID
        
    Returns:
        str: 表单结构的JSON字符串
        
    Raises:
        FileNotFoundError: 当未找到对应的表单结构文件时
    """
    prompt_file = PROJECT_ROOT / "ai_prompts" / f"{form_id}_structure.json"
    # print(f"Loading prompt structure from: {prompt_file}")
    if not prompt_file.exists():
        raise FileNotFoundError(
            f"Prompt structure file not found for: {form_id}")
    with open(prompt_file, 'r', encoding='utf-8') as f:
        return f.read()


@router.post("/autofill")
async def autofill(
    # form-data 形式接收所有参数
    form_id: str = Form(...),
    text_content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(database.get_db)
):
    """
    从文本或文件中提取信息并填充表单。
    
    Args:
        form_id (str): 表单ID
        text_content (Optional[str]): 文本内容
        file (Optional[UploadFile]): 上传的文件
        db (AsyncSession): 数据库会话依赖
        
    Returns:
        Dict[str, Any]: AI提取的结构化信息
        
    Raises:
        HTTPException: 当处理过程中出现错误时
    """
    if not text_content and not file:
        raise HTTPException(status_code=400, detail="必须提供文本内容或上传文件。")

    try:
        form_structure_prompt = get_form_structure_prompt(form_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"未找到自动填充配置: {form_id}")

    base_prompt = f"""
    你是一个顶级法律助理，极其擅长从非结构化的案情描述中提取精确的、结构化的信息。
    你的任务是：仔细阅读以下“案情描述”，并严格按照“输出JSON结构”的格式，提取所有相关信息。

    **规则**:
    1.  你必须返回一个完整的、合法的JSON对象，不要有任何额外的解释。
    2.  对于当事人信息，如果有多位，请在对应的数组（如 `plaintiffs_natural`）中创建多个对象。
    3.  对于代理人信息，如果有多个，请在对应的数组（ `agents`）中创建多个对象，但最多只能2个代理人。
    4.  对于“有/无”的单选框，请将值设为 "yes" 或 "no"。
    5.  对于复选框，请将值设为 true 或 false。
    6.  如果案情描述中没有提到某个字段的信息，请将该字段的值设为 null 或空字符串 ""。
    7.  案号、案由等信息如果未提供，也设为null。
    8.  各个完整陈述部分，请将原文转变为更符合诉状格式的陈述，确保逻辑清晰、条理分明。
    9.  诉讼请求部分，请用有序列表形式输出，每一列用换行符分割

    **输出JSON结构**:
    ```json
    {form_structure_prompt}
    ```

    **案情描述**:
    ---
    """

    try:
        if file:
            extracted_content = await file_service.extract_content_from_upload(file)
            if isinstance(extracted_content, str):
                # 文件中提取出文本，使用文本模式
                prompt = base_prompt + extracted_content + "\n---"
                response_json = await ai_service.get_ai_json_response(prompt, db)
            else:  # 是图片列表
                prompt = base_prompt + "\n(请分析以下连续的文档图片)\n---"
                response_json = await ai_service.extract_info_from_multiple_images(extracted_content, prompt, db)
        else:  # 只提供了文本
            assert text_content is not None
            prompt = base_prompt + text_content + "\n---"
            response_json = await ai_service.get_ai_json_response(prompt, db)

        return response_json
    except Exception as e:
        print(f"AI Autofill failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI分析失败: {str(e)}")


@router.post("/generate-evidence-checklist", response_class=FileResponse)
async def generate_evidence_checklist(
    request: EvidenceChecklistRequest,
    db: AsyncSession = Depends(database.get_db)
):
    """
    根据案情，AI生成证据目录并返回DOCX文件
    
    Args:
        request (EvidenceChecklistRequest): 包含文档类型、诉讼请求和事实理由的请求体
        db (AsyncSession): 数据库会话依赖
        
    Returns:
        FileResponse: 生成的证据目录DOCX文件
        
    Raises:
        HTTPException: 当生成证据目录过程中出现错误时
    """

    prompt = f"""
    你是一位经验丰富的诉讼律师，极其擅长梳理证据。你的任务是根据当事人撰写的“{request.doc_type}”中的“主要诉请/答辩”和“事实与理由”，推荐一份核心的证据目录。

    你必须严格按照以下JSON格式返回，不要有任何额外解释。每个证据的“拟证明事项”必须简洁且直接关联“主要诉请/答辩”或“事实与理由”中的某一点。

    输出格式:
    {{
      "evidence_list": [
        {{
          "id": "1",
          "name": "【证据名称，例如：当事人身份证、营业执照】",
          "proof_point": "【该证据拟证明的事项】",
          "source": "【证据来源，例如：原告/被告提供，或XX机关】",
          "page": "【证据在卷宗中的页码或位置，例如：第1页、第2-3页等,可留空】"
        }}
      ],
      "why": "【详细解析为什么需要这些证据，用有序列表输出，针对每个证据单独说明，并提供收集证据的建议手段或步骤，请不要用Markdown语法输出】"
    }}

    主要诉请/答辩:
    ---
    {request.claims}
    ---

    事实与理由:
    ---
    {request.facts}
    ---
    """
    try:
        ai_response_json = await ai_service.get_ai_json_response(prompt, db)
        validated_data = EvidenceChecklistResponse(**ai_response_json)
        context = validated_data.model_dump()

        template_name = "evidence_checklist_template"
        output_path_user = f"推荐证据目录-{request.doc_type}.docx"
        output_path_server = f"evidence_checklist_{int(time.time())}.docx"

        file_path = docx_service.create_docx_from_context(
            context, template_name, output_path_server)

        encoded_filename = quote(output_path_user)
        headers = {
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"}

        return FileResponse(
            path=file_path,
            headers=headers,
            media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
    except Exception as e:
        print(f"Failed to generate evidence checklist: {e}")
        raise HTTPException(status_code=500, detail=f"AI生成证据目录失败: {str(e)}")


class LoadRequest(BaseModel):
    case_number: str
    verification_code: str


@router.post("/load-for-editing")
async def load_document_for_editing(
    request: LoadRequest,
    db: AsyncSession = Depends(database.get_db)
):
    """
    统一加载函数，根据案号和验证码加载文档数据
    
    Args:
        request (LoadRequest): 包含案号和验证码的请求体
        db (AsyncSession): 数据库会话依赖
        
    Returns:
        Dict[str, Any]: 加载的文档数据
        
    Raises:
        HTTPException: 当案号或验证码不正确时
    """
    loaded_data = await database.load_document_data_by_code(
        db, request.case_number, request.verification_code
    )
    if loaded_data is None:
        raise HTTPException(status_code=404, detail="案号或验证码不正确。")
    return loaded_data


@router.get("/get-claim-for-defense")
async def get_claim_for_defense_by_defendant(
    case_number: str,
    defendant_code: str,
    current_case_cause: str = Query(
        ..., description="The case cause of the defense form being filled out"),
    db: AsyncSession = Depends(database.get_db)
):
    """
    供被告在填写答辩状时，使用案号和自己的验证码来查询原告的起诉状内容
    
    Args:
        case_number (str): 案件编号
        defendant_code (str): 被告验证码
        current_case_cause (str): 当前正在填写的文书案由
        db (AsyncSession): 数据库会话依赖
        
    Returns:
        Dict[str, Any]: 原告起诉状的最终数据
        
    Raises:
        HTTPException: 当案号或验证码不正确，或案由不匹配，或未找到起诉状时
    """
    case_obj = await database.get_case_by_number_and_code(db, case_number, defendant_code, "defendant")
    if not case_obj:
        raise HTTPException(status_code=403, detail="案号或被告验证码不正确。")

    if case_obj.case_cause != current_case_cause:
        raise HTTPException(status_code=403, detail="案由不匹配，请检查后再试。")

    claim_doc = await database.get_latest_document_by_case_id(db, case_obj.id, "起诉状")
    if not claim_doc:
        raise HTTPException(status_code=404, detail="未找到与该案件关联的起诉状。")

    # 格式化并返回前端需要的结构
    final_data = json.loads(claim_doc.final_data)
    return final_data
