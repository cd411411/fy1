// src/api/adminApi.ts
import type { FinalDataObject } from "../interfaces/document.types";
import apiClient from "./axiosConfig";

// ==================== AI立案审查相关类型和接口 ====================
/**
 * 立案审查分析结果接口
 */
export interface FilingAnalysisResult {
  /**
   * 是否符合立案要求
   */
  meets_requirements: boolean;
  
  /**
   * 缺少的要素列表
   */
  missing_elements: string[];
  
  /**
   * 建议列表
   */
  suggestions: string[];
  
  /**
   * 案件摘要
   */
  summary: string;
}

/**
 * 对案件数据进行立案审查分析
 * @param claimData 起诉案件的最终数据对象
 * @returns 包含分析结果的Promise对象，包括是否符合要求、缺少要素、建议和摘要
 */
export const analyzeForFiling = async (
  claimData: FinalDataObject
): Promise<FilingAnalysisResult> => {
  const response = await apiClient.post(`/api/legal/analyze-for-filing`, {
    claim_final_data: claimData,
  });
  return response.data;
};

// ==================== AI法官助理深度分析相关类型和接口 ====================
/**
 * 法官助理深度分析结果接口
 */
export interface JudgeAnalysisResult {
  /**
   * 案件摘要
   */
  case_summary: string;
  
  /**
   * 争议焦点列表
   */
  dispute_focus: string[];
  
  /**
   * 事实时间线
   */
  fact_timeline: string[];
  
  /**
   * 调解要点
   */
  mediation_points: string[];
}

/**
 * 对案件数据进行法官助理深度分析
 * @param claimData 起诉案件的最终数据对象
 * @param defenseDataList 答辩案件的最终数据对象数组
 * @returns 包含案件摘要、争议焦点、事实时间线和调解要点的Promise对象
 */
export const analyzeForJudge = async (
  claimData: FinalDataObject,
  defenseDataList: FinalDataObject[]
): Promise<JudgeAnalysisResult> => {
  const response = await apiClient.post(`/api/legal/analyze-for-judge`, {
    claim_final_data: claimData,
    defense_final_data_list: defenseDataList,
  });
  return response.data;
};

// ==================== 案件管理相关接口 ====================
/**
 * 更新案件的案号
 * @param caseId 案件ID
 * @param newCaseNumber 新的案号
 * @returns 包含操作结果消息的Promise对象
 */
export const updateCaseNumber = async (
  caseId: number,
  newCaseNumber: string
): Promise<{ message: string }> => {
  const response = await apiClient.patch(`/api/cases/${caseId}/case-number`, {
    new_case_number: newCaseNumber,
  });
  return response.data;
};

// ==================== AI模型管理相关类型和接口 ====================
/**
 * AI模型接口
 */
export interface AIModel {
  /**
   * 模型ID
   */
  id: number;
  
  /**
   * 模型名称
   */
  model_name: string;
  
  /**
   * API密钥
   */
  api_key: string;
  
  /**
   * 基础URL
   */
  base_url: string;
  
  /**
   * 模型描述
   */
  description?: string;
  
  /**
   * 模型功能列表
   */
  capabilities: string[];
  
  /**
   * 是否激活为通用模型
   */
  is_active_general: boolean;
  
  /**
   * 是否激活为视觉模型
   */
  is_active_vision: boolean;
  
  /**
   * 是否激活为快速模型
   */
  is_active_fast: boolean;
  
  /**
   * 温度参数
   */
  temperature?: number | null;
  
  /**
   * Top P参数
   */
  top_p?: number | null;
  
  /**
   * 最大令牌数
   */
  max_tokens?: number | null;
}

/**
 * AI模型创建载荷接口
 */
export interface AIModelCreatePayload {
  /**
   * 模型名称
   */
  model_name: string;
  
  /**
   * API密钥
   */
  api_key: string;
  
  /**
   * 基础URL
   */
  base_url: string;
  
  /**
   * 模型描述
   */
  description?: string;
  
  /**
   * 模型功能列表
   */
  capabilities: string[];
  
  /**
   * 温度参数
   */
  temperature?: number;
  
  /**
   * Top P参数
   */
  top_p?: number;
  
  /**
   * 最大令牌数
   */
  max_tokens?: number;
}

