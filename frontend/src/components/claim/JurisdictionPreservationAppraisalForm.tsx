import React from 'react';
import { useWatch, useFormContext } from "react-hook-form";
import { FormSectionCard } from "../../layouts/FormSectionCard";
import { CHECKED_CHECKBOX, BLANK_CHECKBOX } from "../../interfaces/base.types";
import type { QuestionListItem } from "../../interfaces/document.types";

// 类型定义
interface JurisdictionData {
    hasJurisdiction?: 'yes' | 'no';
    contractContent?: string;
}

interface PreservationData {
    hasPreservation?: 'yes' | 'no';
    court?: string;
    date?: string;
    caseNumber?: string;
}

interface AppraisalData {
    hasAppraisal?: 'yes' | 'no';
    appraisalItems?: string;
}

interface FormData {
    jurisdiction?: JurisdictionData;
    pretrialPreservation?: PreservationData;
    appraisal?: AppraisalData;
}

interface FormDataOrigin {
    jurisdictionPreservationAppraisal: FormData;
    preservationAndAppraisal: FormData;
    jurisdictionOnly: FormData;
}

// 配置选项类型
interface FormConfig {
    showJurisdiction?: boolean;
    showPreservation?: boolean;
    showAppraisal?: boolean;
}

// 预设配置
export const FORM_CONFIGS = {
    PRESERVATION_ONLY: {
        showJurisdiction: false,
        showPreservation: true,
        showAppraisal: false,
    },
    PRESERVATION_AND_JURISDICTION: {
        showJurisdiction: true,
        showPreservation: true,
        showAppraisal: false,
    },
    PRESERVATION_AND_APPRAISAL: {
        showJurisdiction: false,
        showPreservation: true,
        showAppraisal: true,
    },
    JURISDICTION_ONLY: {
        showJurisdiction: true,
        showPreservation: false,
        showAppraisal: false,
    },
    ALL: {
        showJurisdiction: true,
        showPreservation: true,
        showAppraisal: true,
    }
} as const;

// 常量定义
const PRESERVATION_NOTICE = "如申请诉讼保全，请另行提交诉讼保全申请及相关材料";
const PLACEHOLDER_TEXT = "__________";

// 格式化函数
const formatJurisdictionAnswer = (data: JurisdictionData): string => {
    if (data?.hasJurisdiction !== 'yes') return '';
    const contractContent = data.contractContent || PLACEHOLDER_TEXT;
    return `  合同条款及内容: ${contractContent}`;
};

const formatPreservationAnswer = (data: PreservationData): string => {
    if (data?.hasPreservation !== 'yes') return '';
    const court = data.court || PLACEHOLDER_TEXT;
    const date = data.date || PLACEHOLDER_TEXT;
    const caseNumber = data.caseNumber || PLACEHOLDER_TEXT;
    return `  保全法院: ${court}    保全时间: ${date}\n  保全案号: ${caseNumber}`;
};

const formatAppraisalAnswer = (data: AppraisalData): string => {
    if (data?.hasAppraisal !== 'yes') return '';
    const appraisalItems = data.appraisalItems || PLACEHOLDER_TEXT;
    return `  鉴定事项: ${appraisalItems}`;
};

