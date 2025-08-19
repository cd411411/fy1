from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from pydantic import BaseModel, Field

from app.utils.utils import format_final_data_to_text
from .. import database
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Literal, Optional
from ..services.ai_service import get_ai_json_response, extract_info_from_multiple_images
from ..services import file_service
from .dependencies import get_current_user
import re
# 更新请求模型以匹配前端发送的数据结构


class LegalAnalysisRequest(BaseModel):
    content: str = Field(..., description="整合后的表单内容文本")

# Pydantic模型，用于验证和序列化响应


class LegalBasisItem(BaseModel):
    regulation: str = Field(..., description="具体的法律法规条款")
    reasoning: str = Field(..., description="该条款为何适用于本案的理由")


class LegalAnalysisResponse(BaseModel):
    analysis: List[LegalBasisItem]


router = APIRouter(prefix="/api/legal", tags=["Legal"])


@router.post("/analyze-regulations-structured", response_model=LegalAnalysisResponse)
async def analyze_regulations_structured(request: LegalAnalysisRequest,
                                         db: AsyncSession = Depends(database.get_db)):
    """分析案情，一次性返回结构化的法律法规列表及其适用理由"""

    # 验证输入内容不为空
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="请提供有效的案件内容进行分析")

    # print(f"Received request: {request.content}")

    prompt = f"""
    作为一名资深律师，请根据以下案件信息，分析并列出本案可能适用的核心法律法规条款。
    你必须严格按照以下JSON格式返回，不要包含任何额外的解释或文本。

    输出格式:
    {{
      "analysis": [
        {{
          "regulation": "【第一条相关法律法规，例如：《中华人民共和国反不正当竞争法》第二条】",
          "reasoning": "【解释第一条法规为何适用于本案的理由】"
        }},
        {{
          "regulation": "【第二条相关法律法规】",
          "reasoning": "【解释第二条法规为何适用于本案的理由】"
        }}
      ]
    }}

    【案件信息】
    {request.content}

    请仔细分析上述案件信息，提供3-5条最相关的法律法规条款及其适用理由。
    """

    # print(f"Prompt for AI:\n{prompt}\n")

    try:
        response_json = await get_ai_json_response(prompt, db)

        # 验证响应结构
        if not isinstance(response_json, dict) or "analysis" not in response_json:
            raise ValueError("AI response format is invalid")

        if not isinstance(response_json["analysis"], list):
            raise ValueError("Analysis field should be a list")

        # 验证每个分析项的结构
        for item in response_json["analysis"]:
            if not isinstance(item, dict) or "regulation" not in item or "reasoning" not in item:
                raise ValueError(
                    "Each analysis item should contain regulation and reasoning fields")

        return LegalAnalysisResponse(**response_json)

    except ValueError as e:
        print(f"Response validation error: {e}")
        raise HTTPException(status_code=500, detail="AI返回的数据格式不正确")
    except Exception as e:
        print(f"Error during legal analysis: {e}")
        raise HTTPException(status_code=500, detail=f"法律分析失败: {str(e)}")

# 可选：添加一个简单的健康检查端点


@router.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy", "service": "legal_analysis"}


class CaseAnalysisRequest(BaseModel):
    claim_final_data: Dict[str, Any]
    defense_final_data: Dict[str, Any]


class AnalysisResult(BaseModel):
    preliminary_judgment: str = Field(..., description="初步责任判断和倾向性意见")
    key_disputes: List[str] = Field(..., description="双方的核心争议焦点列表")
    questions_for_plaintiff: List[str] = Field(..., description="需要向原告核实的关键问题")
    questions_for_defendant: List[str] = Field(..., description="需要向被告核实的关键问题")
    evidence_weaknesses: List[str] = Field(..., description="双方可能存在的证据链薄弱环节")
    legal_difficulties: str = Field(..., description="本案的法律适用难点或复杂性分析")


