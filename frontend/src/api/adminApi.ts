// import axios from 'axios';
import type { FinalDataObject } from '../interfaces/document.types';
import apiClient from './axiosConfig';


// --- AI立案审查 ---
export interface FilingAnalysisResult {
    meets_requirements: boolean;
    missing_elements: string[];
    suggestions: string[];
    summary: string;
}

/**
 * 对案件数据进行立案审查分析
 * @param claimData - 起诉案件的最终数据对象
 * @returns 包含分析结果的Promise对象，包括是否符合要求、缺少要素、建议和摘要
 */
export const analyzeForFiling = async (claimData: FinalDataObject): Promise<FilingAnalysisResult> => {
    const response = await apiClient.post(`/api/legal/analyze-for-filing`, {
        claim_final_data: claimData
    });
    return response.data;
};

// --- AI法官助理深度分析 ---
export interface JudgeAnalysisResult {
    case_summary: string;
    dispute_focus: string[];
    fact_timeline: string[];
    mediation_points: string[];
}

/**
 * 对案件数据进行法官助理深度分析
 * @param claimData - 起诉案件的最终数据对象
 * @param defenseDataList - 答辩案件的最终数据对象数组
 * @returns 包含案件摘要、争议焦点、事实时间线和调解要点的Promise对象
 */
export const analyzeForJudge = async (
  claimData: FinalDataObject, 
  defenseDataList: FinalDataObject[] 
): Promise<JudgeAnalysisResult> => {
    const response = await apiClient.post(`/api/legal/analyze-for-judge`, { 
        claim_final_data: claimData,
        defense_final_data_list: defenseDataList 
    });
    return response.data;
};

// --- 修改案号 ---
/**
 * 更新案件的案号
 * @param caseId - 案件ID
 * @param newCaseNumber - 新的案号
 * @returns 包含操作结果消息的Promise对象
 */
export const updateCaseNumber = async (caseId: number, newCaseNumber: string): Promise<{ message: string }> => {
    const response = await apiClient.patch(`/api/cases/${caseId}/case-number`, {
        new_case_number: newCaseNumber
    });
    return response.data;
};

export interface AIModel {
    id: number;
    model_name: string;
    api_key: string;
    base_url: string;
    description?: string;
    capabilities: string[];
    is_active_general: boolean;
    is_active_vision: boolean;
    is_active_fast: boolean;
    temperature?: number | null;
    top_p?: number | null;
    max_tokens?: number | null;
}

export interface AIModelCreatePayload {
    model_name: string;
    api_key: string;
    base_url: string;
    description?: string;
    capabilities: string[];
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
}

export type AIModelUpdatePayload = Partial<Omit<AIModelCreatePayload, 'api_key'>>;

/**
 * 获取所有AI模型列表
 * @returns 包含所有AI模型信息的Promise对象数组
 */
export const fetchAIModels = async (): Promise<AIModel[]> => {
    const { data } = await apiClient.get(`/api/admin/ai-models`);
    return data;
};

/**
 * 创建新的AI模型
 * @param model - AI模型创建参数对象
 * @returns 包含创建的AI模型信息的Promise对象
 */
export const createAIModel = async (model: AIModelCreatePayload): Promise<AIModel> => {
    const { data } = await apiClient.post(`/api/admin/ai-models`, model);
    return data;
};

/**
 * 删除指定ID的AI模型
 * @param id - 要删除的AI模型ID
 * @returns 包含操作结果消息的Promise对象
 */
export const deleteAIModel = async (id: number): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/api/admin/ai-models/${id}`);
    return data;
};

/**
 * 设置指定ID和类型的AI模型为激活状态
 * @param id - AI模型ID
 * @param modelType - 模型类型
 * @returns 包含操作结果消息的Promise对象
 */
export const setActiveAIModel = async (id: number, modelType: string): Promise<{ message: string }> => {
    const { data } = await apiClient.patch(`/api/admin/ai-models/${id}/set-active`, {
        model_type: modelType 
    });
    return data;
};

/**
 * 更新指定ID的AI模型信息
 * @param id - AI模型ID
 * @param model - AI模型更新参数对象
 * @returns 包含更新后的AI模型信息的Promise对象
 */
export const updateAIModel = async (id: number, model: AIModelUpdatePayload): Promise<AIModel> => {
    const { data } = await apiClient.put(`/api/admin/ai-models/${id}`, model);
    return data;
};

/**
 * 停用指定类型的AI模型
 * @param modelType - 要停用的模型类型
 * @returns 包含操作结果消息的Promise对象
 */
export const deactivateAIModel = async (modelType: string): Promise<{ message: string }> => {
    const { data } = await apiClient.patch(`/api/admin/ai-models/deactivate`, {
        model_type: modelType
    });
    return data;
};