// 导出格式化函数
export const formatJurisdictionPreservationAppraisalForDocx = (
    formData: FormDataOrigin, 
    config: FormConfig = FORM_CONFIGS.ALL
): QuestionListItem[] => {
    console.log('formatJurisdictionPreservationAppraisalForDocx', formData);
    // 根据配置获取对应的数据路径
    const getDataByConfig = (config: FormConfig) => {
        switch (config) {
            case FORM_CONFIGS.ALL:
                return formData.jurisdictionPreservationAppraisal || {};
            case FORM_CONFIGS.PRESERVATION_AND_APPRAISAL:
                return formData.preservationAndAppraisal || {};
            case FORM_CONFIGS.JURISDICTION_ONLY:
                return formData.jurisdictionOnly || {};
            default:
                return {};
        }
    };
    
    const data = getDataByConfig(config);
    const jurisdiction = data.jurisdiction || {};
    const pretrialPreservation = data.pretrialPreservation || {};
    const appraisal = data.appraisal || {};
    
    const results: QuestionListItem[] = [];

    // 1. 约定管辖部分
    if (config.showJurisdiction) {
        let jurisdictionDetails: string;
        if (jurisdiction.hasJurisdiction === 'yes') {
            const jurisdictionAnswers = formatJurisdictionAnswer(jurisdiction);
            jurisdictionDetails = [
                `有${CHECKED_CHECKBOX}`,
                jurisdictionAnswers,
                `无${BLANK_CHECKBOX}`
            ].join('\n');
        } else {
            jurisdictionDetails = `有${BLANK_CHECKBOX} 合同条款及内容：\n无${CHECKED_CHECKBOX}`;
        }
        const questionNumber = results.length + 1;
        results.push({
            question: `${questionNumber}.有无仲裁、法院管辖约定`,
            answers: jurisdictionDetails
        });
    }

    // 2. 诉前保全部分
    if (config.showPreservation) {
        let preservationDetails: string;
        if (pretrialPreservation.hasPreservation === 'yes') {
            const preservationAnswers = formatPreservationAnswer(pretrialPreservation);
            preservationDetails = [
                `是${CHECKED_CHECKBOX}`,
                preservationAnswers,
                `否${BLANK_CHECKBOX}`,
                `( ${PRESERVATION_NOTICE} )`
            ].filter(Boolean).join('\n');
        } else {
            preservationDetails = `是${BLANK_CHECKBOX} 保全法院：保全时间：保全案号： \n否${CHECKED_CHECKBOX} \n( ${PRESERVATION_NOTICE} )`;
        }
        
        const questionNumber = results.length + 1;
        results.push({
            question: `${questionNumber}.是否已经诉前保全`,
            answers: preservationDetails
        });
    }

    // 3. 申请鉴定部分
    if (config.showAppraisal) {
        let appraisalDetails: string;
        if (appraisal.hasAppraisal === 'yes') {
            const appraisalAnswers = formatAppraisalAnswer(appraisal);
            appraisalDetails = [
                `是${CHECKED_CHECKBOX}`,
                appraisalAnswers,
                `否${BLANK_CHECKBOX}`
            ].filter(Boolean).join('\n');
        } else {
            appraisalDetails = `是${BLANK_CHECKBOX} 鉴定事项：\n否${CHECKED_CHECKBOX}`;
        }
        
        const questionNumber = results.length + 1;
        results.push({
            question: `${questionNumber}.是否申请鉴定`,
            answers: appraisalDetails
        });
    }

    return results;
};

// 子组件：约定管辖
const JurisdictionSection: React.FC<{ path: string }> = ({ path }) => {
    const { register, control } = useFormContext();
    const hasJurisdiction = useWatch({
        control,
        name: `${path}.hasJurisdiction`,
    });

    return (
        <div className="grid grid-cols-12 gap-6 items-start">
            <div className="col-span-12 md:col-span-3">
                <label className="label">
                    <span className="label-text font-semibold">有无仲裁、法院管辖约定</span>
                </label>
            </div>

            <div className="col-span-12 md:col-span-9">
                <div className="flex gap-4">
                    <label className="label cursor-pointer justify-start gap-2">
                        <input
                            type="radio"
                            value="yes"
                            {...register(`${path}.hasJurisdiction`)}
                            className="radio radio-sm"
                        />
                        <span className="label-text">有</span>
                    </label>
                    <label className="label cursor-pointer justify-start gap-2">
                        <input
                            type="radio"
                            value="no"
                            {...register(`${path}.hasJurisdiction`)}
                            className="radio radio-sm"
                        />
                        <span className="label-text">无</span>
                    </label>
                </div>

                {hasJurisdiction === 'yes' && (
                    <div className="form-control">
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">合同条款及内容</legend>
                            <textarea
                                {...register(`${path}.contractContent`, {
                                    required: hasJurisdiction === 'yes' ? '请输入合同条款及内容' : false
                                })}
                                className="textarea textarea-bordered textarea-sm w-full"
                                rows={3}
                                placeholder="请输入合同条款及内容"
                            />
                            <div className="label">注明合同第几条，以及适用具体那条管辖法律法规</div>
                        </fieldset>
                    </div>
                )}
            </div>
        </div>
    );
};

