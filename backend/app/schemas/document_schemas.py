from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Literal, Union

class DocxListItem(BaseModel):
    role: str
    details: str

class QuestionListItem(BaseModel):
    question: str
    answers: str

# ==============================================================================
#  1. 为每一种列表项创建专属、精确的模型
# ==============================================================================

# 模型 for partyInfo
class PartyInfoItem(BaseModel):
    role: str
    details: str

# 模型 for claimItems
class ClaimItem(BaseModel):
    question: str
    answers: str

# 模型 for factItems
class FactItem(BaseModel):
    question: str
    answers: str

# 模型 for relatedCaseInfo
class RelatedCaseItem(BaseModel):
    question: str
    answers: str

# 模型 for mediationInfo
class MediationItem(BaseModel):
    question: str
    answers: str

class ClaimFinalData(BaseModel):
    case_type: Optional[str] = None
    case_number: Optional[str] = None
    partyInfo: List[DocxListItem]
    claimItems: List[QuestionListItem]
    factItems: List[QuestionListItem]
    mediationInfo: List[QuestionListItem]
    # 可能没有 relatedCaseInfo，设为可选
    relatedCaseInfo: Optional[List[QuestionListItem]] = None
    jurisdictionAndPreservation: Optional[List[QuestionListItem]] = None
    pretrialPreservation: Optional[List[QuestionListItem]] = None


# --- 答辩状的 FinalData 模型 ---
class DefenseFinalData(BaseModel):
    case_type: Optional[str] = None
    case_number: Optional[str] = None
    partyInfo: List[DocxListItem]
    defenseItems: List[QuestionListItem]
    factItems: Optional[List[QuestionListItem]] = None
    mediationInfo: List[QuestionListItem]
    # 可能没有 relatedCaseInfo，设为可选
    relatedCaseInfo: Optional[List[QuestionListItem]] = None

class DocumentPayload(BaseModel):
    formData: Dict[str, Any]
    final: Union[ClaimFinalData, DefenseFinalData]

class DocumentGenerationRequest(BaseModel):
    document_type: str
    case_number: Optional[str] = None
    payload: DocumentPayload


class ChatMessage(BaseModel):
    # OpenAI API接受 'system', 'user', 'assistant' 三种角色
    role: Literal["system", "user", "assistant"]
    content: str


class AIQueryRequest(BaseModel):
    # history 是一个包含过去所有消息的列表
    history: List[ChatMessage]

class LegalAnalysisRequest(BaseModel):
    claims: str
    facts: str

class EvidenceItem(BaseModel):
    id: str = Field(..., description="证据序号")
    name: str = Field(..., description="证据名称")
    source: str = Field(..., description="证据来源")
    proof_point: str = Field(..., description="拟证明事项")
    page: Optional[str] = Field(None, description="页码或位置")

class EvidenceChecklistResponse(BaseModel):
    evidence_list: List[EvidenceItem]
    why: str = Field(..., description="为何需要这些证据的说明")

class EvidenceChecklistRequest(BaseModel):
    claims: str   # 诉讼请求或答辩事项的完整陈述
    facts: str    # 事实与理由的完整陈述
    doc_type: str # "起诉状" 或 "答辩状"