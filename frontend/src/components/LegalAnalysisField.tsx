import React, { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import toast from 'react-hot-toast';

import { useLegalAnalysis } from '../hooks/useLegalAnalysis';
import { useContractAnalysis } from '../hooks/useContractAnalysis'; // Import new hook
import type { LegalAnalysisFieldProps } from '../interfaces/base.types';

// Update props to accept two paths
interface BasisAnalysisFieldProps extends LegalAnalysisFieldProps {
  contractPath: string;
  legalPath: string;
  withContractAnalysis?: boolean;
}

export const LegalAnalysisField: React.FC<BasisAnalysisFieldProps> = ({ 
  contractPath,
  legalPath,
  formDataProcessor,
  withContractAnalysis = true
}) => {
  const { register, getValues, setValue } = useFormContext();

  // --- State and Logic for Contract Analysis ---
  const { 
    analysisResult: contractResult, 
    isAnalyzing: isAnalyzingContract, 
    analyzeContract 
  } = useContractAnalysis();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- State and Logic for Legal Analysis (Existing) ---
  const { 
    analysisResult: legalResult, 
    isAnalyzing: isAnalyzingLegal, 
    analyzeLegalBasis 
  } = useLegalAnalysis();

  const getFormContentAsText = () => {
      const formData = getValues();
      const processedData = formDataProcessor ? formDataProcessor(formData) : formData;

      // Ensure processedData is an object to prevent errors
      if (typeof processedData !== 'object' || processedData === null) {
          return JSON.stringify(processedData);
      }

      const contentParts: string[] = [];

      // For Plaintiff's Claim Form (起诉状)
      if (Array.isArray(processedData.claimItems)) {
        contentParts.push("诉讼请求：");
        processedData.claimItems.forEach((item: any) => {
            if(item.question && item.answers) contentParts.push(`${item.question}: ${item.answers}`)
        });
      }

      // For Defendant's Defense Form (答辩状)
      if (Array.isArray(processedData.defenseItems)) {
        contentParts.push("答辩事项：");
        processedData.defenseItems.forEach((item: any) => {
            if(item.question && item.answers) contentParts.push(`${item.question}: ${item.answers}`)
        });
      }

      // For Plaintiff's Facts section
      if (Array.isArray(processedData.factItems)) {
        contentParts.push("\n事实与理由：");
        processedData.factItems.forEach((item: any) => {
            if(item.question && item.answers) contentParts.push(`${item.question}: ${item.answers}`)
        });
      }

      // For Defendant's Facts and Reasons section
       if (Array.isArray(processedData.factsAndReasons)) {
        contentParts.push("\n事实与理由：");
        processedData.factsAndReasons.forEach((item: any) => {
            if(item.question && item.answers) contentParts.push(`${item.question}: ${item.answers}`)
        });
      }
      
      // Also include full statements if they exist
      if (processedData.fullDefenseStatement) {
        contentParts.push(`\n答辩事项完整陈述：\n${processedData.fullDefenseStatement}`);
      }
      if (processedData.fullFactsAndReasonsStatement) {
        contentParts.push(`\n事实与理由完整陈述：\n${processedData.fullFactsAndReasonsStatement}`);
      }

      return contentParts.join('\n\n');
  };

  const handleContractUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const formContent = getFormContentAsText();
      analyzeContract(file, formContent);
    }
    // Reset file input to allow uploading the same file again
    event.target.value = '';
  };
  
  const handleLegalAnalysisClick = () => {
    const content = getFormContentAsText();
    const caseCause = getValues('basicInfo.caseCause');
    analyzeLegalBasis(content, caseCause);
  };
  
  const handleApplyContractAnalysis = () => {
    if (!contractResult) return;
    setValue(contractPath, contractResult, { shouldDirty: true });
    toast.success('已将合同条款填充到文本框！');
  };

  const handleApplyLegalAnalysis = () => {
    if (legalResult.length === 0) return;
    const formattedText = legalResult
      .map((item, index) => `${index + 1}. ${item.regulation}\n   适用理由：${item.reasoning}`)
      .join('\n\n');
    setValue(legalPath, formattedText, { shouldDirty: true });
    toast.success('已将法律依据填充到文本框！');
  };

  return (
    <div className="w-full space-y-6">
      {/* === Section 1: Contractual Basis === */}
       {withContractAnalysis && ( 
      <div className="form-control w-full space-y-2">
        <div className="flex justify-between items-center">
          <label className="label py-1">
            <span className="label-text font-semibold">合同依据</span>
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.docx,.jpg,.jpeg,.png"
          />
          <button
            type="button"
            onClick={handleContractUploadClick}
            className="btn btn-xs btn-ghost gap-1 text-primary"
            disabled={isAnalyzingContract}
            title="上传合同文件以辅助AI判断适用条款"
          >
            {isAnalyzingContract ? <span className="loading loading-spinner loading-xs"></span> : '📎'}
            {isAnalyzingContract ? "分析中..." : "上传合同辅助判断"}
          </button>
        </div>
        <textarea
          {...register(contractPath)}
          className="textarea textarea-bordered w-full h-24"
          placeholder='点击右上角"上传合同辅助判断"按钮，可根据表单和合同内容自动生成。'
          readOnly={isAnalyzingContract}
        />
        {!isAnalyzingContract && contractResult && (
          <div className="mt-2 p-3 border border-dashed border-primary/30 rounded-lg bg-primary/5 space-y-2">
            <p className="text-sm font-semibold text-primary">AI 分析出的合同条款:</p>
            <p className="prose prose-sm max-w-none p-2 bg-base-100 rounded">{contractResult}</p>
            <div className="text-right">
              <button type="button" className="btn btn-sm btn-primary" onClick={handleApplyContractAnalysis}>采纳此条款</button>
            </div>
          </div>
        )}
      </div>
       )}
      {/* === Section 2: Legal Basis === */}
      <div className="form-control w-full space-y-2">
        <div className="flex justify-between items-center">
          <label className="label py-1">
            <span className="label-text font-semibold">法律依据</span>
          </label>
          <button
            type="button"
            onClick={handleLegalAnalysisClick}
            className="btn btn-xs btn-ghost gap-1 text-primary"
            disabled={isAnalyzingLegal}
            title="AI分析法律依据"
          >
            {isAnalyzingLegal ? <span className="loading loading-spinner loading-xs"></span> : '⚖️'}
            {isAnalyzingLegal ? "分析中..." : "AI分析依据"}
          </button>
        </div>
        <textarea
          {...register(legalPath)}
          className="textarea textarea-bordered w-full h-48"
          placeholder={isAnalyzingLegal ? "AI正在分析，请稍候..." : '点击右上角"AI分析依据"按钮，可根据表单内容自动生成。'}
          readOnly={isAnalyzingLegal}
        />
        {!isAnalyzingLegal && legalResult.length > 0 && (
          <div className="mt-2 p-4 border border-dashed border-primary/30 rounded-lg bg-primary/5 space-y-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-base font-semibold text-primary">AI 分析结果:</p>
              <button type="button" className="btn btn-sm btn-primary" onClick={handleApplyLegalAnalysis}>全部采纳</button>
            </div>
            {legalResult.map((item, index) => (
              <div key={index} tabIndex={0} className="collapse collapse-arrow border bg-base-100 rounded-md shadow-sm">
                <div className="collapse-title text-base font-medium">{index + 1}. {item.regulation}</div>
                <div className="collapse-content prose prose-sm max-w-none">
                  <p><strong>适用理由:</strong> {item.reasoning}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};