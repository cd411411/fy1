import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { fetchContractAnalysis } from '../api/legalApi';

export const useContractAnalysis = () => {
  // The result is expected to be a string (the relevant contract clause)
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeContract = useCallback(async (file: File, formContent: string) => {
    // Basic file validation
    const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!supportedTypes.includes(file.type)) {
      toast.error('不支持的文件格式。请上传 PDF, DOCX, JPG 或 PNG。');
      return;
    }

    if (!formContent.trim()) {
      toast.error('请先填写表单内容，以便AI更好地进行合同条款定位。');
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisResult('');
    toast.loading('正在上传并分析合同...');

    try {
        const result = await fetchContractAnalysis(file, formContent);
        setAnalysisResult(result.clause); // Assuming the API returns { "clause": "..." }
        if (result.clause) {
            toast.dismiss();
            toast.success('合同条款分析完成！');
        } else {
            toast.dismiss();
            toast('AI未能定位到相关合同条款。', { icon: 'ℹ️' });
        }
    } catch (error) {
        // API function will handle specific error toasts
        toast.dismiss();
    } finally {
        setIsAnalyzing(false);
    }
  }, []);

  return { analysisResult, isAnalyzing, analyzeContract };
};