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
    formatNumberToCN,
    formatMoneyWithCN
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
const CASE_TYPE = "金融借款合同纠纷";

const processFormDataForPreview = (data: any) => {
    // 1. 定义当事人蓝图，供 formatPartiesForDocx 使用
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
        title: "1. 本金",
        children: () => {
            const { control, watch, register } = useFormContext();
            const currencyType = watch("claims.c1.currency");

            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <FormField
                        path="claims.c1.date"
                        label="截至日期"
                        type="date"
                        frontLabel="截至"
                    />
                    <FormField
                        path="claims.c1.amount"
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
                            name="claims.c1.currency"
                            control={control}
                            defaultValue="RMB"
                            render={({ field }) => (
                                <div className="flex items-center gap-x-4 pt-1 m-1">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            {...field}
                                            value="RMB"
                                            checked={field.value === "RMB"}
                                            className="radio radio-sm"
                                        />
                                        <span className="ml-2">人民币</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            {...field}
                                            value="other"
                                            checked={field.value === "other"}
                                            className="radio radio-sm"
                                        />
                                        <span className="ml-2">外币</span>
                                    </label>
                                    {currencyType === "other" && (
                                        <input
                                            type="text"
                                            {...register("claims.c1.currencyName")}
                                            className="input input-bordered input-sm w-auto"
                                            placeholder="请输入外币名称, 如美元"
                                        />
                                    )}
                                </div>
                            )}
                        />
                    </div>
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "claims.c1") || {};
            const dateText = data.date
                ? `截至 ${formatDateToChinese(data.date)} 止, `
                : "截至    止, ";
            const amountText = data.amount
                ? `尚欠本金 ${formatMoneyWithCN(data.amount)}`
                : "尚欠本金     元";
            let currencyText = "";
            if (data.currency === "RMB") {
                currencyText = "(人民币, 下同)";
            } else if (data.currency === "other") {
                currencyText = data.currencyName
                    ? `(外币: ${data.currencyName})`
                    : "(外币, 需特别注明)";
            }
            return `${dateText}${amountText} ${currencyText}`;
        },
    },
    {
        type: "custom",
        path: "claims.c2_interest",
        title: "2. 利息 (期内利息、复利、罚息)",
        children: () => {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <FormField
                        path="claims.c2.date"
                        label="利息计算截至日期"
                        type="date"
                        placeholder="请选择"
                        frontLabel="截至日期"
                        className="col-span-2"
                    />
                    <FormField
                        path="claims.c2.regularInterest"
                        label="期内利息"
                        type="money"
                        placeholder="期内利息金额"
                        frontLabel="期内利息"
                    />
                    <FormField
                        path="claims.c2.compoundInterest"
                        label="复利"
                        type="money"
                        placeholder="复利金额"
                        frontLabel="复利"
                    />
                    <FormField
                        path="claims.c2.penaltyInterest"
                        label="罚息 (违约金)"
                        type="money"
                        placeholder="罚息金额"
                        frontLabel="罚息(违约金)"
                    />
                    <FormField
                        path="claims.c2.totalInterest"
                        label="总利息"
                        type="money"
                        placeholder="总利息金额"
                        frontLabel="总利息"
                    />
                    <FormField
                        path="claims.c2.howToCalculate"
                        label="计算方式"
                        type="optimizable-textarea"
                        placeholder="输入计算方式"
                        optimizationContext="原告关于被告所欠利息的计算方式说明"
                        className="col-span-2"
                    />
                    <FormField
                        path="claims.c2.payToNow"
                        label="是否请求支付至实际清偿之日止："
                        type="radio"
                        options={[
                            { value: "yes", label: "是" },
                            { value: "no", label: "否" },
                        ]}
                    />
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "claims.c2") || {};
            const dateText = data.date ? `截至 ${formatDateToChinese(data.date)} 止, ` : "截至    止, ";
            const totalText = data.totalInterest ? `欠利息 ${formatMoneyWithCN(data.totalInterest)} 、` : "欠利息     元、";
            const regularText = data.regularInterest ? `期内利息 ${formatMoneyWithCN(data.regularInterest)} 、` : "期内利息     元、";
            const compoundText = data.compoundInterest ? `复利 ${formatMoneyWithCN(data.compoundInterest)} 、` : "复利     元、";
            const penaltyText = data.penaltyInterest ? `罚息(违约金) ${formatMoneyWithCN(data.penaltyInterest)} ;` : "罚息(违约金)     元;";
            const howToCalculate = data.howToCalculate ? `计算方式：\n${data.howToCalculate}` : "计算方式：";
            const payToNowOptions = generateSelectionText(["是", "否"], data.payToNow);

            return `${dateText}${totalText}${regularText}${compoundText}${penaltyText}\n${howToCalculate}\n是否请求支付至实际清偿之日止：${payToNowOptions}`;
        },
    },
    {
        type: "custom",
        path: "claims.c3_repayment_action_check",
        title: "3. 是否要求提前还款或解除合同",
        children: () => {
            const { watch } = useFormContext();
            const requestAction = watch("claims.c3.requestAction");

            return (
                <div className="flex flex-col gap-y-2">
                    <FormField
                        path="claims.c3.requestAction"
                        label=""
                        type="radio"
                        options={[
                            { value: "yes", label: "是" },
                            { value: "no", label: "否" },
                        ]}
                    />
                    {requestAction === "yes" && (
                        <div className=" pt-2 mt-2 border-l-2 border-base-200">
                            <label className="label pb-1">
                                <span className="label-text text-base-content/70">
                                    请选择具体方式:
                                </span>
                            </label>
                            <FormField
                                path="claims.c3.actionType"
                                label=""
                                type="radio"
                                options={[
                                    { value: "earlyRepayment", label: "提前还款（加速到期）" },
                                    { value: "terminateContract", label: "解除合同" },
                                ]}
                            />
                        </div>
                    )}
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "claims.c3") || {};
            const yesNoOptions = {
                是: data.requestAction === "yes",
                否: data.requestAction === "no"
            };
            const actionOptions = {
                "提前还款（加速到期）": data.actionType === "earlyRepayment",
                "解除合同": data.actionType === "terminateContract",
            };

            let line1 = `是${yesNoOptions['是'] ? '☑' : '☐'} 提前还款（加速到期）${actionOptions['提前还款（加速到期）'] && yesNoOptions['是'] ? '☑' : '☐'} / 解除合同${actionOptions['解除合同'] && yesNoOptions['是'] ? '☑' : '☐'}`;
            let line2 = `否${yesNoOptions['否'] ? '☑' : '☐'}`;

            return `${line1}\n${line2}`;
        },
    },
    {
        type: "radio",
        path: "claims.c4_security_rights_check",
        title: "4. 是否主张担保权利",
        options: [
            { value: "yes", label: "是" },
            { value: "no", label: "否" },
        ],
        enableDetails: true,
        detailsLabel: "内容",
    },
    {
        type: "radio",
        path: "claims.c5_realization_costs_check",
        title: "5. 是否主张实现债权的费用",
        options: [
            { value: "yes", label: "是" },
            { value: "no", label: "否" },
        ],
        enableDetails: true,
        detailsLabel: "明细",
    },
    {
        type: "radio",
        path: "claims.c6_litigation_costs_check",
        title: "6. 是否主张诉讼费用",
        options: [
            { value: "yes", label: "是" },
            { value: "no", label: "否" },
        ],
    },
    {
        type: "optimizationContext",
        path: "claims.c7_other_claims",
        title: "7. 其他请求",
        detailsLabel: "其他请求",
    },
    {
        type: "optimizationContext",
        path: "claims.c8_total_amount",
        title: "8. 标的总额",
        detailsLabel: "标的总额",
    },
];

