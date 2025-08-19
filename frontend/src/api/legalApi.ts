// src/api/legalApi.ts
import { isAxiosError } from "axios";
import apiClient from "./axiosConfig";
import toast from "react-hot-toast";
import type { LegalBasisItem } from "../interfaces/base.types";
import type { FinalDataObject } from "../interfaces/document.types";

interface ContractAnalysisResult {
  clause: string;
}

// --- 新增类型定义 ---
export interface ObjectionAnalysisResponse {
  plaintiff_claim_summary: string;
  objection_suggestions: string[];
}

// interface LegalAnalysisRequest {
//   content: string; // 改为接收纯文本内容
// }

export const fetchStructuredLegalAnalysis = async (
  content: string
): Promise<LegalBasisItem[]> => {
  try {
    const response = await apiClient.post(
      `/api/legal/analyze-regulations-structured`,
      { content }
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

interface ContractAnalysisResult {
  clause: string;
}

export const fetchContractAnalysis = async (
  file: File,
  formContent: string
): Promise<ContractAnalysisResult> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("content", formContent);

  try {
    const response = await apiClient.post<ContractAnalysisResult>(
      `/api/legal/analyze-contract-clause`, // Example new endpoint
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
 * @param plaintiffClaim - 原告的单项诉讼请求内容
 * @param objectionTitle - 被告正在回应的答辩事项标题
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

export interface AdjudicationResult {
  completeness_score: number;
  completeness_feedback: string;
  legal_risk_analysis: string[];
  expression_suggestions: string[];
  overall_assessment: string;
}

/**
 * 请求AI对预览的文书进行全面研判
 * @param finalData - 完整的、用于生成文档的预览数据
 * @param documentType - 文书类型, "起诉状" 或 "答辩状"
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

export interface OpponentAnalysisResult {
  claim_deconstruction: string[];
  factual_weaknesses: string[];
  rebuttal_strategies: string[];
}

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

export interface QuickScanResponse {
  has_risk: boolean;
  feedback: string;
}

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

export interface AutoCompleteResponse {
  suggestion: string;
}

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
