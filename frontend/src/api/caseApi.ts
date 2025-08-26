// src/api/caseApi.ts
import { isAxiosError } from "axios";
import apiClient from "./axiosConfig";
import toast from "react-hot-toast";
import type {
  DocxListItem,
  QuestionListItem
} from "../interfaces/document.types";

// ==================== 类型定义 ====================

/**
 * 文书基本信息接口
 */
export interface DocumentInfo {
  /**
   * 文书ID
   */
  id: number;
  
  /**
   * 案号
   */
  case_number: string;
  
  /**
   * 文书类型
   */
  document_type: "起诉状" | "答辩状";
  
  /**
   * 创建时间
   */
  created_at: string;
}

/**
 * 完整文书数据接口
 */
export interface FullDocumentData {
  /**
   * 文书ID
   */
  id: number;
  
  /**
   * 案件ID
   */
  case_id: number;
  
  /**
   * 文书类型
   */
  document_type: "起诉状" | "答辩状";
  
  /**
   * 版本号
   */
  version: number;
  
  /**
   * 是否为最新版本
   */
  is_latest: boolean;
  
  /**
   * 创建时间
   */
  created_at: string;
  
  /**
   * 表单数据
   */
  form_data: any;
  
  /**
   * 最终数据
   */
  final_data: {
    /**
     * 案件类型
     */
    case_type?: string;
    
    /**
     * 案号
     */
    case_number?: string;
    
    /**
     * 当事人信息
     */
    partyInfo?: DocxListItem[];
    
    /**
     * 诉讼请求项
     */
    claimItems?: QuestionListItem[];
    
    /**
     * 事实项
     */
    factItems?: QuestionListItem[];
    
    /**
     * 答辩事项
     */
    defenseItems?: DocxListItem[];
    
    /**
     * 事实与理由
     */
    factsAndReasons?: DocxListItem[];
    
    /**
     * 调解信息
     */
    mediationInfo?: DocxListItem[];
    
    /**
     * 关联案件信息
     */
    relatedCaseInfo?: DocxListItem[];
  };
}

/**
 * AI分析结果接口
 */
export interface AnalysisResult {
  /**
   * 初步判断
   */
  preliminary_judgment: string;
  
  /**
   * 关键争议点
   */
  key_disputes: string[];
  
  /**
   * 针对原告的问题
   */
  questions_for_plaintiff: string[];
  
  /**
   * 针对被告的问题
   */
  questions_for_defendant: string[];
  
  /**
   * 证据薄弱环节
   */
  evidence_weaknesses: string[];
  
  /**
   * 法律难点
   */
  legal_difficulties: string;
}

/**
 * 案件项接口
 */
export interface CaseItem {
  /**
   * 案件ID
   */
  id: number;
  
  /**
   * 案号
   */
  case_number: string;
  
  /**
   * 案由
   */
  case_cause: string;
  
  /**
   * 原告
   */
  plaintiff: string;
  
  /**
   * 被告
   */
  defendant: string;
  
  /**
   * 创建时间
   */
  created_at: string;
  
  /**
   * 更新时间
   */
  updated_at: string;
  
  /**
   * 状态
   */
  status: "进行中" | "已完成" | "已暂停";
  
  /**
   * 文书数量
   */
  document_count: number;
}

/**
 * 案件详情接口
 */
export interface CaseDetails {
  /**
   * 案件信息
   */
  case_info: {
    /**
     * 案件ID
     */
    id: number;
    
    /**
     * 案号
     */
    case_number: string;
    
    /**
     * 案由
     */
    case_cause: string;
    
    /**
     * 原告代码
     */
    plaintiff_code: string;
  };
  
  /**
   * 被告列表
   */
  defendants: {
    /**
     * 被告ID
     */
    id: number;
    
    /**
     * 被告名称
     */
    name: string;
    
    /**
     * 验证码
     */
    verification_code: string;
  }[];
  
  /**
   * 文书列表
   */
  documents: FullDocumentData[];
}

// ==================== 案件API接口 ====================

/**
 * 根据案号获取该案件下的所有文书版本
 * @param caseNumber 案件编号
 * @returns 案件详情
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
 * @param claimFinalData 选中的起诉状的 final_data 对象
 * @param defenseFinalData 选中的答辩状的 final_data 对象
 * @returns AI分析结果
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
 * 获取所有案件，支持多维度搜索
 * @param searchTerm 关键词 (案号, 案由, 当事人)
 * @param caseCause 案由筛选
 * @returns 案件列表
 */
export const fetchAllCases = async (searchTerm?: string, caseCause?: string): Promise<CaseItem[]> => {
  try {
    const params = {
        search_term: searchTerm || undefined,
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