@router.post("/analyze-case", response_model=AnalysisResult)
async def analyze_case(request: CaseAnalysisRequest,
                       db: AsyncSession = Depends(database.get_db)):
    """接收起诉状和答辩状内容，进行深度AI分析"""

    # 将复杂的JSON数据转换为更简洁的文本，方便AI阅读
    claim_text = format_final_data_to_text(request.claim_final_data)
    defense_text = format_final_data_to_text(request.defense_final_data)

    prompt = f"""
    你是一位经验极其丰富、逻辑严谨的资深法官。你的任务是基于原告的“起诉状”和被告的“答辩状”内容，对案件进行一次全面的预判分析。

    你需要严格按照以下JSON格式输出你的分析结果，不要有任何额外解释。

    输出格式:
    {{
      "preliminary_judgment": "【基于现有信息，对案件责任划分的初步判断和倾向性意见，例如：'倾向于支持原告的部分请求，因为...'】",
      "key_disputes": [
        "【争议焦点一：例如，双方对合同效力的认定不一致】",
        "【争议焦点二：例如，被告行为是否构成不正当竞争】"
      ],
      "questions_for_plaintiff": [
        "【需要向原告核实的第一个问题，以挖掘更多事实】",
        "【需要向原告核实的第二个问题】"
      ],
      "questions_for_defendant": [
        "【需要向被告核实的第一个问题】",
        "【需要向被告核实的第二个问题】"
      ],
      "evidence_weaknesses": [
        "【原告可能存在的证据薄弱点】",
        "【被告可能存在的证据薄弱点】"
      ],
      "legal_difficulties": "【本案在法律适用上可能存在的难点或复杂性分析】"
    }}

    ---
    【起诉状核心内容】
    {claim_text}
    ---
    【答辩状核心内容】
    {defense_text}
    ---
    """

    try:
        response_json = await get_ai_json_response(prompt, db)
        return AnalysisResult(**response_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI判案分析失败: {str(e)}")





class ObjectionAnalysisRequest(BaseModel):
    plaintiff_claim: str = Field(..., description="原告的单项诉讼请求内容")
    objection_title: str = Field(..., description="被告正在回应的答辩事项标题")


class ObjectionAnalysisResponse(BaseModel):
    plaintiff_claim_summary: str = Field(..., description="对原告该项诉请的简要分析总结")
    objection_suggestions: List[str] = Field(..., description="具体的异议点建议列表")


@router.post("/analyze-objection-points", response_model=ObjectionAnalysisResponse)
async def analyze_objection_points(request: ObjectionAnalysisRequest,
                                   db: AsyncSession = Depends(database.get_db)):
    """根据原告诉请，为被告的异议提供“分析+建议”"""

    if not request.plaintiff_claim.strip() or not request.objection_title.strip():
        raise HTTPException(status_code=400, detail="原告诉请和答辩事项标题不能为空")

    # (修改) 全面升级的 Prompt
    prompt = f"""
    你是一名经验丰富的诉讼律师，正在耐心指导一位法律知识有限的当事人（被告）填写答辩状。

    **背景:**
    原告在其起诉状中提出了以下诉讼请求和事实理由：
    ---
    {request.plaintiff_claim}
    ---
    
    **你的任务:**
    现在，被告需要针对 "{request.objection_title}" 这一项提出异议。请你分两步进行指导：

    1.  **分析原告诉请 (plaintiff_claim_summary):** 首先，用简洁、中立的语言向被告解释一下原告这项主张的核心内容和法律基础是什么。让被告能清晰地理解他需要反驳什么。
    2.  **提供异议建议 (objection_suggestions):** 基于你的分析，提供3到5个具体、有效的异议角度或抗辩理由。这些建议应当是可操作的、有逻辑的，并且易于被告理解。

    **要求:**
    *   `plaintiff_claim_summary` 必须是对原告诉请的客观分析，而不是直接的反驳。
    *   `objection_suggestions` 中的每个建议都应该是独立的、完整的句子。
    *   所有内容都要专业且通俗易懂。

    **你必须严格按照以下JSON格式返回，不要有任何额外解释或Markdown标记。**
    {{
      "plaintiff_claim_summary": "【这里是对原告诉请的简要分析和总结】",
      "objection_suggestions": [
        "【建议一：简洁、有力的异议点】",
        "【建议二：例如，从事实层面反驳...】",
        "【建议三：例如，从法律适用层面反驳...】"
      ]
    }}
    """
    try:
        response_json = await get_ai_json_response(prompt, db)
        # Pydantic会自动验证新的结构
        return ObjectionAnalysisResponse(**response_json)
    except Exception as e:
        print(f"AI analysis for objection points failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI分析异议点失败: {str(e)}")


class DocumentAdjudicationRequest(BaseModel):
    final_data: Dict[str, Any]
    document_type: Literal["起诉状", "答辩状"]


class AdjudicationResult(BaseModel):
    completeness_score: int = Field(...,
                                    description="完整度评分 (1-10)", ge=1, le=10)
    completeness_feedback: str = Field(..., description="关于完整性的具体反馈")
    legal_risk_analysis: List[str] = Field(..., description="识别出的潜在法律风险或不当诉求")
    expression_suggestions: List[str] = Field(..., description="语言表述或逻辑上的改进建议")
    overall_assessment: str = Field(..., description="总体评价和总结")


@router.post("/adjudicate-document", response_model=AdjudicationResult)
async def adjudicate_document(request: DocumentAdjudicationRequest,
                              db: AsyncSession = Depends(database.get_db)):
    """接收完整文书数据，进行AI研判"""

    # 复用已有的文本格式化函数，将结构化数据转为纯文本
    document_text = format_final_data_to_text(request.final_data)

    prompt = f"""
    你是一位顶级的、经验极其丰富的诉讼律师，现在需要评审一份 "{request.document_type}"。
    请你本着严谨、负责、专业的态度，从以下几个维度进行全面、客观且专业的分析，并严格按照指定的JSON格式返回你的评审报告。
    因为你的回答直接面向的是填写人，所以你应该称呼对方为“您”。

    **评审维度:**
    1.  **完整性 (completeness):** 核心要素（如当事人、诉请/答辩、事实、理由）是否齐全？事实与理由是否足以支撑诉请/答辩？信息是否存在明显缺失？请给出一个1-10分的评分，并附上具体反馈。
    2.  **法律风险 (legal_risk):** 诉请/答辩是否存在超越法律规定（如请求的利息或违约金过高）、缺乏法律依据、诉讼时效问题，或可能引发对自己不利的法律后果的部分？请明确指出风险点。
    3.  **语言表达 (expression):** 表述是否清晰、准确、无歧义？逻辑是否连贯、有条理？是否存在可以改进的措辞或句子结构？
    4.  **总体评价 (overall):** 对这份文书的综合看法，总结其主要优点和最需要改进的核心问题，并给出可行的改进建议。

    **输出格式 (必须严格遵守，不要添加任何额外解释):**
    {{
      "completeness_score": "【整数，1-10分】",
      "completeness_feedback": "【这里是关于完整性的具体反馈，说明哪些地方信息不足或多余】",
      "legal_risk_analysis": [
        "【风险点一：例如，诉请的违约金计算标准可能超过法定上限，建议调整为...】",
        "【风险点二：例如，某个事实陈述自相矛盾，可能影响可信度】",
        "【风险点三：例如，未明确诉讼时效是否中断，可能存在时效抗辩风险】"
      ],
      "expression_suggestions": [
        "【建议一：例如，建议将事实部分的第一段和第三段合并，以时间线叙事，逻辑更清晰】",
        "【建议二：例如，'大概'、'可能'等模糊词汇建议修改为更确切的表述，如'约在某时某地'】"
      ],
      "overall_assessment": "【这里是对这份文书的综合评价和核心建议总结】"
    }}

    ---
    【待评审的 {request.document_type} 内容】
    {document_text}
    ---
    """

    try:
        response_json = await get_ai_json_response(prompt, db)
        # Pydantic模型将验证AI的输出是否符合我们的要求
        return AdjudicationResult(**response_json)
    except Exception as e:
        print(f"AI adjudication failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI研判失败: {str(e)}")


class ContractAnalysisResponse(BaseModel):
    clause: str


@router.post("/analyze-contract-clause", response_model=ContractAnalysisResponse)
async def analyze_contract_clause(
    file: UploadFile = File(...),
    content: str = Form(...),  # 案情摘要
    db: AsyncSession = Depends(database.get_db)
):
    extracted_content = await file_service.extract_content_from_upload(file)
    try:
        if isinstance(extracted_content, str):
            contract_text = extracted_content
            prompt = f"""
            你是一位严谨的专业律师，擅长阅读长篇合同并精准定位关键条款。

            **背景:**
            当事人正在处理一个案件，案情摘要如下：
            ---
            [案情摘要]: {content}
            ---

            **合同全文:**
            ---
            [合同内容]: {contract_text}
            ---

            **你的任务:**
            请仔细阅读[合同内容]，并根据[案情摘要]中描述的争议焦点，找出并**完整引用**合同中**最相关的**核心条款。

            **要求:**
            1.  你返回的内容**只能是合同条款的原文引用**，不要添加任何你自己的解释、总结或标题，例如 "根据合同第X条..."。
            2.  如果找到了多个相关条款，请用换行符将它们隔开。
            3.  如果合同中没有找到直接相关的条款，请返回文字："经审查，合同中未找到与案情直接相关的条款。"
            4.  返回结果必须是JSON格式。

            **输出格式示例:**
            {{
                "clause": "第八条 违约责任：\\n1. 若乙方逾期支付租金，每逾期一日，应按月租金的0.5%向甲方支付违约金。\\n2. ... (条款原文)"
            }}
            """
            response_json = await get_ai_json_response(prompt, db)
        elif isinstance(extracted_content, list):  # 如果提取的是图片
            images_bytes = extracted_content
            prompt = f"""
            你是一位严谨的法律助理...
            [案情摘要]: {content}
            ---
            [合同图片内容]: (请分析以下连续的合同图片)
            ---
            **你的任务:**
            请仔细阅读[合同内容]，并根据[案情摘要]中描述的争议焦点，找出并**完整引用**合同中**最相关的**核心条款。

            **要求:**
            1.  你返回的内容**只能是合同条款的原文引用**，不要添加任何你自己的解释、总结或标题，例如 "根据合同第X条..."。
            2.  如果找到了多个相关条款，请用换行符将它们隔开。
            3.  如果合同中没有找到直接相关的条款，请返回文字："经审查，合同中未找到与案情直接相关的条款。"
            4.  返回结果必须是JSON格式。

            **输出格式示例:**
            {{
                "clause": "第八条 违约责任：\\n1. 若乙方逾期支付租金，每逾期一日，应按月租金的0.5%向甲方支付违约金。\\n2. ... (条款原文)"
            }}
            """
            response_json = await extract_info_from_multiple_images(images_bytes, prompt, db)
        else:
            raise HTTPException(status_code=500, detail="未知的提取内容类型")

        if "clause" not in response_json:
            raise ValueError("AI未能正确响应，请重试")
        return ContractAnalysisResponse(clause=response_json["clause"])

    except Exception as e:
        print(f"AI contract analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI合同分析失败: {str(e)}")


class OpponentAnalysisRequest(BaseModel):
    opponent_final_data: Dict[str, Any]


class OpponentAnalysisResult(BaseModel):
    claim_deconstruction: List[str] = Field(...,
                                            description="对原告核心诉请的法律构成要件拆解")
    factual_weaknesses: List[str] = Field(...,
                                          description="原告事实陈述中存在的潜在弱点或模糊之处")
    rebuttal_strategies: List[str] = Field(..., description="针对性的反驳策略和下一步行动建议")


@router.post("/analyze-opponent-document", response_model=OpponentAnalysisResult)
async def analyze_opponent_document(
    request: OpponentAnalysisRequest,
    db: AsyncSession = Depends(database.get_db)
):
    """(已升级) 接收对方文书，进行要素解构与弱点分析"""

    opponent_text = format_final_data_to_text(request.opponent_final_data)
    doc_type = "起诉状" if "claimItems" in request.opponent_final_data else "答辩状"

    # (修改) 全新的、更强大的Prompt
    prompt = f"""
    你是一位顶级的诉讼策略分析师，你的任务是为被告深度剖析一份原告提交的“{doc_type}”，找出其中的逻辑和证据弱点，并提供专业的防御策略。

    **原告的文书内容:**
    ---
    {opponent_text}
    ---

    **你的任务 (必须严格按顺序和格式完成):**

    1.  **诉请要素解构 (claim_deconstruction):**
        识别出原告最核心的1-2个诉讼请求（例如“支付货款”、“赔偿损失”）。然后，将每个核心诉请拆解成法律上成立所必须满足的构成要件。用简单明了的语言列出这些要件，让当事人明白原告需要证明哪些东西才能胜诉。

    2.  **事实陈述的潜在弱点 (factual_weaknesses):**
        审查原告的“事实与理由”部分，找出所有表述模糊、缺乏具体细节、自相矛盾、或听起来难以用证据证明的地方。

    3.  **反驳策略建议 (rebuttal_strategies):**
        结合前两部分的分析，为被告提供具体、可操作的反驳策略。策略可以包括：要求原告释明、指出其举证责任、提出诉讼时效抗辩、从事实层面直接反驳等。

    **输出格式 (必须严格遵守JSON格式，不要有任何额外解释):**
    {{
      "claim_deconstruction": [
        "【要件一：例如，'要支持支付货款，原告需证明：1. 双方存在合法有效的买卖合同。'】",
        "【要件二：例如，'2. 原告已按合同约定交付了合格的货物。'】",
        "【要件三：例如，'3. 被告有支付货款的义务且尚未支付。'】"
      ],
      "factual_weaknesses": [
        "【弱点一：例如，'原告在事实陈述中仅提到“多次催告”，但未说明具体的催告时间、方式和内容。'】",
        "【弱点二：例如，'原告主张货物有质量问题，但未描述具体的瑕疵表现和发现时间。'】"
      ],
      "rebuttal_strategies": [
        "【策略一：例如，'要求原告明确其主张违约金所依据的具体合同条款。'】",
        "【策略二：例如，'如果我方有证据证明已支付部分款项，应在答辩状中明确提出，并附上转账凭证。'】",
        "【策略三：例如，'针对原告主张的损失，要求其提供计算明细和相应的证据来证明损失的实际发生。'】"
      ]
    }}
    """
    try:
        response_json = await get_ai_json_response(prompt, db)
        return OpponentAnalysisResult(**response_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI对抗分析失败: {str(e)}")

    # --- API 1: AI立案要素审查 ---


class FilingAnalysisRequest(BaseModel):
    claim_final_data: Dict[str, Any]


class FilingAnalysisResult(BaseModel):
    meets_requirements: bool = Field(..., description="是否基本满足立案要素")
    missing_elements: List[str] = Field(..., description="缺失或不明确的关键要素列表")
    suggestions: List[str] = Field(..., description="对立案审查员的建议或需要注意的点")
    summary: str = Field(..., description="案件核心诉请的简要总结")


@router.post("/analyze-for-filing", response_model=FilingAnalysisResult)
async def analyze_for_filing(
    request: FilingAnalysisRequest,
    db: AsyncSession = Depends(database.get_db),
    user: dict = Depends(get_current_user)
):
    """接收起诉状数据，AI分析其是否满足立案基本要素"""
    claim_text = format_final_data_to_text(request.claim_final_data)

    prompt = f"""
    你是一名经验丰富的立案庭法官，任务是审查一份由民众撰写的起诉状，判断其是否满足基本的立案要素。

    **立案审查核心要素:**
    1.  **明确的原告和被告:** 当事人信息是否齐全（姓名/名称、地址、联系方式）？
    2.  **具体的诉讼请求:** 诉请是否明确、具体，而不是模糊、笼统的？
    3.  **事实与理由:** 陈述的事实是否与诉讼请求具有直接关联性？
    4.  **属于人民法院受理民事诉讼的范围和受诉人民法院管辖。**

    **待审查的起诉状内容:**
    ---
    {claim_text}
    ---

    **你的任务:**
    请基于上述内容，进行分析并严格按以下JSON格式返回。

    **输出格式:**
    {{
      "meets_requirements": "【布尔值: true 或 false。仅当所有核心要素都基本满足时才为true】",
      "missing_elements": [
        "【缺失点一：例如，'被告信息不完整，缺少明确的送达地址。'】",
        "【缺失点二：例如，'诉讼请求第二项“要求赔偿一切损失”过于笼统，不够具体。'】"
      ],
      "suggestions": [
        "【建议一：例如，'建议联系原告，要求其补充被告的详细身份信息。'】",
        "【建议二：例如，'建议告知原告需将其中的精神损害赔償部分明确为具体金额。'】"
      ],
      "summary": "【用一句话总结本案的核心诉求，例如：'本案是一起因拖欠货款引发的买卖合同纠纷。'】"
    }}
    """
    try:
        response_json = await get_ai_json_response(prompt, db)
        return FilingAnalysisResult(**response_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI立案审查分析失败: {str(e)}")


# --- API 2: AI法官助理深度分析 ---
class JudgeAnalysisRequest(BaseModel):
    claim_final_data: Dict[str, Any]
    defense_final_data_list: List[Dict[str, Any]] = []


class JudgeAnalysisResult(BaseModel):
    case_summary: str = Field(..., description="案情摘要，高度概括双方的核心诉求与抗辩")
    dispute_focus: List[str] = Field(..., description="梳理出的核心争议焦点")
    fact_timeline: List[str] = Field(..., description="按时间顺序梳理的关键事实时间线")
    mediation_points: List[str] = Field(...,
                                        description="基于双方诉求，提出的可能调解切入点或方案建议")


@router.post("/analyze-for-judge", response_model=JudgeAnalysisResult)
async def analyze_for_judge(
    request: JudgeAnalysisRequest,
    db: AsyncSession = Depends(database.get_db)
):
    """接收起诉状和多份答辩状，生成一份给法官的深度分析报告"""
    claim_text = format_final_data_to_text(request.claim_final_data)
    
    # (修改) 拼接所有答辩状的内容
    defense_texts = []
    if request.defense_final_data_list:
        for i, defense_data in enumerate(request.defense_final_data_list):
            # 从答辩状的当事人信息中找到答辩人名字
            defendant_name = "未知被告"
            party_info = defense_data.get("partyInfo", [])
            for party in party_info:
                if '答辩人' in party.get('role', ''):
                    name_match = re.search(r"名称:\s*([^\n]+)", party.get('details', ''))
                    if name_match:
                        defendant_name = name_match.group(1).strip()
                        break
            
            defense_texts.append(f"--- 被告({defendant_name})的答辩状 {i+1} ---\n{format_final_data_to_text(defense_data)}")
    
    full_defense_text = "\n\n".join(defense_texts) if defense_texts else "（所有被告均未提交答辩状）"

    prompt = f"""
    你是一名顶级的法官助理，你的任务是为法官准备一份高度浓缩、直击要害的案件分析报告。

    **原告起诉状:**
    ---
    {claim_text}
    ---

    **被告答辩状:**
    ---
    {full_defense_text}
    ---

    **你的任务 (请像写给法官报告一样，语言精炼、专业、客观):**
    1.  **案情摘要 (case_summary):** 用不超过200字，概括本案的当事人、基本事实、原告诉请和被告的核心抗辩。
    2.  **争议焦点 (dispute_focus):** 综合双方诉辩意见，提炼出本案最核心的1-3个法律或事实上的争议焦点。
    3.  **关键事实时间线 (fact_timeline):** 从双方的陈述中提取所有带日期的关键事件，并按时间先后顺序排列。
    4.  **调解切入点 (mediation_points):** 基于双方的诉求差距和事实陈述，提出1-2个可能的调解方向或方案建议。

    **输出格式 (必须严格遵守JSON):**
    {{
        "case_summary": "【这里是高度浓缩的案情摘要】",
        "dispute_focus": [
            "【争议焦点一：例如，案涉《买卖合同》的效力问题。】",
            "【争议焦点二：例如，被告提出的货物质量问题是否成立。】"
        ],
        "fact_timeline": [
            "【时间点一：例如，'2023-05-10: 双方签订合同。'】",
            "【时间点二：例如，'2023-06-15: 原告向被告交付货物。'】"
        ],
        "mediation_points": [
            "【调解建议一：例如，'双方对合同本金争议不大，可围绕违约金的计算标准进行调解。'】",
            "【调解建议二：例如，'考虑被告提出的质量问题，建议原告可适当折让部分货款以达成和解。'】"
        ]
    }}
    """
    try:
        response_json = await get_ai_json_response(prompt, db)
        return JudgeAnalysisResult(**response_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI法官助理分析失败: {str(e)}")

class QuickScanRequest(BaseModel):
    text: str
    context: str # 告诉AI这是哪个字段的内容

class QuickScanResponse(BaseModel):
    has_risk: bool
    feedback: str # 如果有风险，具体的提示信息

class AutoCompleteRequest(BaseModel):
    text_before_cursor: str
    context: str

class AutoCompleteResponse(BaseModel):
    suggestion: str # AI续写的建议

# --- 新API路由 ---

@router.post("/quick-scan", response_model=QuickScanResponse)
async def quick_scan_for_risks(
    request: QuickScanRequest, 
    db: AsyncSession = Depends(database.get_db)
):
    """(快速模型) 分析单段文本是否存在法律风险"""
    prompt = f"""
    你是一名严谨的、正在实时审查法律文书的AI助理。你的任务是快速扫描用户输入的文本片段，并判断其中是否存在明显的法律风险、逻辑矛盾或不当表述。

    [审查背景]: 用户正在填写 "{request.context}" 部分。
    [用户输入文本]: "{request.text}"

    **你的任务:**
    1.  如果文本**没有明显问题**，返回 `has_risk: false`。
    2.  如果文本**存在问题**，返回 `has_risk: true` 并给出一条简洁、明确的提示 `feedback`。
    
    **输出格式 (必须严格遵守JSON):**
    {{
      "has_risk": "【布尔值: true 或 false】",
      "feedback": "【如果没有风险，这里是空字符串。如果有风险，这里是具体的提示，例如：'您主张的利息可能超过了法定上限，建议核实计算标准。'】"
    }}
    """
    try:
        flag = await database.get_feature_flag_by_key(db, "risk_analysis")
        if not flag or not flag.is_enabled:
            return QuickScanResponse(has_risk=False, feedback="AI风险预警功能当前已禁用。")
        response = await get_ai_json_response(prompt, db, model_type="fast")
        return QuickScanResponse(**response)
    except Exception:
        # 如果快速模型失败，静默处理，不打扰用户
        return QuickScanResponse(has_risk=False, feedback="")


@router.post("/autocomplete", response_model=AutoCompleteResponse)
async def autocomplete_text(
    request: AutoCompleteRequest,
    db: AsyncSession = Depends(database.get_db)
):
    """(快速模型) 根据上下文进行文本续写"""
    prompt = f"""
    你是一名高效的法律文书AI续写助手。你的任务是根据用户已经输入的内容，无缝地、逻辑连贯地续写下一句话或下一个短语。

    [续写背景]: 用户正在填写 "{request.context}" 部分。
    [光标前的内容]:
    ---
    {request.text_before_cursor}
    ---
    
    **你的任务:**
    请提供一段最有可能的、自然的续写建议。建议内容应该简洁，通常不超过一句话。不要重复用户已输入的内容。

    **输出格式 (必须严格遵守JSON):**
    {{
      "suggestion": "【这里是AI续写的文本】"
    }}
    """
    try:
        flag = await database.get_feature_flag_by_key(db, "autocomplete")
        if not flag or not flag.is_enabled:
            return AutoCompleteResponse(suggestion="")
        response = await get_ai_json_response(prompt, db, model_type="fast")
        return AutoCompleteResponse(**response)
    except Exception as e:
        # 如果快速模型失败，静默处理，不打扰用户
        print("自动续写失败: ", e)
        return AutoCompleteResponse(suggestion="")
