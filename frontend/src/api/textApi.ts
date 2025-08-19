// src/api/textApi.ts
import apiClient from "./axiosConfig";

export interface OptimizedVersion {
  version_text: string;
  focus_or_merits: string;
}

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