/**
 * AI模型更新载荷类型
 */
export type AIModelUpdatePayload = Partial<
  Omit<AIModelCreatePayload, "api_key">
>;

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
 * @param model AI模型创建参数对象
 * @returns 包含创建的AI模型信息的Promise对象
 */
export const createAIModel = async (
  model: AIModelCreatePayload
): Promise<AIModel> => {
  const { data } = await apiClient.post(`/api/admin/ai-models`, model);
  return data;
};

/**
 * 删除指定ID的AI模型
 * @param id 要删除的AI模型ID
 * @returns 包含操作结果消息的Promise对象
 */
export const deleteAIModel = async (
  id: number
): Promise<{ message: string }> => {
  const { data } = await apiClient.delete(`/api/admin/ai-models/${id}`);
  return data;
};

/**
 * 设置指定ID和类型的AI模型为激活状态
 * @param id AI模型ID
 * @param modelType 模型类型
 * @returns 包含操作结果消息的Promise对象
 */
export const setActiveAIModel = async (
  id: number,
  modelType: string
): Promise<{ message: string }> => {
  const { data } = await apiClient.patch(
    `/api/admin/ai-models/${id}/set-active`,
    {
      model_type: modelType,
    }
  );
  return data;
};

/**
 * 更新指定ID的AI模型信息
 * @param id AI模型ID
 * @param model AI模型更新参数对象
 * @returns 包含更新后的AI模型信息的Promise对象
 */
export const updateAIModel = async (
  id: number,
  model: AIModelUpdatePayload
): Promise<AIModel> => {
  const { data } = await apiClient.put(`/api/admin/ai-models/${id}`, model);
  return data;
};

/**
 * 停用指定类型的AI模型
 * @param modelType 要停用的模型类型
 * @returns 包含操作结果消息的Promise对象
 */
export const deactivateAIModel = async (
  modelType: string
): Promise<{ message: string }> => {
  const { data } = await apiClient.patch(`/api/admin/ai-models/deactivate`, {
    model_type: modelType,
  });
  return data;
};

// ==================== AI使用统计相关类型和接口 ====================
/**
 * 使用数据接口
 */
export interface UsageData {
  /**
   * 提示词使用量
   */
  prompt: number;
  
  /**
   * 补全使用量
   */
  completion: number;
  
  /**
   * 总使用量
   */
  total: number;
}

/**
 * AI使用统计接口
 */
export interface AIUsageStats {
  /**
   * 总使用量
   */
  total_usage: UsageData;
  
  /**
   * 今日使用量
   */
  today_usage: UsageData;
  
  /**
   * 本月使用量
   */
  this_month_usage: UsageData;
  
  /**
   * 按模型统计
   */
  by_model: {
    /**
     * 模型名称
     */
    model_name: string;
    
    /**
     * 提示词令牌数
     */
    prompt_tokens: number;
    
    /**
     * 补全令牌数
     */
    completion_tokens: number;
    
    /**
     * 总令牌数
     */
    total_tokens: number;
  }[];
  
  /**
   * 按来源统计
   */
  by_source: {
    /**
     * 来源
     */
    source: string;
    
    /**
     * 提示词令牌数
     */
    prompt_tokens: number;
    
    /**
     * 补全令牌数
     */
    completion_tokens: number;
    
    /**
     * 总令牌数
     */
    total_tokens: number;
  }[];
}

/**
 * 获取AI使用统计信息
 * @returns AI使用统计信息
 */
export const fetchAIUsageStats = async (): Promise<AIUsageStats> => {
  const { data } = await apiClient.get("/api/admin/ai-usage-stats");
  return data;
};

// ==================== RAG模型相关类型和接口 ====================
/**
 * RAG模型接口
 */
export interface RAGModel {
  /**
   * 模型ID
   */
  id: number;
  
  /**
   * 模型名称
   */
  name: string;
  
  /**
   * API端点
   */
  api_endpoint: string;
  
  /**
   * 模型类型
   */
  model_type: "embedding" | "rerank";
  
  /**
   * 是否激活
   */
  is_active: boolean;
  
  /**
   * 输出维度
   */
  output_dim?: number | null;
  
  /**
   * API密钥
   */
  api_key?: string | null;
  
  /**
   * 模型描述
   */
  description?: string | null;
  
