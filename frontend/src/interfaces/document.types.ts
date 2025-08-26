/**
 * 用于描述 docxtpl 模板中“当事人”或“代理人”这类以角色为键的列表项。
 */
export interface PartyListItem {
  role: string;
  details: string;
  
}

/**
 * 用于描述 docxtpl 模板中“诉讼请求”、“事实理由”这类问答式的列表项。
 */
export interface QuestionListItem {
  question: string;
  answers: string;
}

/**
 * 一个联合类型。
 */
export type DocxListItem = PartyListItem | QuestionListItem;

/**
 * 描述 Agent Profile 在 localStorage 中的结构。
 */
export interface AgentProfile {
  id: string;
  agentName?: string;
  agentUnit?: string;
  agentTitle?: string;
  agentPhone?: string;
  agentAuthorityType?: '一般授权' | '特别授权';
  agentAuthorityDetails?: string;
}

export interface ApplicationSection {
  title: string, 
  items: QuestionListItem[]
}

export interface FinalDataObject {
  case_type?: string;
  case_number?: string;
  partyInfo: DocxListItem[];
  relatedCaseInfo?: DocxListItem[]; // 设为可选
  mediationInfo?: DocxListItem[];   // 设为可选

  // --- 起诉状专属字段 ---
  claimItems?: QuestionListItem[]; 
  factItems?: QuestionListItem[];
  pretrialPreservation?: QuestionListItem[];
  jurisdictionAndPreservation? : QuestionListItem[];
  jurisdictionPreservationAppraisal? : QuestionListItem[];
  preservationAndAppraisal? : QuestionListItem[];

  // --- 答辩状专属字段 ---
  defenseItems?: QuestionListItem[];
  factsAndReasons?: QuestionListItem[];

  // --- 申请书专属字段 ---
  sections?: ApplicationSection[];
}

interface SuccessClaimInfo {
  claims: string;
  facts: string;
}

interface ErrorInfo {
  error: string;
}

export type ClaimInfoResponse = SuccessClaimInfo | ErrorInfo;
// 你未来可以把所有与文档生成相关的共享类型都放在这里。