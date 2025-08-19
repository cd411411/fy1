// src/api/caseApi.ts
import { isAxiosError } from "axios";
import apiClient from "./axiosConfig";
import toast from "react-hot-toast";
import type {
  DocxListItem,
  QuestionListItem
} from "../interfaces/document.types";

// ==============================================================================
//  类型定义 (与后端 Pydantic 模型对应)
// ==============================================================================

// 单个文书的基本信息
export interface DocumentInfo {
  id: number;
  case_number: string;
  document_type: "起诉状" | "答辩状";
  created_at: string;
  // 我们在列表页不需要完整的form_data和final_data
}

// 案件详情页获取的单个文书的完整数据
export interface FullDocumentData {
  id: number;
  case_id: number;
  document_type: "起诉状" | "答辩状";
  version: number;
  is_latest: boolean;
  created_at: string;
  form_data: any; // 原始表单数据，保持为 any
  // final_data 应该匹配起诉状或答辩状的结构
  final_data: {
    case_type?: string;
    case_number?: string;
    partyInfo?: DocxListItem[];
    claimItems?: QuestionListItem[];
    factItems?: QuestionListItem[];
    defenseItems?: DocxListItem[];
    factsAndReasons?: DocxListItem[];
    mediationInfo?: DocxListItem[];
    relatedCaseInfo?: DocxListItem[];
  };
}

// AI分析请求的返回结果类型
export interface AnalysisResult {
  preliminary_judgment: string;
  key_disputes: string[];
  questions_for_plaintiff: string[];
  questions_for_defendant: string[];
  evidence_weaknesses: string[];
  legal_difficulties: string;
}

// --- 类型定义 ---
export interface CaseItem {
  id: number;
  case_number: string;
  case_cause: string;
  plaintiff: string;
  defendant: string;
  created_at: string;
  updated_at: string;
  status: "进行中" | "已完成" | "已暂停";
  document_count: number;
}

export interface CaseDetails {
  case_info: {
    id: number;
    case_number: string;
    case_cause: string;
    plaintiff_code: string;
  };
  defendants: {
    id: number;
    name: string;
    verification_code: string;
  }[];
  documents: FullDocumentData[];
}

// ==============================================================================
//  API 调用函数
// ==============================================================================

/**
 * 根据案号获取该案件下的所有文书版本
 * @param caseNumber - 案件编号
 */
export const fetchDocumentsForCase = async (caseNumber: string): Promise<CaseDetails> => {
    try {
        const { data } = await apiClient.get<CaseDetails>(`/api/cases/${caseNumber}/documents`);
        return data;
    } catch (error) {
        const errorMessage = `加载案件详情失败:${error}`;
        toast.error(errorMessage);
        throw new Error(errorMessage);
    }
};

/**
 * 将起诉状和答辩状数据发送给后端进行AI分析
 * @param claimFinalData - 选中的起诉状的 final_data 对象
 * @param defenseFinalData - 选中的答辩状的 final_data 对象
 */
export const analyzeCase = async (
  claimFinalData: any,
  defenseFinalData: any
): Promise<AnalysisResult> => {
  try {
    const response = await apiClient.post(`/api/legal/analyze-case`, {
      claim_final_data: claimFinalData,
      defense_final_data: defenseFinalData,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to analyze case:", error);
    const errorMessage =
      isAxiosError(error) && error.response?.data?.detail
        ? `分析失败: ${error.response.data.detail}`
        : "AI判案分析请求失败。";
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * (已升级) 获取所有案件，支持多维度搜索
 * @param searchTerm - 关键词 (案号, 案由, 当事人)
 * @param caseCause - 案由筛选
 */
export const fetchAllCases = async (searchTerm?: string, caseCause?: string): Promise<CaseItem[]> => {
  try {
    const params = {
        search_term: searchTerm || undefined, // 如果为空字符串则不发送
        case_cause: caseCause || undefined,
    };
    const { data } = await apiClient.get<CaseItem[]>('/api/cases/', { params });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    const errorMessage = `加载案件列表失败:${error}`;
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
};