// 事实与理由配置 (根据金融借款合同纠纷PDF)
const factsConfig: QuestionConfig[] = [
    {
        type: "optimizationContext",
        path: "facts.f1_contract_signing",
        title: "1. 合同签订情况（名称、编号、签订时间、地点等）",
    },
    {
        type: "custom",
        path: "facts.f2_parties",
        title: "2. 合同主体",
        children: () => {
            return (
                <div className="flex flex-col gap-y-3 ">
                    <FormField type="text" path="facts.f2.lender" label="贷款人" frontLabel="贷款人" />
                    <FormField type="text" path="facts.f2.borrower" label="借款人" frontLabel="借款人" />
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f2") || {};
            return `贷款人：${data.lender || '____'}\n借款人：${data.borrower || '____'}`;
        },
    },
    {
        type: "custom",
        path: "facts.f3_loan_amount",
        title: "3. 借款金额",
        children: () => {
            return (
                <div className="flex flex-col gap-y-2">
                    <FormField
                        type="money"
                        path="facts.f3.stipulated"
                        label="约定"
                        placeholder="输入约定金额"
                        frontLabel="约定金额"
                    />
                    <FormField
                        type="money"
                        path="facts.f3.actual"
                        label="实际发放"
                        placeholder="输入实际发放金额"
                        frontLabel="实际发放"
                    />
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f3") || {};
            const stipulatedText = `约定：${formatMoneyWithCN(data.stipulated)}`;
            const actualText = `实际发放：${formatMoneyWithCN(data.actual)}`;
            return `${stipulatedText}\n${actualText}`;
        },
    },
    {
        type: "custom",
        path: "facts.f4_loan_term",
        title: "4. 借款期限",
        children: () => {
            return (
                <div className="flex flex-col gap-y-2">
                    <FormField
                        path="facts.f4.isMatured"
                        label="是否到期"
                        type="radio"
                        options={[
                            { value: "yes", label: "是" },
                            { value: "no", label: "否" },
                        ]}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                        <label className="label pb-0 col-span-2">
                            <span className="label-text">约定期限:</span>
                        </label>
                        <FormField path="facts.f4.startDate" label="起始" type="date" frontLabel="起始日" />
                        <FormField path="facts.f4.endDate" label="截止" type="date" frontLabel="截止日" />
                    </div>
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f4") || {};
            const isMaturedText = `是否到期: ${generateSelectionText(
                ["是", "否"],
                data.isMatured === "yes" ? "是" : "否"
            )}`;
            const startDateText = data.startDate
                ? formatDateToChinese(data.startDate)
                : "____年____月____日";
            const endDateText = data.endDate
                ? formatDateToChinese(data.endDate)
                : "____年____月____日";
            const termText = `约定期限: ${startDateText}起至 ${endDateText}止`;
            return `${isMaturedText}\n${termText}`;
        },
    },
    {
        type: "custom",
        path: "facts.f5_interest_rate",
        title: "5. 借款利率",
        children: () => {
            const { watch } = useFormContext();
            const hasRate = watch('facts.f5.hasRate');
            const hasOverdueFloat = watch('facts.f5.hasOverdueFloat');
            const hasCompound = watch('facts.f5.hasCompound');
            const hasPenalty = watch('facts.f5.hasPenalty');

            return (
                <div className="flex flex-col gap-y-4">
                    {/* Regular Interest Rate */}
                    <div>
                        <FormField path="facts.f5.hasRate" type="checkbox" label="利率" />
                        {hasRate && (
                            <div className=" mt-2 flex items-center gap-y-2 flex-wrap">
                                <FormField path="facts.f5.rateValue" type="number" label="利率" frontLabel="利率" placeholder="利率值" endLabel="%/年(季/月)" />
                                <FormField path="facts.f5.rateClause" type="text" label="条款" placeholder="条款号" frontLabel="（合同条款：第" endLabel="条）" />
                            </div>
                        )}
                    </div>

                    {/* Overdue Float */}
                    <div>
                        <FormField path="facts.f5.hasOverdueFloat" type="checkbox" label="逾期上浮" />
                        {hasOverdueFloat && (
                            <div className=" mt-2 flex items-center gap-y-2 flex-wrap">
                                <FormField path="facts.f5.overdueFloatValue" type="number" placeholder="上浮比例" endLabel="%" />
                                <FormField path="facts.f5.overdueFloatClause" type="text" placeholder="条款号" frontLabel="（合同条款：第" endLabel="条）" />
                            </div>
                        )}
                    </div>

                    {/* Compound Interest */}
                    <div>
                        <FormField path="facts.f5.hasCompound" type="checkbox" label="复利" />
                        {hasCompound && (
                            <div className=" mt-2">
                                <FormField path="facts.f5.compoundClause" type="text" placeholder="条款号" frontLabel="（合同条款：第" endLabel="条）" />
                            </div>
                        )}
                    </div>

                    {/* Penalty Interest */}
                    <div>
                        <FormField path="facts.f5.hasPenalty" type="checkbox" label="罚息（违约金）" />
                        {hasPenalty && (
                            <div className=" mt-2 flex items-center gap-y-2 flex-wrap">
                                <FormField path="facts.f5.penaltyValue" type="number" placeholder="利率值" endLabel="%/年" />
                                <FormField path="facts.f5.penaltyClause" type="text" placeholder="条款号" frontLabel="（合同条款：第" endLabel="条）" />
                            </div>
                        )}
                    </div>
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, 'facts.f5') || {};
            const formatLine = (key: string, label: string, valueField: string, clauseField: string, unit = '%/年(季/月)') => {
                const checked = data[key] ? '☑' : '☐';
                let details = '';
                if (data[key]) {
                    const value = data[valueField] || '____';
                    const clause = data[clauseField] || '____';
                    if (valueField === 'compoundClause') { //复利只有条款
                        details = `（合同条款：第 ${clause} 条）`;
                    } else {
                        details = `${value} ${unit} （合同条款：第 ${clause} 条）`;
                    }
                }
                return `${label} ${checked} ${details}`;
            };

            const rateText = formatLine('hasRate', '利率', 'rateValue', 'rateClause');
            const overdueText = formatLine('hasOverdueFloat', '逾期上浮', 'overdueFloatValue', 'overdueFloatClause', '%/年');
            const compoundText = formatLine('hasCompound', '复利', 'compoundClause', 'compoundClause');
            const penaltyText = formatLine('hasPenalty', '罚息（违约金）', 'penaltyValue', 'penaltyClause', '%/年');

            return `${rateText}\n${overdueText}\n${compoundText}\n${penaltyText}`;
        },
    },
    {
        type: "custom",
        path: "facts.f6_disbursement_time",
        title: "6. 借款提供时间",
        children: () => (
            <div className="flex items-center gap-x-2">
                <FormField
                    path="facts.f6.date"
                    label=""
                    type="date"
                />
                <FormField
                    path="facts.f6.amount"
                    label=""
                    type="money"
                    placeholder="输入金额"
                    endLabel="元"
                />
            </div>
        ),
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f6") || {};
            const dateText = data.date
                ? formatDateToChinese(data.date)
                : "____年____月____日";
            const amountText = formatMoneyWithCN(data.amount);
            return `${dateText}, ${amountText}。`;
        },
    },
    {
        type: "custom",
        path: "facts.f7_repayment_method",
        title: "7. 还款方式",
        children: () => {
            const { watch } = useFormContext();
            const method = watch("facts.f7.method");
            return (
                <div className="flex flex-col gap-y-2">
                    <FormField
                        path="facts.f7.method"
                        label=""
                        type="radio"
                        options={[
                            { value: "equalInstallment", label: "等额本息" },
                            { value: "equalPrincipal", label: "等额本金" },
                            { value: "lumpSum", label: "到期一次性还本付息" },
                            { value: "monthlyInterest", label: "按月计息、到期一次性还本" },
                            { value: "quarterlyInterest", label: "按季计息、到期一次性还本" },
                            { value: "yearlyInterest", label: "按年计息、到期一次性还本" },
                            { value: "other", label: "其他" },
                        ]}
                    />
                    {method === "other" && (
                        <FormField
                            path="facts.f7.otherDetail"
                            label=""
                            type="text"
                            placeholder="请说明其他方式的详细内容"
                        />
                    )}
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f7") || {};
            const optionsMap = {
                equalInstallment: "等额本息",
                equalPrincipal: "等额本金",
                lumpSum: "到期一次性还本付息",
                monthlyInterest: "按月计息、到期一次性还本",
                quarterlyInterest: "按季计息、到期一次性还本",
                yearlyInterest: "按年计息、到期一次性还本",
                other: "其他",
            };

            const CHECKED_CHECKBOX = "☑";
            const allOptionLabels = Object.values(optionsMap);
            const selectedLabel = optionsMap[data.method];

            let text = generateSelectionText(allOptionLabels, selectedLabel, "\n");

            if (data.method === "other" && data.otherDetail) {
                const otherLineChecked = `其他${CHECKED_CHECKBOX}`;
                text = text.replace(
                    otherLineChecked,
                    `${otherLineChecked}: ${data.otherDetail}`
                );
            }
            return text;
        },
    },
    {
        type: "custom",
        path: "facts.f8_repayment_status",
        title: "8. 还款情况",
        children: () => (
            <div className="flex flex-col gap-y-2">
                <FormField
                    path="facts.f8.principalPaid"
                    label=""
                    frontLabel="已还本金"
                    type="money"
                    placeholder="输入金额"
                    endLabel="元"
                />
                <FormField
                    path="facts.f8.interestPaid"
                    label=""
                    frontLabel="已还利息"
                    type="money"
                    placeholder="输入金额"
                    endLabel="元"
                />
                <FormField
                    path="facts.f8.paidUntilDate"
                    label=""
                    frontLabel="还息至"
                    type="date"
                />
            </div>
        ),
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f8") || {};
            const principalText = `已还本金: ${formatMoneyWithCN(data.principalPaid)}`;
            const interestText = `已还利息: ${formatMoneyWithCN(data.interestPaid)}`;
            const dateText = data.paidUntilDate
                ? formatDateToChinese(data.paidUntilDate)
                : "____年____月____日";
            return `${principalText}\n${interestText}, 还息至 ${dateText}`;
        },
    },
    {
        type: "custom",
        path: "facts.f9_is_overdue",
        title: "9. 是否存在逾期还款",
        children: () => {
            const { watch } = useFormContext();
            const isOverdue = watch("facts.f9.isOverdue");
            return (
                <div>
                    <FormField
                        path="facts.f9.isOverdue"
                        label=""
                        type="radio"
                        options={[
                            { value: "yes", label: "是" },
                            { value: "no", label: "否" },
                        ]}
                    />
                    {isOverdue === "yes" && (
                        <div className="mt-2 flex flex-col gap-y-1">
                            <FormField
                                path="facts.f9.overdueFromDate"
                                label="逾期时间"
                                frontLabel="逾期时间"
                                type="date"
                            />
                            <FormField
                                path="facts.f9.hadOverdueDate"
                                label="已经逾期"
                                frontLabel="至今已逾期"
                                type="text"
                                endLabel="天"
                            />
                        </div>
                    )}
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f9") || {};
            const overdueCheck = generateSelectionText(
                ["是", "否"],
                data.isOverdue === "yes" ? "是" : "否"
            );
            let text = `${overdueCheck}`;
            if (data.isOverdue === "yes") {
                const dateText = data.overdueFromDate
                    ? formatDateToChinese(data.overdueFromDate)
                    : "____年____月____日";
                text += `\n逾期时间: ${dateText} 至今已逾期 ${data.hadOverdueDate || '____'} 天`;
            }
            return text;
        },
    },
    {
        type: "custom",
        path: "facts.f10_collateral_agreement",
        title: "10. 是否签订物的担保（抵押、质押）合同",
        children: () => {
            const { watch } = useFormContext();
            const hasAgreement = watch("facts.f10.hasAgreement");
            return (
                <div>
                    <FormField
                        path="facts.f10.hasAgreement"
                        label=""
                        type="radio"
                        options={[
                            { value: "yes", label: "是" },
                            { value: "no", label: "否" },
                        ]}
                    />
                    {hasAgreement === "yes" && (
                        <div className="mt-2">
                            <FormField
                                path="facts.f10.signingDate"
                                label="签订时间"
                                frontLabel="签订时间"
                                type="date"
                            />
                        </div>
                    )}
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f10") || {};
            const agreementCheck = generateSelectionText(
                ["是", "否"],
                data.hasAgreement === "yes" ? "是" : "否"
            );
            let text = `${agreementCheck}`;
            if (data.hasAgreement === "yes") {
                const dateText = data.signingDate
                    ? `签订时间: ${formatDateToChinese(data.signingDate)}`
                    : "签订时间: ________";
                text += ` ${dateText}`;
            }
            return text;
        },
    },
    {
        type: "custom",
        path: "facts.f11_guarantor_item",
        title: "11. 担保人、担保物",
        children: () => (
            <div className="flex flex-col gap-y-2">
                <FormField
                    path="facts.f11.guarantor"
                    label="担保人"
                    frontLabel="担保人"
                    type="text"
                />
                <FormField
                    path="facts.f11.collateralItem"
                    label="担保物"
                    frontLabel="担保物"
                    type="text"
                />
            </div>
        ),
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f11") || {};
            return `担保人: ${data.guarantor || "____"}\n担保物: ${data.collateralItem || "____"
                }`;
        },
    },
    {
        type: "custom",
        path: "facts.f12_max_amount_guarantee",
        title: "12. 是否最高额担保（抵押、质押）",
        children: () => {
            const { watch } = useFormContext();
            const isMaxAmount = watch("facts.f12.isMaxAmount");
            return (
                <div>
                    <FormField
                        path="facts.f12.isMaxAmount"
                        label=""
                        type="radio"
                        options={[
                            { value: "yes", label: "是" },
                            { value: "no", label: "否" },
                        ]}
                    />
                    {isMaxAmount === "yes" && (
                        <div className="mt-2 flex flex-col gap-y-2">
                            <FormField
                                path="facts.f12.claimFixingDate"
                                label="担保债权的确定时间"
                                type="date"
                                frontLabel="担保债权的确定时间"
                            />
                            <FormField
                                path="facts.f12.maxAmount"
                                label="担保额度"
                                type="money"
                                frontLabel="担保额度"
                            />
                        </div>
                    )}
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f12") || {};
            const checkText = generateSelectionText(
                ["是", "否"],
                data.isMaxAmount === "yes" ? "是" : "否"
            );
            let text = `${checkText}`;
            if (data.isMaxAmount === "yes") {
                const dateText = data.claimFixingDate
                    ? formatDateToChinese(data.claimFixingDate)
                    : "____";
                const amountText = data.maxAmount ? data.maxAmount : "____";
                text += `\n担保债权的确定时间: ${dateText}\n担保额度: ${formatMoneyWithCN(amountText)}`;
            }
            return text;
        },
    },
    {
        type: "custom",
        path: "facts.f13_registration",
        title: "13. 是否办理抵押、质押登记",
        children: () => {
            const { watch } = useFormContext();
            const isRegistered = watch("facts.f13.isRegistered");
            return (
                <div>
                    <FormField
                        path="facts.f13.isRegistered"
                        label=""
                        type="radio"
                        options={[
                            { value: "yes", label: "是" },
                            { value: "no", label: "否" },
                        ]}
                    />
                    {isRegistered === "yes" && (
                        <div className="mt-2 ">
                            <FormField
                                path="facts.f13.registrationType"
                                label=""
                                type="radio"
                                options={[
                                    { value: "formal", label: "正式登记" },
                                    { value: "preliminary", label: "预告登记" },
                                ]}
                            />
                        </div>
                    )}
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f13") || {};
            const isRegisteredText = generateSelectionText(["是", "否"], data.isRegistered === 'yes' ? '是' : '否');
            let text = `是${isRegisteredText.includes('是') ? '☑' : '☐'}  否${isRegisteredText.includes('否') ? '☑' : '☐'}`;

            if (data.isRegistered === 'yes') {
                const typeMap = { formal: "正式登记", preliminary: "预告登记" };
                const selectedType = typeMap[data.registrationType];
                const typeText = generateSelectionText(
                    Object.values(typeMap),
                    selectedType,
                    " "
                );
                text += `\n ${typeText}`;
            }
            return text;
        },
    },
    {
        type: "custom",
        path: "facts.f14_guarantee_contract",
        title: "14. 是否签订保证合同/保函",
        children: () => {
            const { watch } = useFormContext();
            const hasContract = watch("facts.f14_guarantee_contract.hasContract");
            return (
                <div>
                    <FormField
                        path="facts.f14_guarantee_contract.hasContract"
                        label=""
                        type="radio"
                        options={[
                            { value: "yes", label: "是" },
                            { value: "no", label: "否" },
                        ]}
                    />
                    {hasContract === "yes" && (
                        <div className="mt-2 flex flex-col gap-y-2 pl-4">
                            <FormField
                                path="facts.f14_guarantee_contract.signingDate"
                                label="签订时间"
                                type="date"
                                frontLabel="签订时间"
                            />
                            <FormField
                                path="facts.f14_guarantee_contract.guarantorName"
                                label="保证人"
                                type="text"
                                frontLabel="保证人"
                            />
                            <FormField
                                path="facts.f14_guarantee_contract.mainContent"
                                label="主要内容"
                                type="textarea"
                            />
                        </div>
                    )}
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f14_guarantee_contract") || {};
            const hasContract = data.hasContract === 'yes';

            // 重新构建formatter以更好地匹配图片布局
            const yesCheckbox = hasContract ? '☑' : '☐';
            const noCheckbox = !hasContract ? '☑' : '☐';

            const dateText = hasContract ? (data.signingDate ? formatDateToChinese(data.signingDate) : "____") : "";
            const guarantorName = hasContract ? (data.guarantorName || "____") : "";
            const mainContent = hasContract ? (data.mainContent || "____") : "";

            const line1 = `是${yesCheckbox} 签订时间: ${dateText}  保证人: ${guarantorName}`;
            const line2 = `      主要内容: ${mainContent}`;
            const line3 = `否${noCheckbox}`;

            // 当未选择“是”时，为了保持布局，也输出带有占位符的行
            if (!hasContract) {
                return `是${yesCheckbox} 签订时间:             保证人:\n      主要内容:\n否${noCheckbox}`;
            }

            return `${line1}\n${line2}\n${line3}`;
        },
    },
    {
        type: "custom",
        path: "facts.f15_guarantee_method",
        title: "15. 保证方式",
        children: () => (
            <FormField
                path="facts.f15_guarantee_method.type"
                label=""
                type="radio"
                options={[
                    { value: "general", label: "一般保证" },
                    { value: "joint", label: "连带责任保证" },
                ]}
            />
        ),
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f15_guarantee_method") || {};
            const typeMap = { general: "一般保证", joint: "连带责任保证" };
            const selectedType = typeMap[data.type];

            // 使用 generateSelectionText 来格式化输出
            // 假设它能处理非 'yes'/'no' 的值，如果不能，需要一个简单的 map
            const options = Object.values(typeMap);
            return options.map(opt =>
                `${opt}${selectedType === opt ? '☑' : '☐'}`
            ).join('\n'); // 使用换行符来堆叠选项
        }
    },
    {
        type: "custom",
        path: "facts.f15_other_guarantee",
        title: "16. 其他担保方式",
        children: () => {
            const { watch } = useFormContext();
            const hasOther = watch("facts.f15.hasOther");
            return (
                <div>
                    <FormField
                        path="facts.f15.hasOther"
                        label=""
                        type="radio"
                        options={[
                            { value: "yes", label: "是" },
                            { value: "no", label: "否" },
                        ]}
                    />
                    {hasOther === "yes" && (
                        <div className="mt-2 flex gap-x-1 ">
                            <FormField path="facts.f15.form" label="形式" type="text" frontLabel="形式" />
                            <FormField
                                path="facts.f15.signingDate"
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
            const data = getValueFromPath(formData, "facts.f15") || {};
            const checkText = generateSelectionText(
                ["是", "否"],
                data.hasOther === "yes" ? "是" : "否"
            );
            let text = `${checkText}`;
            if (data.hasOther === "yes") {
                const formText = data.form || "____";
                const dateText = data.signingDate
                    ? formatDateToChinese(data.signingDate)
                    : "____";
                text += `\n形式: ${formText} 签订时间: ${dateText}`;
            }
            return text;
        },
    },
    {
        type: "LegalAnalysisField",
        path: "facts.f17_legal_basis",
        title: "17. 请求承担责任的依据",
        placeholder: "合同约定：\n法律规定：",
        formDataProcessor: processFormDataForPreview,
    },
    {
        type: "optimizationContext",
        path: "facts.f18_other_notes",
        title: "18. 其他需要说明的内容(可另附页)",
    },
    {
        type: "textarea",
        path: "facts.f19_evidence_list",
        title: "19. 证据清单(可另附页)",
    },
];

const ClaimsSection: React.FC = () => {
    return (
        <FormSectionCard title="诉讼请求">
            <OptimizableTextarea
                path="claims.fullStatement"
                label="完整陈述"
                placeholder="可在此处完整表述您的诉讼请求..."
                rows={3}
                optimizationContext="这是原告关于本金融借款合同纠纷案件的诉讼请求完整陈述。"
            />
            <p className="text-sm  my-2">
                为方便、准确梳理要点，相关内容请在下方要素式表格中填写：
            </p>
            <table className="table w-full">
                <tbody>
                    <QuestionTable config={claimsConfig} />
                </tbody>
            </table>
        </FormSectionCard>
    );
};

const FactsAndReasonsSection: React.FC = () => {
    return (
        <FormSectionCard title="事实与理由">
            <OptimizableTextarea
                path="facts.fullStatement"
                label="完整陈述"
                placeholder="可在此处完整表述纠纷涉及的事实与理由..."
                rows={3}
                optimizationContext="这是一段关于金融借款合同纠纷的案件事实与理由陈述。"
            />
            <p className="text-sm my-2">
                为方便、准确梳理要点，相关内容请在下方要素式表格中填写：
            </p>
            <table className="table w-full">
                <tbody>
                    <QuestionTable config={factsConfig} />
                </tbody>
            </table>
        </FormSectionCard>
    );
};

export const FinancialLoanClaimFormPage: React.FC = () => {
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
            formId="claim_financial_loan"
            onSubmit={handleFormSubmit}
            onPreviewData={processFormDataForPreview}
            rightPanel={rightSide}
            docType="起诉状"
            fixedFormValues={{ basicInfo: { caseCause: CASE_TYPE } }}
        >
            <BasicInfoSection case_type={CASE_TYPE} />
            <FormSectionCard title="原告">
                <PartyList
                    path="plaintiffs_natural"
                    title="自然人"
                    partyType="natural"
                />
                <div className="divider my-4"></div>
                <PartyList
                    path="plaintiffs_legal"
                    title="法人/非法人组织"
                    partyType="legal"
                />
            </FormSectionCard>
            <AgentList path="agents" />
            <FormSectionCard title="被告">
                <PartyList
                    path="defendants_natural"
                    title="自然人"
                    partyType="natural"
                />
                <div className="divider my-4"></div>
                <PartyList
                    path="defendants_legal"
                    title="法人/非法人组织"
                    partyType="legal"
                />
            </FormSectionCard>
            <FormSectionCard title="第三人">
                <PartyList
                    path="third_parties_natural"
                    title="自然人"
                    partyType="natural"
                />
                <div className="divider my-4"></div>
                <PartyList
                    path="third_parties_legal"
                    title="法人/非法人组织"
                    partyType="legal"
                />
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

export default FinancialLoanClaimFormPage;