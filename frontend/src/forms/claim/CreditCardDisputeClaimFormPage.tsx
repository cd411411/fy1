/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { FormPageLayout } from "../../layouts/FormPageLayout";
import { FormSectionCard } from "../../layouts/FormSectionCard";
import { PartyList } from "../../layouts/PartyList";
import { AgentList } from "../../layouts/AgentList";
import { MediationForm } from "../../components/MediationForm";
import { BasicInfoSection } from "../../components/BasicInfoSection";
import {
    formatPartiesForDocx,
    formatAgentsForDocx,
    formatMediationForDocx,
    formatFormData,
    generateSelectionText,
    formatMoneyWithCN,
} from "../../utils/formatter";

import { AIChatbotPanel } from "../../components/AIChatbotPanel";
import { OptimizableTextarea } from "../../components/OptimizableTextarea";
import {
    JurisdictionAndPreservationForm,
    formatJurisdictionAndPreservationForDocx,
} from "../../components/claim/JurisdictionAndPreservationForm";
import { QuestionTable } from "../../components/claim/QuestionTable";
import type { QuestionConfig } from "../../components/claim/QuestionTable";
import { getValueFromPath, formatDateToChinese } from "../../utils/formatter";
import FormField from "../../components/claim/FormField";

// 定义案件类型
const CASE_TYPE = "信用卡纠纷";

const processFormDataForPreview = (data: any) => {
    // 1. 定义当事人蓝图
    const partyBlueprint_plaintiffs = [
        {
            path: "plaintiffs_natural",
            roleText: "原告\n(自然人)",
            type: "natural" as const,
        },
        {
            path: "plaintiffs_legal",
            roleText: "原告\n(法人/非法人组织)",
            type: "legal" as const,
        },
    ];

    const partyBlueprint_others = [
        {
            path: "defendants_natural",
            roleText: "被告\n(自然人)",
            type: "natural" as const,
        },
        {
            path: "defendants_legal",
            roleText: "被告\n(法人/非法人组织)",
            type: "legal" as const,
        },
        {
            path: "third_parties_natural",
            roleText: "第三人\n(自然人)",
            type: "natural" as const,
        },
        {
            path: "third_parties_legal",
            roleText: "第三人\n(法人/非法人组织)",
            type: "legal" as const,
        },
    ];

    // 2. 构建最终提交的数据对象
    return {
        case_type: data.basicInfo?.caseCause,
        case_number: data.basicInfo?.caseNumber || `起诉状-${Date.now()}`,
        partyInfo: [
            ...formatPartiesForDocx(data, partyBlueprint_plaintiffs),
            ...formatAgentsForDocx(data),
            ...formatPartiesForDocx(data, partyBlueprint_others),
        ],
        claimItems: formatFormData("claim", data, claimsConfig),
        jurisdictionAndPreservation: formatJurisdictionAndPreservationForDocx(data),
        factItems: formatFormData("facts", data, factsConfig),
        mediationInfo: formatMediationForDocx(data),
    };
};