// 子组件：诉前保全
const PreservationSection: React.FC<{ path: string }> = ({ path }) => {
    const { register, control } = useFormContext();
    const hasPreservation = useWatch({
        control,
        name: `${path}.hasPreservation`,
    });

    return (
        <div className="grid grid-cols-12 gap-6 items-start">
            <div className="col-span-12 md:col-span-3">
                <label className="label">
                    <span className="label-text font-semibold">是否已经诉前保全</span>
                </label>
            </div>

            <div className="col-span-12 md:col-span-9">
                <div className="flex gap-4">
                    <label className="label cursor-pointer justify-start gap-2">
                        <input
                            type="radio"
                            value="yes"
                            {...register(`${path}.hasPreservation`)}
                            className="radio radio-sm"
                        />
                        <span className="label-text">是</span>
                    </label>
                    <label className="label cursor-pointer justify-start gap-2">
                        <input
                            type="radio"
                            value="no"
                            {...register(`${path}.hasPreservation`)}
                            className="radio radio-sm"
                        />
                        <span className="label-text">否</span>
                    </label>
                </div>

                {hasPreservation === 'yes' && (
                    <div className="grid grid-cols-2 gap-4 mt-4 p-4 border rounded-md bg-base-200/50 transition-all duration-200">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text mr-2">保全法院</span>
                            </label>
                            <input
                                type="text"
                                {...register(`${path}.court`, {
                                    required: hasPreservation === 'yes' ? '请输入保全法院' : false
                                })}
                                className="input input-bordered input-sm"
                                placeholder="请输入保全法院"
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text mr-2">保全时间</span>
                            </label>
                            <input
                                type="date"
                                {...register(`${path}.date`, {
                                    required: hasPreservation === 'yes' ? '请选择保全时间' : false
                                })}
                                className="input input-bordered input-sm"
                            />
                        </div>
                        <div className="form-control col-span-2">
                            <label className="label">
                                <span className="label-text mr-2">保全案号</span>
                            </label>
                            <input
                                type="text"
                                {...register(`${path}.caseNumber`, {
                                    required: hasPreservation === 'yes' ? '请输入保全案号' : false
                                })}
                                className="input input-bordered input-sm"
                                placeholder="请输入保全案号"
                            />
                        </div>
                    </div>
                )}

                <p className="text-xs mt-2">
                    ( {PRESERVATION_NOTICE} )
                </p>
            </div>
        </div>
    );
};

// 子组件：申请鉴定
const AppraisalSection: React.FC<{ path: string }> = ({ path }) => {
    const { register, control } = useFormContext();
    const hasAppraisal = useWatch({
        control,
        name: `${path}.hasAppraisal`,
    });

    return (
        <div className="grid grid-cols-12 gap-6 items-start">
            <div className="col-span-12 md:col-span-3">
                <label className="label">
                    <span className="label-text font-semibold">是否申请鉴定</span>
                </label>
            </div>

            <div className="col-span-12 md:col-span-9">
                <div className="flex gap-4">
                    <label className="label cursor-pointer justify-start gap-2">
                        <input
                            type="radio"
                            value="yes"
                            {...register(`${path}.hasAppraisal`)}
                            className="radio radio-sm"
                        />
                        <span className="label-text">是</span>
                    </label>
                    <label className="label cursor-pointer justify-start gap-2">
                        <input
                            type="radio"
                            value="no"
                            {...register(`${path}.hasAppraisal`)}
                            className="radio radio-sm"
                        />
                        <span className="label-text">否</span>
                    </label>
                </div>

                {hasAppraisal === 'yes' && (
                    <div className="form-control mt-4">
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">鉴定事项</legend>
                            <textarea
                                {...register(`${path}.appraisalItems`, {
                                    required: hasAppraisal === 'yes' ? '请输入鉴定事项' : false
                                })}
                                className="textarea textarea-bordered textarea-sm  w-full"
                                rows={3}
                                placeholder="请输入需要鉴定的事项"
                            />
                        </fieldset>
                    </div>
                )}
            </div>
        </div>
    );
};

// 主组件
interface Props {
    path: string;
    config?: FormConfig;
    title?: string;
}

export const JurisdictionPreservationAppraisalForm: React.FC<Props> = ({ 
    path, 
    config = FORM_CONFIGS.ALL,
    title = "约定管辖、诉前保全及鉴定申请"
}) => {
    const sections = [];
    
    if (config.showJurisdiction) {
        sections.push(
            <JurisdictionSection key="jurisdiction" path={`${path}.jurisdiction`} />
        );
    }
    
    if (config.showPreservation) {
        sections.push(
            <PreservationSection key="preservation" path={`${path}.pretrialPreservation`} />
        );
    }
    
    if (config.showAppraisal) {
        sections.push(
            <AppraisalSection key="appraisal" path={`${path}.appraisal`} />
        );
    }

    return (
        <FormSectionCard title={title}>
            {sections.map((section, index) => (
                <React.Fragment key={index}>
                    {section}
                    {index < sections.length - 1 && <div className="divider"></div>}
                </React.Fragment>
            ))}
        </FormSectionCard>
    );
};

// 自定义Hook
export const useJurisdictionPreservationAppraisal = (path: string) => {
    const { watch } = useFormContext();

    const jurisdiction = watch(`${path}.jurisdiction`);
    const pretrialPreservation = watch(`${path}.pretrialPreservation`);
    const appraisal = watch(`${path}.appraisal`);

    return {
        jurisdiction,
        pretrialPreservation,
        appraisal,
        hasJurisdiction: jurisdiction?.hasJurisdiction === 'yes',
        hasPreservation: pretrialPreservation?.hasPreservation === 'yes',
        hasAppraisal: appraisal?.hasAppraisal === 'yes'
    };
};
