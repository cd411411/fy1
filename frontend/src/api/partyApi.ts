// src/api/partyApi.ts
import { isAxiosError } from "axios";
import apiClient from "./axiosConfig";
import toast from 'react-hot-toast';

// ==================== 当事人API接口 ====================
/**
 * 上传证件图片进行OCR识别并返回结构化数据
 * @param imageFile 用户选择的图片文件
 * @param partyType 证件类型，用于后端选择合适的AI prompt
 *                  例如: "natural_person_id_card" 或 "legal_entity_license"
 * @returns 识别后的结构化数据
 */
export const uploadAndOcrFill = async (imageFile: File, partyType: string) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('party_type', partyType);

  try {
    const response = await apiClient.post(
      `/api/parties/ocr-fill`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    toast.success('证件信息识别成功！');
    return response.data; // 期望返回一个包含表单字段的对象
  } catch (error) {
    console.error("OCR Fill API error:", error);
    const errorMessage = (isAxiosError(error) && error.response?.data?.detail)
      ? error.response.data.detail
      : "证件识别失败，请检查图片或稍后重试。";
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
};