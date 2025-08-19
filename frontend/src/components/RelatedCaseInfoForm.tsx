import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { FormSectionCard } from '../layouts/FormSectionCard';

interface Props {
  path: string; // The base path in the form data, e.g., "relatedCase"
}

export const RelatedCaseInfoForm: React.FC<Props> = ({ path }) => {
  const { register, control } = useFormContext();

  // 监听单选按钮的值，以控制textarea的显示
  const hasRelatedCase = useWatch({
    control,
    name: `${path}.hasInfo`,
  });

  return (
    <FormSectionCard title="关联案件信息">
      <div className="flex gap-6 items-start">
        {/* "有/无" 单选按钮 */}
        <div className="flex flex-col gap-2 pt-1">
          <label className="label cursor-pointer justify-start gap-2">
            <input 
              type="radio" 
              value="有" 
              {...register(`${path}.hasInfo`)} 
              className="radio radio-sm" 
            />
            <span className="label-text">有</span>
          </label>
          <label className="label cursor-pointer justify-start gap-2">
            <input 
              type="radio" 
              value="无" 
              {...register(`${path}.hasInfo`)} 
              className="radio radio-sm" 
            />
            <span className="label-text">无</span>
          </label>
        </div>

        {/* 条件渲染的文本域 */}
        {hasRelatedCase === '有' && (
          <div className="flex-grow">
            <textarea 
              {...register(`${path}.details`)}
              className="textarea textarea-bordered w-full h-24"
              placeholder="内容：件(已结、未结)、案号、案由、当事人、审理法院、案件进展等 (可另附页)"
            />
          </div>
        )}
      </div>
    </FormSectionCard>
  );
};