  /**
   * 相似度Top K
   */
  similarity_top_k?: number | null;
  
  /**
   * 重排序Top K
   */
  rerank_top_k?: number | null;
}

/**
 * RAG模型创建载荷类型
 */
export type RAGModelCreatePayload = Omit<RAGModel, "id" | "is_active">;

/**
 * RAG模型更新载荷类型
 */
export type RAGModelUpdatePayload = Partial<RAGModelCreatePayload>;

/**
 * 获取所有RAG模型
 * @returns RAG模型列表
 */
export const fetchRAGModels = async (): Promise<RAGModel[]> => {
  const { data } = await apiClient.get("/api/admin/rag-models");
  return data;
};

/**
 * 创建RAG模型
 * @param model RAG模型创建参数
 * @returns 创建的RAG模型
 */
export const createRAGModel = async (
  model: RAGModelCreatePayload
): Promise<RAGModel> => {
  const { data } = await apiClient.post("/api/admin/rag-models", model);
  return data;
};

/**
 * 删除RAG模型
 * @param id RAG模型ID
 * @returns 操作结果消息
 */
export const deleteRAGModel = async (
  id: number
): Promise<{ message: string }> => {
  const { data } = await apiClient.delete(`/api/admin/rag-models/${id}`);
  return data;
};

/**
 * 停用RAG模型
 * @param id RAG模型ID
 * @returns 操作结果消息
 */
export const deactivateRAGModel = async (
  id: number
): Promise<{ message: string }> => {
  const { data } = await apiClient.patch(
    `/api/admin/rag-models/${id}/deactivate`
  );
  return data;
};

/**
 * 设置RAG模型为激活状态
 * @param id RAG模型ID
 * @returns 操作结果消息
 */
export const setActiveRAGModel = async (
  id: number
): Promise<{ message: string }> => {
  const { data } = await apiClient.patch(
    `/api/admin/rag-models/${id}/set-active`
  );
  return data;
};

/**
 * 更新RAG模型
 * @param id RAG模型ID
 * @param payload RAG模型更新参数
 * @returns 更新后的RAG模型
 */
export const updateRAGModel = async (
  id: number,
  payload: RAGModelUpdatePayload
): Promise<RAGModel> => {
  const { data } = await apiClient.put(`/api/admin/rag-models/${id}`, payload);
  return data;
};

// ==================== 向量存储相关类型和接口 ====================
/**
 * 向量存储接口
 */
export interface VectorStore {
  /**
   * 存储ID
   */
  id: number;
  
  /**
   * 案由
   */
  case_cause: string;
  
  /**
   * 描述
   */
  description?: string | null;
  
  /**
   * Top K
   */
  top_k: number;
  
  /**
   * 是否启用重排序
   */
  enable_rerank: boolean;
}

/**
 * 文档组接口
 */
export interface DocumentGroup {
  /**
   * 组ID
   */
  id: number;
  
  /**
   * 组名称
   */
  name: string;
  
  /**
   * 源文件名列表
   */
  source_filenames: string[];
  
  /**
   * 嵌入模型名称
   */
  embedding_model_name: string;
  
  /**
   * 创建时间
   */
  created_at: string;
}

/**
 * 结构化案由接口
 */
export interface StructuredCaseCause {
  /**
   * ID
   */
  id: string;
  
  /**
   * 名称
   */
  name: string;
  
  /**
   * 路径
   */
  path: string;
  
  /**
   * 描述
   */
  description: string;
}

/**
 * 结构化案由响应接口
 */
export interface StructuredCausesResponse {
  /**
   * 按类别分组的案由列表
   */
  [category: string]: StructuredCaseCause[];
}

/**
 * 获取所有按类别分组的案由列表
 * @returns 结构化案由响应
 */
export const fetchAllStructuredCaseCauses =
  async (): Promise<StructuredCausesResponse> => {
    const { data } = await apiClient.get<StructuredCausesResponse>(
      "/api/templates/all-structured"
    );
    return data;
  };

/**
 * 获取所有向量存储
 * @returns 向量存储列表
 */
export const fetchVectorStores = async (): Promise<VectorStore[]> => {
  const { data } = await apiClient.get("/api/admin/vector-stores");
  return data;
};

/**
 * 更新向量存储配置
 * @param id 向量存储ID
 * @param config 配置参数
 * @returns 更新后的向量存储
 */