// 诉讼请求配置
const claimsConfig: QuestionConfig[] = [
    {
        type: "custom",
        path: "claims.c1_principal",
        title: "1. 透支本金",
        children: () => {
            const { control, watch, register } = useFormContext();
            const currencyType = watch("claims.c1_principal.currency");
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <FormField
                        path="claims.c1_principal.date"
                        label="截至日期"
                        type="date"
                        frontLabel="截至"
                    />
                    <FormField
                        path="claims.c1_principal.amount"
                        label="尚欠本金"
                        type="money"
                        frontLabel="尚欠本金"
                        placeholder="输入金额"
                    />
                    <div className="md:col-span-2">
                        <label className="label pb-1">
                            <span className="label-text">币种</span>
                        </label>
                        <Controller
                            name="claims.c1_principal.currency"
                            control={control}
                            defaultValue="RMB"
                            render={({ field }) => (
                                <div className="flex items-center gap-x-4 pt-1 m-1">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" {...field} value="RMB" checked={field.value === "RMB"} className="radio radio-sm" />
                                        <span className="ml-2">人民币</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" {...field} value="other" checked={field.value === "other"} className="radio radio-sm" />
                                        <span className="ml-2">外币</span>
                                    </label>
                                    {currencyType === "other" && (
                                        <input type="text" {...register("claims.c1_principal.currencyName")} className="input input-bordered input-sm w-auto" placeholder="请输入外币名称, 如美元" />
                                    )}
                                </div>
                            )}
                        />
                    </div>
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "claims.c1_principal") || {};
            const dateText = data.date ? `截至 ${formatDateToChinese(data.date)} 止, ` : "截至    止, ";
            const amountText = `尚欠本金 ${formatMoneyWithCN(data.amount)}`;
            let currencyText = "";
            if (data.currency === "RMB") {
                currencyText = "(人民币, 下同; 如为外币需特别注明)";
            } else if (data.currency === "other") {
                currencyText = data.currencyName ? `(${data.currencyName}，下同)` : "(外币, 需特别注明)";
            }
            return `${dateText}${amountText} ${currencyText}`;
        },
    },
    {
        type: "custom",
        path: "claims.c2_fees",
        title: "2. 利息、罚息、复利、滞纳金、违约金、手续费等",
        children: () => (
            <div className="flex flex-col gap-y-2">
                <div className="grid grid-cols-2 gap-x-4">
                    <FormField path="claims.c2_fees.date" label="截至日期" type="date" frontLabel="截至" />
                    <FormField path="claims.c2_fees.totalAmount" label="共计金额" type="money" frontLabel="共计" />
                </div>
                <FormField path="claims.c2_fees.calculationStartDate" label="后续费用计算起始日" type="date" frontLabel="自" endLabel="之后的利息、罚息...等各项费用按照信用卡领用协议计算至实际清偿之日止" />
                <FormField path="claims.c2_fees.details" label="明细" type="textarea" placeholder="请在此处填写各项费用的明细..." />
            </div>
        ),
        formatter: (formData) => {
            const data = getValueFromPath(formData, "claims.c2_fees") || {};
            const dateText = data.date ? `截至 ${formatDateToChinese(data.date)} 止, ` : "截至    止, ";
            const amountText = `欠利息、罚息、复利、滞纳金、违约金、手续费等共计 ${formatMoneyWithCN(data.totalAmount)}`;
            const futureCalcDate = data.calculationStartDate ? formatDateToChinese(data.calculationStartDate) : "____年____月____日";
            const futureText = `自 ${futureCalcDate} 之后的利息、罚息、复利、滞纳金、违约金以及手续费等各项费用按照信用卡领用协议计算至实际清偿之日止`;
            const detailsText = `明细: ${data.details || ' '}`;
            return `${dateText}${amountText}\n${futureText}\n${detailsText}`;
        }
    },
    {
        type: "radio",
        path: "claims.c3_security_rights_check",
        title: "3. 是否主张担保权利",
        options: [{ value: "yes", label: "是" }, { value: "no", label: "否" }],
        enableDetails: true,
        detailsLabel: "内容",
    },
    {
        type: "radio",
        path: "claims.c4_realization_costs_check",
        title: "4. 是否主张实现债权的费用",
        options: [{ value: "yes", label: "是" }, { value: "no", label: "否" }],
        enableDetails: true,
        detailsLabel: "费用明细",
    },
    {
        type: "radio",
        path: "claims.c5_litigation_costs_check",
        title: "5. 是否主张诉讼费用",
        options: [{ value: "yes", label: "是" }, { value: "no", label: "否" }],
    },
    {
        type: "optimizationContext",
        path: "claims.c6_other_claims",
        title: "6. 其他请求",
    },
    {
        type: "optimizationContext",
        path: "claims.c7_total_amount",
        title: "7. 标的总额",
    },
];

