import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OptimizableTextarea } from '../OptimizableTextarea';
import { LegalAnalysisField } from '../LegalAnalysisField';

// LegalAnalysisField 的 props 可能需要更通用化的处理，这里暂时保持原样

type FormDataProcessor = (formData: any) => object;

export interface TextQuestionProps {
  path: string;
  title: string;
  type: 'textarea' | 'optimizationContext' | 'LegalAnalysisField';
  placeholder?: string;
  detailsLabel?: string;
  optimizationContext?: string;
  // 为 LegalAnalysisField 添加通用 props
  formDataProcessor?: FormDataProcessor;
  withContractAnalysis?: boolean;
}

export const TextQuestion: React.FC<TextQuestionProps> = ({
  path,
  title,
  type,
  detailsLabel = '',
  placeholder = '',
  optimizationContext = '',
  formDataProcessor, // 接收 processor
  withContractAnalysis,
}) => {
  const { register } = useFormContext();
  return (
    <tr className="hover">
      <th className="w-1/4 align-top bg-base-200/50">{title}</th>
      <td>
        {type === 'textarea' && (
          <textarea
            {...register(`${path}`)}
            className="textarea textarea-bordered w-full"
            placeholder={placeholder}
          ></textarea>
        )}
        {type === 'optimizationContext' && (
          <OptimizableTextarea
            path={path}
            label={detailsLabel}
            placeholder={placeholder}
            rows={2}
            optimizationContext={optimizationContext? optimizationContext :`原告关于${title}的具体内容描述`}
          />
        )}
        {type === 'LegalAnalysisField' && formDataProcessor && (
          <LegalAnalysisField
            path={path}
            contractPath={`${path}.contract`}
            legalPath={`${path}.legal`}
            placeholder={placeholder}
            formDataProcessor={formDataProcessor}
            withContractAnalysis={withContractAnalysis}
          />
        )}
      </td>
    </tr>
  );
};