export const updateVectorStoreConfig = async (
  id: number,
  config: Partial<Pick<VectorStore, "top_k" | "enable_rerank">>
) => {
  const { data } = await apiClient.put(
    `/api/admin/vector-stores/${id}`,
    config
  );
  return data;
};

/**
 * 创建向量存储
 * @param vectorStore 向量存储参数
 * @returns 创建的向量存储
 */
export const createVectorStore = async (vectorStore: {
  case_cause: string;
}): Promise<VectorStore> => {
  const { data } = await apiClient.post(
    `/api/admin/vector-stores`,
    vectorStore
  );
  return data;
};

/**
 * 获取所有支持的案由
 * @returns 案由列表
 */
export const fetchAllSupportedCaseCauses = async (): Promise<string[]> => {
  const { data } = await apiClient.get<string[]>(
    "/api/templates/all-case-causes"
  );
  return data;
};

/**
 * 获取文档组
 * @param storeId 存储ID
 * @returns 文档组列表
 */
export const fetchDocumentGroups = async (
  storeId: number
): Promise<DocumentGroup[]> => {
  const { data } = await apiClient.get<DocumentGroup[]>(
    `/api/admin/vector-stores/${storeId}/groups`
  );
  return data;
};

/**
 * 上传到向量存储
 * @param params 上传参数
 * @returns 上传结果
 */
export const uploadToVectorStore = async (params: {
  caseCause: string;
  strategy: "chunk" | "qa" | "excel_qa";
  files: File[];
  groupName: string;
  chunkSize: number;
  overlap: number;
}): Promise<{ message: string; task_id: string }> => {
  const formData = new FormData();
  formData.append("strategy", params.strategy);
  formData.append("group_name", params.groupName);
  formData.append("chunk_size", params.chunkSize.toString());
  formData.append("overlap", params.overlap.toString());

  params.files.forEach((file) => {
    formData.append("files", file, file.name);
  });

  const { data } = await apiClient.post(
    `/api/admin/vector-stores/${params.caseCause}/upload`,
    formData,
    { headers: { "Content-Type": undefined } }
  );
  return data;
};

/**
 * 删除文档组
 * @param groupId 文档组ID
 * @returns 操作结果消息
 */
export const deleteDocumentGroup = async (
  groupId: number
): Promise<{ message: string }> => {
  const { data } = await apiClient.delete(
    `/api/admin/document-groups/${groupId}`
  );
  return data;
};

/**
 * 获取任务状态
 * @param taskId 任务ID
 * @returns 任务状态
 */
export const getTaskStatus = async (taskId: string) => {
    const { data } = await apiClient.get(`/api/admin/tasks/${taskId}/status`);
    return data;
};

// ==================== 文档块相关类型和接口 ====================
/**
 * 文档块接口
 */
export interface DocumentChunk {
  /**
   * 块ID
   */
  id: number;
  
  /**
   * 源文档名称
   */
  source_document_name: string;
  
  /**
   * 内容类型
   */
  content_type: "chunk" | "qa_pair";
  
  /**
   * 内容
   */
  content: {
    /**
     * 文本内容
     */
    text?: string;
    
    /**
     * 问题
     */
    question?: string;
    
    /**
     * 答案
     */
    answer?: string;
  };
}

/**
 * 分页文档块响应接口
 */
export interface PaginatedChunksResponse {
  /**
   * 总数
   */
  total_count: number;
  
  /**
   * 文档块列表
   */
  chunks: DocumentChunk[];
}

/**
 * 重建配置载荷接口
 */
export interface RebuildConfigPayload {
  /**
   * 策略
   */
  strategy: "chunk" | "qa" | "excel_qa";
  
  /**
   * 块大小
   */
  chunk_size: number;
  
  /**
   * 重叠
   */
  overlap: number;
}

/**
 * 重建文档组
 * @param groupId 文档组ID
 * @param config 重建配置
 * @returns 重建结果
 */
export const rebuildDocumentGroup = async (
  groupId: number,
  config: RebuildConfigPayload
): Promise<{ message: string; task_id: string }> => {
  const { data } = await apiClient.post(
    `/api/admin/document-groups/${groupId}/rebuild`,
    config
  );
  return data;
};