// 事实与理由配置
const factsConfig: QuestionConfig[] = [
    {
        type: "optimizationContext",
        path: "facts.f1_card_details",
        title: "1. 信用卡办理情况 (信用卡卡号、信用卡登记权利人、办卡时间、办卡行等)",
    },
    {
        type: "custom",
        path: "facts.f2_agreement_terms",
        title: "2. 信用卡合约的主要约定",
        children: () => (
            <div className="flex flex-col gap-y-2">
                <FormField path="facts.f2_agreement_terms.overdraftAmount" label="透支金额" type="money" frontLabel="透支金额" />
                <FormField path="facts.f2_agreement_terms.feeCalculation" label="利息、罚息、复利、滞纳金、违约金、手续费等的计算标准" type="textarea" />
                <FormField path="facts.f2_agreement_terms.liability" label="违约责任" type="textarea" />
                <FormField path="facts.f2_agreement_terms.termination" label="解除条件" type="textarea" />
            </div>
        ),
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f2_agreement_terms") || {};
            return `透支金额: ${formatMoneyWithCN(data.overdraftAmount)}\n利息、罚息、复利、滞纳金、违约金、手续费等的计算标准: ${data.feeCalculation || ' '}\n违约责任: ${data.liability || ' '}\n解除条件: ${data.termination || ' '}`;
        }
    },
    {
        type: "custom",
        path: "facts.f3_highlight_notice",
        title: "3. 是否就信用卡合约主要条款进行提示注意",
        children: () => {
            const { watch } = useFormContext();
            const hasNotified = watch("facts.f3_highlight_notice.hasNotified");
            return (
                <div>
                    <FormField path="facts.f3_highlight_notice.hasNotified" type="radio" options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]} />
                    {hasNotified === 'yes' && <FormField path="facts.f3_highlight_notice.details" label="提示说明的具体方式以及时间地点" type="optimizable-textarea" />}
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f3_highlight_notice") || {};
            const radioText = generateSelectionText(['是', '否'], data.hasNotified);
            const detailsText = data.hasNotified === 'yes' ? `\n提示说明的具体方式以及时间地点: ${data.details || ' '}` : '';
            return `${radioText}${detailsText}`;
        }
    },
    {
        type: "custom",
        path: "facts.f4_overdue_paid_amount",
        title: "4. 被告逾期部分已还金额",
        children: () => (
            <FormField
                path="facts.f4_overdue_paid_amount.amount"
                label=""
                type="money"
                placeholder="金额"
                frontLabel="已还金额"
            />
        ),
        formatter: (formData) => {
            // 从嵌套路径中获取数据
            const data = getValueFromPath(formData, "facts.f4_overdue_paid_amount") || {};
            // 使用 formatMoneyWithCN 来处理金额格式化
            return formatMoneyWithCN(data.amount);
        },
    },
    {
        type: "custom",
        path: "facts.f5_overdue_outstanding_amount",
        title: "5. 被告逾期未还款金额",
        children: () => (
            <div className="flex flex-col gap-y-2">
                <FormField path="facts.f5_overdue_outstanding_amount.overdueDate" label="逾期时间" type="date" frontLabel="逾期时间" />
                <FormField path="facts.f5_overdue_outstanding_amount.asOfDate" label="截至日期" type="date" frontLabel="截至" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <FormField path="facts.f5_overdue_outstanding_amount.principal" label="欠付信用卡本金" type="money" frontLabel="欠付信用卡本金" />
                    <FormField path="facts.f5_overdue_outstanding_amount.interest" label="利息" type="money" frontLabel="利息" />
                    <FormField path="facts.f5_overdue_outstanding_amount.penalty" label="罚息" type="money" frontLabel="罚息" />
                    <FormField path="facts.f5_overdue_outstanding_amount.compound" label="复利" type="money" frontLabel="复利" />
                    <FormField path="facts.f5_overdue_outstanding_amount.lateFee" label="滞纳金" type="money" frontLabel="滞纳金" />
                    <FormField path="facts.f5_overdue_outstanding_amount.liquidatedDamages" label="违约金" type="money" frontLabel="违约金" />
                    <FormField path="facts.f5_overdue_outstanding_amount.serviceFee" label="手续费" type="money" frontLabel="手续费" />
                </div>
            </div>
        ),
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f5_overdue_outstanding_amount") || {};
            const overdueDate = data.overdueDate ? `逾期时间: ${formatDateToChinese(data.overdueDate)}` : "逾期时间: ________";
            const asOfDate = data.asOfDate ? `截至 ${formatDateToChinese(data.asOfDate)} 日, 被告` : "截至 ________ 日, 被告";
            const text = `${overdueDate}\n${asOfDate} 欠付信用卡本金 ${formatMoneyWithCN(data.principal)}, 利息 ${formatMoneyWithCN(data.interest)}, 罚息 ${formatMoneyWithCN(data.penalty)}, 复利 ${formatMoneyWithCN(data.compound)}, 滞纳金 ${formatMoneyWithCN(data.lateFee)}, 违约金 ${formatMoneyWithCN(data.liquidatedDamages)}, 手续费 ${formatMoneyWithCN(data.serviceFee)}`;
            return text;
        }
    },
    {
        type: "custom",
        path: "facts.f6_notice_and_collection",
        title: "6. 是否向被告进行通知和催收",
        children: () => {
            const { watch } = useFormContext();
            const hasNotified = watch("facts.f6_notice_and_collection.hasNotified");
            return (
                <div>
                    <FormField
                        path="facts.f6_notice_and_collection.hasNotified"
                        label=""
                        type="radio"
                        options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]}
                    />
                    {hasNotified === 'yes' && (
                        <div className="mt-2">
                            <FormField
                                path="facts.f6_notice_and_collection.details"
                                label="具体情况"
                                type="optimizable-textarea"
                                placeholder="请说明具体情况..."
                                optimizationContext="关于向信用卡持卡人进行通知和催收的具体情况说明。"
                            />
                        </div>
                    )}
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f6_notice_and_collection") || {};
            const radioText = generateSelectionText(['是', '否'], data.hasNotified);
            const detailsText = data.hasNotified === 'yes' ? `\n具体情况: ${data.details || '____'}` : '';
            return `${radioText}${detailsText}`;
        }
    },
    {
        type: "custom",
        path: "facts.f7_collateral_agreement",
        title: "7. 是否签订物的担保 (抵押、质押) 合同",
        children: () => {
            const { watch } = useFormContext();
            const hasAgreement = watch("facts.f7_collateral_agreement.hasAgreement");
            return (
                <div>
                    <FormField
                        path="facts.f7_collateral_agreement.hasAgreement"
                        label=""
                        type="radio"
                        options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]}
                    />
                    {hasAgreement === 'yes' && (
                        <div className="mt-2">
                            <FormField
                                path="facts.f7_collateral_agreement.signingDate"
                                label="签订时间"
                                type="date"
                                frontLabel="签订时间"
                            />
                        </div>
                    )}
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f7_collateral_agreement") || {};
            const radioText = generateSelectionText(['是', '否'], data.hasAgreement);
            let detailsText = '';
            if (data.hasAgreement === 'yes') {
                const dateText = data.signingDate ? `签订时间: ${formatDateToChinese(data.signingDate)}` : "签订时间: ____";
                // 在同一行附加详情，以匹配常见表单布局
                detailsText = ` ${dateText}`;
            }
            return `${radioText}${detailsText}`;
        }
    },
    {
        type: "custom",
        path: "facts.f8_guarantor_and_collateral",
        title: "8. 担保人、担保物",
        children: () => (
            <div className="flex flex-col gap-y-2">
                <FormField path="facts.f8_guarantor_and_collateral.guarantor" label="担保人" frontLabel="担保人" type="text" />
                <FormField path="facts.f8_guarantor_and_collateral.collateral" label="担保物" frontLabel="担保物" type="text" />
            </div>
        ),
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f8_guarantor_and_collateral") || {};
            return `担保人: ${data.guarantor || "____"}\n担保物: ${data.collateral || "____"}`;
        }
    },
    {
        type: "custom",
        path: "facts.f9_max_amount_guarantee",
        title: "9. 是否最高额担保 (抵押、质押)",
        children: () => {
            const { watch } = useFormContext();
            const isMaxAmount = watch("facts.f9_max_amount_guarantee.isMaxAmount");
            return (
                <div>
                    <FormField path="facts.f9_max_amount_guarantee.isMaxAmount" label="" type="radio" options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]} />
                    {isMaxAmount === "yes" && (
                        <div className="mt-2 flex flex-col gap-y-2 ">
                            <FormField path="facts.f9_max_amount_guarantee.claimFixingDate" label="担保债权的确定时间" type="date" frontLabel="担保债权的确定时间" />
                            <FormField path="facts.f9_max_amount_guarantee.maxAmount" label="担保额度" type="money" frontLabel="担保额度" />
                        </div>
                    )}
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f9_max_amount_guarantee") || {};
            const checkText = generateSelectionText(["是", "否"], data.isMaxAmount);
            let text = `${checkText}`;
            if (data.isMaxAmount === "yes") {
                const dateText = data.claimFixingDate ? formatDateToChinese(data.claimFixingDate) : "____";
                const amountText = formatMoneyWithCN(data.maxAmount);
                text += `\n担保债权的确定时间: ${dateText}\n担保额度: ${amountText}`;
            }
            return text;
        }
    },
    {
        type: "custom",
        path: "facts.f10_registration",
        title: "10. 是否办理抵押、质押登记",
        children: () => {
            const { watch } = useFormContext();
            const isRegistered = watch("facts.f10_registration.isRegistered");
            return (
                <div>
                    <FormField path="facts.f10_registration.isRegistered" label="" type="radio" options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]} />
                    {isRegistered === "yes" && (
                        <div className="mt-2 ">
                            <FormField path="facts.f10_registration.registrationType" label="" type="radio" options={[{ value: "formal", label: "正式登记" }, { value: "preliminary", label: "预告登记" }]} />
                        </div>
                    )}
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f10_registration") || {};
            let text = generateSelectionText(["是", "否"], data.isRegistered);
            if (data.isRegistered === 'yes') {
                const typeText = generateSelectionText(["正式登记", "预告登记"], data.registrationType === 'formal' ? '正式登记' : '预告登记');
                text += `\n ${typeText}`;
            }
            return text;
        }
    },
    {
        type: "custom",
        path: "facts.f11_guarantee_contract",
        title: "11. 是否签订保证合同",
        children: () => {
            const { watch } = useFormContext();
            const hasContract = watch("facts.f11_guarantee_contract.hasContract");
            return (
                <div>
                    <FormField path="facts.f11_guarantee_contract.hasContract" label="" type="radio" options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]} />
                    {hasContract === "yes" && (
                        <div className="mt-2 flex flex-col gap-y-2 ">
                            <FormField path="facts.f11_guarantee_contract.signingDate" label="签订时间" type="date" frontLabel="签订时间" />
                            <FormField path="facts.f11_guarantee_contract.guarantorName" label="保证人" type="text" frontLabel="保证人" />
                            <FormField path="facts.f11_guarantee_contract.mainContent" label="主要内容" type="textarea" />
                        </div>
                    )}
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f11_guarantee_contract") || {};
            const hasContract = data.hasContract === 'yes';
            const yesCheckbox = hasContract ? '☑' : '☐';
            const noCheckbox = !hasContract ? '☑' : '☐';
            const dateText = hasContract ? (data.signingDate ? formatDateToChinese(data.signingDate) : "____") : "";
            const guarantorName = hasContract ? (data.guarantorName || "____") : "";
            const mainContent = hasContract ? (data.mainContent || "____") : "";

            const line1 = `是${yesCheckbox} 签订时间: ${dateText}  保证人: ${guarantorName}`;
            const line2 = `      主要内容: ${mainContent}`;
            const line3 = `否${noCheckbox}`;

            if (!hasContract) {
                return `是${yesCheckbox} 签订时间:             保证人:\n      主要内容:\n否${noCheckbox}`;
            }
            return `${line1}\n${line2}\n${line3}`;
        },
    },
    {
        type: "custom",
        path: "facts.f12_guarantee_method",
        title: "12. 保证方式",
        children: () => (<FormField path="facts.f12_guarantee_method.type" label="" type="radio" options={[{ value: "general", label: "一般保证" }, { value: "joint", label: "连带责任保证" }]} />),
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f12_guarantee_method") || {};
            return generateSelectionText(["一般保证", "连带责任保证"], data.type === 'general' ? '一般保证' : '连带责任保证', '\n');
        }
    },
    {
        type: "custom",
        path: "facts.f13_other_guarantee",
        title: "13. 其他担保方式",
        children: () => {
            const { watch } = useFormContext();
            const hasOther = watch("facts.f13_other_guarantee.hasOther");
            return (
                <div>
                    <FormField path="facts.f13_other_guarantee.hasOther" label="" type="radio" options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]} />
                    {hasOther === "yes" && (
                        <div className="mt-2 flex gap-x-1 ">
                            <FormField path="facts.f13_other_guarantee.form" label="形式" type="text" frontLabel="形式" />
                            <FormField path="facts.f13_other_guarantee.signingDate" label="签订时间" type="date" frontLabel="签订时间" />
                        </div>
                    )}
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f13_other_guarantee") || {};
            let text = generateSelectionText(["是", "否"], data.hasOther);
            if (data.hasOther === "yes") {
                const formText = data.form || "____";
                const dateText = data.signingDate ? formatDateToChinese(data.signingDate) : "____";
                text += `\n形式: ${formText} 签订时间: ${dateText}`;
            }
            return text;
        },
    },
    {
        type: "LegalAnalysisField",
        path: "facts.f14_liability_basis",
        title: "14. 请求承担责任的依据",
        placeholder: "合同约定：\n法律规定：",
        formDataProcessor: processFormDataForPreview,
    },
    {
        type: "optimizationContext",
        path: "facts.f15_other_notes",
        title: "15. 其他需要说明的内容(可另附页)",
    },
    {
        type: "textarea",
        path: "facts.f16_evidence_list",
        title: "16. 证据清单(可另附页)",
    },
];

