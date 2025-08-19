// src/api/templateApi.ts
import { isAxiosError } from "axios";
import apiClient from "./axiosConfig";
import toast from "react-hot-toast";

export interface TemplateInfo {
  id: string;
  name: string;
  path: string;
  description: string;
  disabled?: boolean;
}

export const fetchTemplates = async (
  docType: string,
  category: string
): Promise<TemplateInfo[]> => {
  try {
    const response = await apiClient.get(
      `/api/templates/${docType}/${category}`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    toast.error("加载模板列表失败。");
    return [];
  }
};

export const recommendTemplate = async (
  description: string,
  availableTemplates: TemplateInfo[]
): Promise<{ recommended_template_id: string; reason: string }> => {

  try {
    const response = await apiClient.post(
      `/api/templates/recommend`,
      { description, available_templates: availableTemplates }
    );
    return response.data;
  } catch (error) {
      // (新增) 标准错误处理
      let errorMessage = "AI推荐请求失败。";
      if (isAxiosError(error) && error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
      }
      // 这个API的错误是在 useMutation 中处理的，所以这里可以只抛出错误
      throw new Error(errorMessage);
  }
};

/**
 * 根据案由和文书类型，从后端查询对应的表单页面路径
 */
export const findTemplatePathByCause = async (
  docTypeName: '起诉状' | '答辩状',
  caseCause: string
): Promise<string> => {
   try {
        const params = new URLSearchParams({
            doc_type_name: docTypeName,
            case_cause: caseCause,
        });
        
        const response = await apiClient.get<{ path: string }>(
            `/api/templates/find-path`, { params }
        );
        return response.data.path;
    } catch(error) {
        let errorMessage = "查找模板路径失败。";
        if (isAxiosError(error) && error.response?.data?.detail) {
            errorMessage = error.response.data.detail;
        }
        toast.error(errorMessage);
        throw new Error(errorMessage);
    }
};
