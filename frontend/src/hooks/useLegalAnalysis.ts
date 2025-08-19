import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { fetchStructuredLegalAnalysis } from '../api/legalApi';
import type { LegalBasisItem } from '../interfaces/base.types';

export const useLegalAnalysis = () => {
  const [analysisResult, setAnalysisResult] = useState<LegalBasisItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeLegalBasis = useCallback(async (content: string) => {
    if (!content.trim()) {
      toast.error('请先填写表单内容才能进行法律分析。');
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisResult([]);

    try {
        const result = await fetchStructuredLegalAnalysis(content);
        setAnalysisResult(result);
        if (result.length > 0) {
            toast.success('法律依据分析完成！');
        } else {
            toast('AI未能分析出相关法律依据。', { icon: 'ℹ️' });
        }
    } catch (error) {
        // API函数内部已经toast了错误，这里只处理状态
    } finally {
        setIsAnalyzing(false);
    }
  }, []);

  return { analysisResult, isAnalyzing, analyzeLegalBasis };
};