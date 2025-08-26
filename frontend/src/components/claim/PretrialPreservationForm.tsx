import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { FormSectionCard } from '../../layouts/FormSectionCard';

interface Props {
  path: string; // The base path in the form data, e.g., "pretrialPreservation"
}

export const PretrialPreservationForm: React.FC<Props> = ({ path }) => {
  const { register, control } = useFormContext();

  // 监听单选按钮的值
  const hasPreservation = useWatch({
    control,
    name: `${path}.hasPreservation`,
  });

  return (
    <FormSectionCard title="诉前保全">
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* 左侧标题 */}
        <div className="col-span-12 md:col-span-3">
          <label className="label">
            <span className="label-text font-semibold">是否已经诉前保全</span>
          </label>
        </div>
        
        {/* 右侧内容 */}
        <div className="col-span-12 md:col-span-9">
          {/* 是/否 单选 */}
          <div className="flex flex-col gap-2">
            <label className="label cursor-pointer justify-start gap-2">
              <input type="radio" value="yes" {...register(`${path}.hasPreservation`)} className="radio radio-sm"/>
              <span className="label-text">是</span>
            </label>
            <label className="label cursor-pointer justify-start gap-2">
              <input type="radio" value="no" {...register(`${path}.hasPreservation`)} className="radio radio-sm"/>
              <span className="label-text">否</span>
            </label>
          </div>
          
          {/* 条件渲染的详细信息表单 */}
          {hasPreservation === 'yes' && (
            <div className="grid grid-cols-2 gap-4 mt-4 p-4 border rounded-md bg-base-200/50">
              <div className="form-control">
                <label className="label"><span className="label-text mr-2">保全法院</span></label>
                <input type="text" {...register(`${path}.court`)} className="input input-bordered input-sm" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text mr-2">保全时间</span></label>
                <input type="date" {...register(`${path}.date`)} className="input input-bordered input-sm" />
              </div>
              <div className="form-control col-span-2">
                <label className="label"><span className="label-text mr-2">保全案号</span></label>
                <input type="text" {...register(`${path}.caseNumber`)} className="input input-bordered input-sm" />
              </div>
            </div>
          )}

          {/* 底部提示信息 */}
          <p className="text-xs  mt-2">( 如申请诉讼保全，请另行提交诉讼保全申请及相关材料 )</p>
        </div>
      </div>
    </FormSectionCard>
  );
};