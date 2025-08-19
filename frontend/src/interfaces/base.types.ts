export interface LegalBasisItem {
  regulation: string;
  reasoning: string;
}

export interface LegalAnalysisFieldProps {
  path: string;
  placeholder?: string;
  formDataProcessor: (data: any) => any; // 用于处理表单数据的函数
}


export const BLANK_CHECKBOX = "□";
export const CHECKED_CHECKBOX = "☑";

export interface LoginFormData {
  username: string;
  password: string;
}