// src/components/BasicInfoSection.tsx (已修复类型错误)

import { useFormContext } from 'react-hook-form';
import type { FieldError, FieldErrorsImpl } from "react-hook-form";
import { FormSectionCard } from "../layouts/FormSectionCard";
import { useConfig } from '../hooks/useConfig';

interface Props {
  case_type: string;
  formId?: string; // 接收 formId 以判断是否为答辩状
}

export const BasicInfoSection: React.FC<Props> = ({ case_type, formId='claim_' }) => {
    // === 核心修复点: 明确地解构出 errors 对象 ===
    const { register, formState: { errors } } = useFormContext();
    const { appMode } = useConfig();

    const isDefenseForm = formId && typeof formId === 'string' ? formId.startsWith("defense_") : false;

    // === 核心修复点: 添加类型保护函数 ===
    const isFieldErrorsImpl = (error: unknown): error is FieldErrorsImpl<Record<string, unknown>> => {
      return error !== null && typeof error === 'object' && !('message' in error);
    };
    
    // === 核心修复点: 安全地访问嵌套的错误对象 ===
    const caseNumberError = errors.basicInfo && isFieldErrorsImpl(errors.basicInfo) ? errors.basicInfo.caseNumber : undefined;
    const defendantCodeError = errors.basicInfo && isFieldErrorsImpl(errors.basicInfo) ? errors.basicInfo.defendantCode : undefined;

    return (
        <FormSectionCard title="基础信息">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">
                            案号
                            {isDefenseForm && <span className="text-error ml-1">* (必填)</span>}
                        </span>
                    </label>
                    <input
                        type="text"
                        {...register("basicInfo.caseNumber", { 
                            required: isDefenseForm ? "案号是必填项" : false
                        })}
                        className={`input input-bordered w-full ${caseNumberError ? 'input-error' : ''}`}
                        placeholder={isDefenseForm ? "请输入法院指定的案号" : "如已立案请输入案号"}
                    />
                    {/* (修改) 使用解构后的变量 */}
                    {caseNumberError && <p className="text-error text-xs mt-1">{(caseNumberError as FieldError).message}</p>}
                </div>
                
                {appMode === 'court' && isDefenseForm && (
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">被告验证码<span className="text-error ml-1">* (必填)</span></span>
                        </label>
                        <input
                            type="text"
                            {...register("basicInfo.defendantCode", { required: "被告验证码是必填项" })}
                            className={`input input-bordered w-full ${defendantCodeError ? 'input-error' : ''}`}
                            placeholder="请输入法院送达的被告验证码"
                        />
                         {/* (修改) 使用解构后的变量 */}
                         {defendantCodeError && <p className="text-error text-xs mt-1">{(defendantCodeError as FieldError).message}</p>}
                    </div>
                )}

                <div className={`form-control ${appMode === 'court' && isDefenseForm ? 'md:col-span-2' : 'md:col-start-1'}`}>
                    <label className="label"><span className="label-text">案由</span></label>
                    <input
                        type="text"
                        {...register("basicInfo.caseCause")}
                        className="input input-bordered w-full bg-base-200"
                        defaultValue={case_type}
                        readOnly
                    />
                </div>
            </div>
        </FormSectionCard>
    );
};