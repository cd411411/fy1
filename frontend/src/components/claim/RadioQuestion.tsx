import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OptimizableTextarea } from '../OptimizableTextarea';
interface OptionType {
  value: string;
  label: string;
}

export interface RadioQuestionProps {
  path: string;
  title: string;
  options: OptionType[];
  children?: (selectedValue: string) => React.ReactNode;
  enableDetails?: boolean;
  detailsLabel?: string;
  detailsPlaceholderTemplate?: (title: string) => string;
  detailsOptimizationContextTemplate?: (title: string) => string;
  detailsPath?: string;
}

export const RadioQuestion: React.FC<RadioQuestionProps> = ({
  path,
  title,
  options,
  children,
  enableDetails = false,
  detailsLabel = "明细",
  detailsPlaceholderTemplate = (t) => {
    const cleanTitle = t.replace(/^\d+\.\s*(是否主张)?/, "").replace(/[\(\)，。！？]+$/, "").trim();
    return `具体${cleanTitle}请求内容明细...`;
  },
  detailsOptimizationContextTemplate = (t) => {
    const cleanTitle = t.replace(/^\d+\.\s*(是否主张)?/, "").replace(/[\(\)，。！？]+$/, "").trim();
    return `原告关于${cleanTitle}的具体内容描述`;
  },
}) => {
  const { register, watch } = useFormContext();
  const selectedValue = watch(path);
  const detailsPath = path.replace(/_check$/, '_details');

  return (
    <tr className="hover">
      <th className="w-1/4 align-top bg-base-200/50">{title}</th>
      <td>
        <div className="flex">
          {options.map((option) => (
            <label key={option.value} className="label cursor-pointer justify-start gap-2 mr-2 mt-1">
              <input
                type="radio"
                value={option.value}
                {...register(path)}
                className="radio radio-sm"
              />
              {option.label}
            </label>
          ))}
        </div>
        {enableDetails && selectedValue === 'yes' && (
          <OptimizableTextarea
            path={detailsPath}
            label={detailsLabel}
            placeholder={detailsPlaceholderTemplate(title)}
            rows={2}
            optimizationContext={detailsOptimizationContextTemplate(title)}
          />
        )}
        {children && selectedValue && children(selectedValue)}
      </td>
    </tr>
  );
};