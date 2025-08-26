// src/components/defense/ObjectionField.tsx (交互与内容全面升级)

import React, { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { OptimizableTextarea } from "./OptimizableTextarea";
import type { ObjectionOptionType } from "../interfaces/defense-form.types";
import { analyzeObjectionPoints } from "../api/legalApi";
import type { ObjectionAnalysisResponse } from "../api/legalApi"; // 引入新的响应类型
import toast from 'react-hot-toast';

interface Props {
  path: string;
  title: string;
  plaintiffClaim?: string;
  plaintiffFullText?: string;
  placeholder?: string;
  optimizationContext?: string;
  optionType?: ObjectionOptionType;
}

const OPTION_SETS = {
  yes_no: { positive: "无", negative: "有" },
  confirm_object: { positive: "确认", negative: "异议" },
};

export const ObjectionField: React.FC<Props> = ({
  path,
  title,
  plaintiffClaim = '',
  plaintiffFullText = '',
  placeholder = "异议内容:",
  optimizationContext = "异议内容",
  optionType = "yes_no",
}) => {
  const { register, control, setValue, getValues } = useFormContext();
  const currentOptions = OPTION_SETS[optionType];
  const hasObjection = useWatch({ control, name: `${path}.hasObjection` });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // (修改) State现在存储整个分析结果对象
  const [analysisResult, setAnalysisResult] = useState<ObjectionAnalysisResponse | null>(null);
  
  const showDetails = hasObjection === currentOptions.negative;

  const handleAnalyze = async () => {
    const analysisContent = plaintiffFullText.trim() || plaintiffClaim.trim();
    if (!analysisContent) {
      toast.error('无法获取原告的起诉状信息，请先确保左侧已成功加载。');
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisResult(null); // (修改) 清空旧结果
    try {
      const result = await analyzeObjectionPoints(analysisContent, title);
      setAnalysisResult(result); // (修改) 保存整个结果对象
      toast.success('AI分析完成！');
    } catch (error) {
      toast.error(`分析失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applySuggestion = (suggestion: string) => {
    const detailsPath = `${path}.details`;
    const currentValue = getValues(detailsPath) || '';
    const newValue = currentValue ? `${currentValue}\n${suggestion}` : `${suggestion}`;
    setValue(detailsPath, newValue, { shouldDirty: true });
    toast.success('已应用建议！');
    // (修改) 采纳后自动关闭 (通过清空结果实现)
    setAnalysisResult(null); 
  };
  
  // (新增) 关闭分析框的函数
  const closeAnalysis = () => {
    setAnalysisResult(null);
  };

  return (
    <div className="space-y-3">
        <div className="flex gap-4">
            <label className="label cursor-pointer gap-2">
            <input type="radio" value={currentOptions.positive} {...register(`${path}.hasObjection`)} className="radio radio-sm" />
            <span className="label-text">{currentOptions.positive}</span>
            </label>
            <label className="label cursor-pointer gap-2">
            <input type="radio" value={currentOptions.negative} {...register(`${path}.hasObjection`)} className="radio radio-sm" />
            <span className="label-text">{currentOptions.negative}</span>
            </label>
        </div>

        {showDetails && (
            <div className="space-y-3">
                <OptimizableTextarea
                    path={`${path}.details`}
                    label=""
                    placeholder={placeholder}
                    optimizationContext={optimizationContext}
                />
                
                <div className="pl-2 space-y-2">
                    <button type="button" onClick={handleAnalyze} className="btn btn-xs btn-outline btn-accent" disabled={isAnalyzing}>
                        {isAnalyzing ? <span className="loading loading-spinner loading-xs"></span> : '💡'}
                        {isAnalyzing ? '分析中...' : 'AI分析异议点'}
                    </button>

                    {/* (修改) 全新的分析结果展示区 */}
                    {analysisResult && (
                        <div className="p-4 border-dashed border-accent rounded-lg bg-accent/10 space-y-4 animate-fade-in mt-2 relative">
                            {/* 关闭按钮 */}
                            <button onClick={closeAnalysis} className="btn btn-xs btn-circle btn-ghost absolute top-2 right-2">✕</button>
                            
                            {/* 1. 原告诉请分析 */}
                            <div>
                                <h4 className="font-semibold text-sm mb-1">AI 视角：原告主张分析</h4>
                                <p className="text-xs text-base-content bg-base-100/50 p-2 rounded-md">{analysisResult.plaintiff_claim_summary}</p>
                            </div>

                            {/* 2. 异议点建议 */}
                            <div>
                                <h4 className="font-semibold text-sm mb-2">建议的异议角度：</h4>
                                <ul className="space-y-2">
                                    {analysisResult.objection_suggestions.map((item, index) => (
                                    <li key={index} className="flex items-center justify-between gap-2 bg-base-100/50 p-2 rounded-md group">
                                        <span className="text-sm flex-grow">{item}</span>
                                        {/* (修改) 按钮现在默认可见，样式更明显 */}
                                        <button 
                                            type="button" 
                                            className="btn btn-xs btn-primary btn-outline"
                                            onClick={() => applySuggestion(item)}
                                        >
                                          采纳
                                        </button>
                                    </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};