// Sections
const ClaimsSection: React.FC = () => (
    <FormSectionCard title="诉讼请求">
        <OptimizableTextarea
            path="claims.fullStatement"
            label="完整陈述"
            placeholder="可在此处完整表述您的诉讼请求..."
            rows={3}
            optimizationContext="这是原告关于本信用卡纠纷案件的诉讼请求完整陈述。"
        />
        <p className="text-sm my-2">为方便、准确梳理要点，相关内容请在下方要素式表格中填写：</p>
        <table className="table w-full">
            <tbody>
                <QuestionTable config={claimsConfig} />
            </tbody>
        </table>
    </FormSectionCard>
);

const FactsAndReasonsSection: React.FC = () => (
    <FormSectionCard title="事实与理由">
        <OptimizableTextarea
            path="facts.fullStatement"
            label="完整陈述"
            placeholder="可在此处完整表述纠纷涉及的事实与理由..."
            rows={3}
            optimizationContext="这是一段关于信用卡纠纷的案件事实与理由陈述。"
        />
        <p className="text-sm my-2">为方便、准确梳理要点，相关内容请在下方要素式表格中填写：</p>
        <table className="table w-full">
            <tbody>
                <QuestionTable config={factsConfig} />
            </tbody>
        </table>
    </FormSectionCard>
);


