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

interface JurisdictionAndPreservationData {
    jurisdiction?: JurisdictionData;
    pretrialPreservation?: PreservationData;
}

interface JurisdictionAndPreservationOrgin {
    jurisdictionAndPreservation: JurisdictionAndPreservationData;
}


// 常量定义
const PRESERVATION_NOTICE = "如申请诉讼保全，请另行提交诉讼保全申请及相关材料";
const PLACEHOLDER_TEXT = "__________";



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

// 格式化函数 - 优化版
export const formatJurisdictionAndPreservationForDocx = (formData: JurisdictionAndPreservationOrgin): QuestionListItem[] => {
    const { jurisdiction = {}, pretrialPreservation = {} } = formData.jurisdictionAndPreservation;
    console.log('formData:', formData);
    let jurisdictionDetails: string
    // 1. 约定管辖部分
    if (jurisdiction.hasJurisdiction === 'yes') {
        const jurisdictionAnswers = formatJurisdictionAnswer(jurisdiction);
        jurisdictionDetails = [
            `有${CHECKED_CHECKBOX}`,
            jurisdictionAnswers,
            `无${BLANK_CHECKBOX}`
        ].join('\n');

    } else {
        jurisdictionDetails = `有${BLANK_CHECKBOX} 合同条款及内容：\n无${CHECKED_CHECKBOX}`
    }




    // 2. 诉前保全部分
    let preservationDetails = '';
    if (pretrialPreservation.hasPreservation === 'yes') {
        const preservationAnswers = formatPreservationAnswer(pretrialPreservation)
        preservationDetails = [
            `是${CHECKED_CHECKBOX}`,
            preservationAnswers,
            `否${BLANK_CHECKBOX}`,
            `( ${PRESERVATION_NOTICE} )`
        ].filter(Boolean).join('\n');

    } else {
        preservationDetails = `是${BLANK_CHECKBOX} 保全法院：保全时间：保全案号： \n否${CHECKED_CHECKBOX} \n( ${PRESERVATION_NOTICE} )`
    }



    return [
        {
            question: '1.有无仲裁、法院管辖约定',
            answers: jurisdictionDetails
        },
        {
            question: '2.是否已经诉前保全',
            answers: preservationDetails
        }
    ];
};

// 子组件拆分
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
                                className="textarea textarea-bordered textarea-sm"
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
                    <span className="font-semibold">是否已经诉前保全</span>
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

                <p className="text-xs  mt-2">
                    ( {PRESERVATION_NOTICE} )
                </p>
            </div>
        </div>
    );
};

// 主组件 - 优化版
interface Props {
    path: string;
}

export const JurisdictionAndPreservationForm: React.FC<Props> = ({ path }) => {
    return (
        <FormSectionCard title="约定管辖和诉前保全">
            <JurisdictionSection path={`${path}.jurisdiction`} />
            <div className="divider"></div>
            <PreservationSection path={`${path}.pretrialPreservation`} />
        </FormSectionCard>
    );
};

// 自定义Hook（可选）
export const useJurisdictionAndPreservation = (path: string) => {
    const { watch } = useFormContext();

    const jurisdiction = watch(`${path}.jurisdiction`);
    const pretrialPreservation = watch(`${path}.pretrialPreservation`);

    return {
        jurisdiction,
        pretrialPreservation,
        hasJurisdiction: jurisdiction?.hasJurisdiction === 'yes',
        hasPreservation: pretrialPreservation?.hasPreservation === 'yes'
    };
};