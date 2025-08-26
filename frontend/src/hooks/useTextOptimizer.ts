// src/hooks/useTextOptimizer.ts
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { fetchMultipleOptimizedVersions  } from '../api/textApi';
import type {OptimizedVersion} from '../api/textApi';

export const useTextOptimizer = () => {
  // 状态现在是一个版本数组
  const [versions, setVersions] = useState<OptimizedVersion[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const getOptimizedVersions = useCallback(async (originalText: string, context?: string) => {
    if (!originalText.trim()) { /* ... */ }
    
    setIsOptimizing(true);
    setVersions([]); // 清空旧版本

    try {
        const result = await fetchMultipleOptimizedVersions(originalText, context);
        setVersions(result);
        toast.success('已生成3个优化版本！');
    } catch (error) {
        toast.error('优化失败，请稍后重试。');
    } finally {
        setIsOptimizing(false);
    }
  }, []);

  return { versions, isOptimizing, getOptimizedVersions, setVersions };
};