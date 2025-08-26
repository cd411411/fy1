// src/api/legalApi.ts
import { isAxiosError } from "axios";
import apiClient from "./axiosConfig";
import toast from "react-hot-toast";
import type { LegalBasisItem } from "../interfaces/base.types";
import type { FinalDataObject } from "../interfaces/document.types";

// ==================== 类型定义 ====================
/**
 * 合同分析结果接口
 */
interface ContractAnalysisResult {
  /**
   * 条款内容
   */
  clause: string;
}

/**
 * 异议分析响应接口
 */
export interface ObjectionAnalysisResponse {
  /**
   * 原告请求摘要
   */
  plaintiff_claim_summary: string;
  
  /**
   * 异议建议列表
   */
  objection_suggestions: string[];
}

/**
 * 裁判结果接口
 */
export interface AdjudicationResult {
  /**
   * 完整性评分
   */
  completeness_score: number;
  
  /**
   * 完整性反馈
   */
  completeness_feedback: string;
  
  /**
   * 法律风险分析
   */
  legal_risk_analysis: string[];
  
  /**
   * 表达建议
   */
  expression_suggestions: string[];
  
  /**
   * 总体评估
   */
  overall_assessment: string;
}

/**
 * 对手分析结果接口
 */
export interface OpponentAnalysisResult {
  /**
   * 请求解构
   */
  claim_deconstruction: string[];
  
  /**
   * 事实薄弱环节
   */
  factual_weaknesses: string[];
  
  /**
   * 反驳策略
   */
  rebuttal_strategies: string[];
}

/**
 * 快速扫描响应接口
 */
export interface QuickScanResponse {
  /**
   * 是否有风险
   */
  has_risk: boolean;
  
  /**
   * 反馈信息
   */
  feedback: string;
}

/**
 * 自动完成响应接口
 */
export interface AutoCompleteResponse {
  /**
   * 建议内容
   */
  suggestion: string;
}

// ==================== 法律分析接口 ====================
/**
 * 获取结构化法律分析
 * @param content 分析内容
 * @returns 法律依据项列表
 */
export const fetchStructuredLegalAnalysis = async (
  content: string,
  caseCause?: string
): Promise<LegalBasisItem[]> => {
  try {
    const response = await apiClient.post(
      `/api/legal/analyze-regulations-structured`,
      { content, case_cause: caseCause  }
    );
    // 返回 "analysis" 键下的数组
    return response.data.analysis || [];
  } catch (error) {
    const errorMessage =
      isAxiosError(error) && error.response?.data?.detail
        ? error.response.data.detail
        : "法律依据分析请求失败。";
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * 获取合同分析结果
 * @param file 文件
 * @param formContent 表单内容
 * @returns 合同分析结果
 */
export const fetchContractAnalysis = async (
  file: File,
  formContent: string
): Promise<ContractAnalysisResult> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("content", formContent);

  try {
    const response = await apiClient.post<ContractAnalysisResult>(
      `/api/legal/analyze-contract-clause`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      isAxiosError(error) && error.response?.data?.detail
        ? error.response.data.detail
        : "合同分析请求失败。";
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * 请求AI分析针对特定诉请的异议点
 * @param plaintiffClaim 原告的单项诉讼请求内容
 * @param objectionTitle 被告正在回应的答辩事项标题
 * @returns 包含异议点建议的字符串数组
 */
export const analyzeObjectionPoints = async (
  plaintiffClaim: string,
  objectionTitle: string
): Promise<ObjectionAnalysisResponse> => {
  // 返回整个对象
  try {
    const response = await apiClient.post<ObjectionAnalysisResponse>(
      `/api/legal/analyze-objection-points`,
      {
        plaintiff_claim: plaintiffClaim,
        objection_title: objectionTitle,
      }
    );
    return response.data; // 直接返回整个 data 对象
  } catch (error) {
    const errorMessage =
      isAxiosError(error) && error.response?.data?.detail
        ? error.response.data.detail
        : "AI异议点分析请求失败。";
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * 请求AI对预览的文书进行全面研判
 * @param finalData 完整的、用于生成文档的预览数据
 * @param documentType 文书类型, "起诉状" 或 "答辩状"
 * @returns 结构化的研判报告
 */
export const adjudicateDocument = async (
  finalData: FinalDataObject,
  documentType: "起诉状" | "答辩状"
): Promise<AdjudicationResult> => {
  try {
    const response = await apiClient.post<AdjudicationResult>(
      `/api/legal/adjudicate-document`,
      {
        final_data: finalData,
        document_type: documentType,
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      isAxiosError(error) && error.response?.data?.detail
        ? error.response.data.detail
        : "AI研判请求失败。";
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * 分析对手文档
 * @param opponentFinalData 对手最终数据
 * @returns 对手分析结果
 */
export const analyzeOpponentDocument = async (
  opponentFinalData: FinalDataObject
): Promise<OpponentAnalysisResult> => {
  try {
    const response = await apiClient.post<OpponentAnalysisResult>(
      `/api/legal/analyze-opponent-document`,
      { opponent_final_data: opponentFinalData }
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      isAxiosError(error) && error.response?.data?.detail
        ? error.response.data.detail
        : "AI对抗分析请求失败。";
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * 快速扫描文本
 * @param text 文本内容
 * @param context 上下文
 * @returns 扫描结果
 */
export const quickScanText = async (
  text: string,
  context: string
): Promise<QuickScanResponse> => {
  const { data } = await apiClient.post<QuickScanResponse>(
    "/api/legal/quick-scan",
    { text, context }
  );
  return data;
};

/**
 * 获取自动完成建议
 * @param text_before_cursor 光标前的文本
 * @param context 上下文
 * @returns 自动完成响应
 */
export const fetchAutocomplete = async (
  text_before_cursor: string,
  context: string
): Promise<AutoCompleteResponse> => {
  const { data } = await apiClient.post<AutoCompleteResponse>(
    "/api/legal/autocomplete",
    { text_before_cursor, context }
  );
  return data;
};