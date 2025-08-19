// src/api/documentApi.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import apiClient from "./axiosConfig";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import type { ClaimInfoResponse } from "../interfaces/document.types";
import type { FinalDataObject } from '../interfaces/document.types';


/**
 * 发送最终的payload到后端，生成并下载DOCX文件，并返回响应头。
 * @returns 返回一个包含响应头的对象，用于提取案号和验证码。
 */
export const generateAndDownloadDocx = async (
  documentTypeName: "起诉状" | "答辩状",
  payload: any,
  caseTitle: string
): Promise<{ headers: any }> => {
  // (修改) 返回类型
  try {
    const case_number = payload.formData?.basicInfo?.caseNumber || "";

    const requestBody = {
      document_type: documentTypeName,
      case_number: case_number,
      payload: payload,
    };

    const response = await apiClient.post(
      `/api/documents/generate-and-save`,
      requestBody,
      {
        responseType: "blob",
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;

    const contentDisposition = response.headers["content-disposition"];
    let filename = `${caseTitle}-${dayjs().format("YYYYMMDD")}.docx`;

    if (contentDisposition) {
      const utf8FilenameMatch = contentDisposition.match(
        /filename\*=UTF-8''([^;]+)/
      );
      if (utf8FilenameMatch && utf8FilenameMatch[1]) {
        filename = decodeURIComponent(utf8FilenameMatch[1]);
      } else {
        const asciiFilenameMatch =
          contentDisposition.match(/filename="([^"]+)"/);
        if (asciiFilenameMatch && asciiFilenameMatch[1]) {
          filename = asciiFilenameMatch[1];
        }
      }
    }

    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { headers: response.headers };
  } catch (error) {
    console.error("Failed to generate document:", error);

    if (isAxiosError(error) && error.response) {
      // 尝试将 blob 类型的错误响应转换为 JSON
      const errorData = await (error.response.data as Blob).text();
      try {
        const errorJson = JSON.parse(errorData);
        toast.error(`文档生成失败: ${errorJson.detail || "未知验证错误"}`);
      } catch (e) {
        toast.error("文档生成失败，无法解析错误详情。");
        console.error("Failed to parse error JSON:", e);
      }
    } else {
      toast.error("文档生成失败，请检查网络或联系管理员。");
    }
    throw error;
  }
};

/**
 * 根据案号和验证码加载最新的表单数据用于编辑
 */
interface LoadRequest {
  case_number: string;
  verification_code: string;
}

export interface LoadedDocumentResponse {
  formData: any;
  doc_type: "起诉状" | "答辩状";
  case_cause: string;
}

export const loadDocumentForEditing = async (
  params: LoadRequest
): Promise<LoadedDocumentResponse> => {
  try {
    const response = await apiClient.post<LoadedDocumentResponse>(
      `/api/documents/load-for-editing`,
      params
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      isAxiosError(error) && error.response?.data?.detail
        ? error.response.data.detail
        : "加载文书失败，请检查案号和验证码。";
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
};

interface AutofillParams {
    formId: string;
    textContent?: string;
    file?: File | null;
}

export const autofillFromSource = async ({ formId, textContent, file }: AutofillParams): Promise<any> => {
    // 使用 FormData 来发送数据，这样可以同时支持文件和文本
    const formData = new FormData();
    formData.append('form_id', formId);
    
    if (textContent) {
        formData.append('text_content', textContent);
    }
    if (file) {
        formData.append('file', file);
    }

    try {
      console.log('Sending form data:', formData);
        const response = await apiClient.post(
            `/api/documents/autofill`, // 调用我们新的 /autofill 接口
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    } catch (error) {
        // 错误处理逻辑与您现有的其他API函数保持一致
        const errorMessage = (isAxiosError(error) && error.response?.data?.detail)
            ? error.response.data.detail
            : "AI智能填表请求失败。";
        // 注意：这里的toast可能会与组件内的toast冲突，我们让组件自己处理
        throw new Error(errorMessage);
    }
};

export const generateEvidenceChecklistDocx = async (
  claims: string,
  facts: string,
  docType: "起诉状" | "答辩状"
) => {
  try {
    const response = await apiClient.post(
      `/api/documents/generate-evidence-checklist`,
      { claims, facts, doc_type: docType },
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    const formattedDate = dayjs().format("YYYYMMDDHHmmss");
    const filename = `AI推荐证据目录-${docType}-${formattedDate}.docx`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success("推荐证据目录已开始下载！");
  } catch (error) {
    console.error("Failed to generate evidence checklist:", error);
    toast.error("生成推荐证据目录失败。");
    throw error;
  }
};

export const fetchClaimInfoByCaseNumber = async (
  caseNumber: string | null,
  caseCause: string
): Promise<ClaimInfoResponse> => {
  if (!caseNumber || caseNumber.trim() === "") {
    return { error: "未提供有效的案号，请输入案号进行查询。" };
  }

  try {
    const response = await apiClient.get(
      `/api/documents/latest-claim/${caseNumber}?case_cause=${encodeURIComponent(
        caseCause
      )}`
    );
    return response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      if (error.response.status === 404) {
        return { error: `未能根据案号 [${caseNumber}] 找到对应的起诉状信息。` };
      }
      const detail = error.response.data?.detail || "获取信息时发生未知错误。";
      return { error: detail };
    }
    console.error("Fetch claim info error:", error);
    return { error: "无法连接到服务器，请检查网络连接。" };
  }
};

/**
 * 供被告在填写答辩状时，使用案号和自己的验证码来安全地查询原告的起诉状内容。
 * @param caseNumber 案号
 * @param defendantCode 被告验证码
 * @returns 格式化后的起诉状 FinalDataObject
 */
export const fetchClaimForDefense = async (caseNumber: string, defendantCode: string,
  currentCaseCause: string): Promise<FinalDataObject> => {
  try {
    const params = {
      case_number: caseNumber,
      defendant_code: defendantCode,
      current_case_cause: currentCaseCause
    };
    const response = await apiClient.get<FinalDataObject>(`/api/documents/get-claim-for-defense`, { params });
    return response.data;
  } catch (error) {
    const errorMessage = (isAxiosError(error) && error.response?.data?.detail)
      ? error.response.data.detail
      : "查询起诉状信息失败。";
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
};