// Main Page Component
export const CreditCardDisputeClaimFormPage: React.FC = () => {
    const title = `民事起诉状 (${CASE_TYPE})`;

    const handleFormSubmit = async (data: any) => {
        const final = processFormDataForPreview(data);
        const payload = { formData: data, final };
        console.log("最终提交的起诉状Payload:", JSON.stringify(payload, null, 2));
    };

    const rightSide = <AIChatbotPanel />;

    return (
        <FormPageLayout
            title={title}
            formId="claim_credit_card_dispute"
            onSubmit={handleFormSubmit}
            onPreviewData={processFormDataForPreview}
            rightPanel={rightSide}
            docType="起诉状"
            fixedFormValues={{ basicInfo: { caseCause: CASE_TYPE } }}
        >
            <BasicInfoSection case_type={CASE_TYPE} />
            <FormSectionCard title="原告">
                <PartyList path="plaintiffs_natural" title="自然人" partyType="natural" />
                <div className="divider my-4"></div>
                <PartyList path="plaintiffs_legal" title="法人/非法人组织" partyType="legal" />
            </FormSectionCard>
            <AgentList path="agents" />
            <FormSectionCard title="被告">
                <PartyList path="defendants_natural" title="自然人" partyType="natural" />
                <div className="divider my-4"></div>
                <PartyList path="defendants_legal" title="法人/非法人组织" partyType="legal" />
            </FormSectionCard>
            <FormSectionCard title="第三人">
                <PartyList path="third_parties_natural" title="自然人" partyType="natural" />
                <div className="divider my-4"></div>
                <PartyList path="third_parties_legal" title="法人/非法人组织" partyType="legal" />
            </FormSectionCard>

            <ClaimsSection />
            <JurisdictionAndPreservationForm path="jurisdictionAndPreservation" />
            <FactsAndReasonsSection />
            <FormSectionCard title="对纠纷解决方式的意愿">
                <MediationForm path="mediation" />
            </FormSectionCard>
        </FormPageLayout>
    );
};

export default CreditCardDisputeClaimFormPage;