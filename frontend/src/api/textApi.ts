// src/api/textApi.ts
import apiClient from "./axiosConfig";

// ==================== 类型定义 ====================
/**
 * 优化版本接口
 */
export interface OptimizedVersion {
  /**
   * 版本文本
   */
  version_text: string;
  
  /**
   * 焦点或优点
   */
  focus_or_merits: string;
}

// ==================== 文本API接口 ====================
/**
 * 获取多个优化版本
 * @param text 原始文本
 * @param context 上下文
 * @returns 优化版本列表
 */
export const fetchMultipleOptimizedVersions = async (
  text: string,
  context?: string
): Promise<OptimizedVersion[]> => {
  const response = await apiClient.post(
    `/api/text/optimize-multiple-versions`,
    { text, context }
  );
  return response.data.versions; // 直接返回版本数组
};