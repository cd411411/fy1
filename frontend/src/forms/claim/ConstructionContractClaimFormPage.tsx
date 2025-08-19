/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from "react";
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
    formatDateToChinese,
    getValueFromPath,
    formatNumberToCN,
    formatMoneyWithCN
} from "../../utils/formatter";

import { AIChatbotPanel } from "../../components/AIChatbotPanel";
import { OptimizableTextarea } from "../../components/OptimizableTextarea";
import {JurisdictionPreservationAppraisalForm,formatJurisdictionPreservationAppraisalForDocx,FORM_CONFIGS} from '../../components/claim/JurisdictionPreservationAppraisalForm'
import { QuestionTable } from "../../components/claim/QuestionTable";
import type { QuestionConfig } from "../../components/claim/QuestionTable";
import FormField from "../../components/claim/FormField";

// 定义案件类型
const CASE_TYPE = "建设工程施工合同纠纷";

// 预览数据处理函数
const processFormDataForPreview = (data: any) => {
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

    return {
        case_type: data.basicInfo?.caseCause,
        case_number: data.basicInfo?.caseNumber || `起诉状-${Date.now()}`,
        partyInfo: [
            ...formatPartiesForDocx(data, partyBlueprint_plaintiffs),
            ...formatAgentsForDocx(data),
            ...formatPartiesForDocx(data, partyBlueprint_others),
        ],
        claimItems: formatFormData("claim", data, claimsConfig),
        jurisdictionPreservationAppraisal: formatJurisdictionPreservationAppraisalForDocx(data),
        factItems: formatFormData("facts", data, factsConfig),
        mediationInfo: formatMediationForDocx(data),
    };
};

// 诉讼请求配置 (建设工程施工合同纠纷)
const claimsConfig: QuestionConfig[] = [
    {
        type: "custom",
        path: "claims.c1_payment",
        title: "1. 支付工程款",
        children: () => {
            const { control, watch, register } = useFormContext();
            const currencyType = watch("claims.c1.currency");

            return (
                <div className="flex flex-col gap-y-2">
                    <FormField
                        path="claims.c1.amount"
                        label="工程款金额"
                        type="money"
                        frontLabel="支付工程款"
                        placeholder="输入金额"
                        endLabel="元"
                    />

                    <div className="md:col-span-2">
                        <label className="label ">
                            <span className="label-text">币种</span>
                        </label>
                        <Controller
                            name="claims.c1.currency"
                            control={control}
                            defaultValue="RMB"
                            render={({ field }) => (
                                <div className="flex items-center gap-x-4 ">
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
                                        <label className="input">
                                            <span className="label">币种名称</span>
                                            <input
                                                type="text"
                                                {...register("claims.c1.currencyName")}
                                                placeholder="请输入外币名称, 如美元"
                                            />
                                        </label>
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
            const amountText = data.amount
                ? `支付工程款 ${data.amount} 元 ${formatNumberToCN(data.amount)}`
                : "支付工程款 ____元";

            let currencyText = "(人民币, 下同; 如外币需特别注明)"; // Default text
            if (data.currency === "other") {
                currencyText = data.currencyName
                    ? `(外币: ${data.currencyName})`
                    : "(外币, 需特别注明)";
            }

            return `${amountText} ${currencyText}`;
        },
    },
    {
        type: "custom",
        path: "claims.c2_late_payment_interest",
        title: "2. 迟延支付工程款的利息(违约金)",
        children: () => (
            <div className="flex flex-col gap-y-2">
                <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                    <FormField path="claims.c2.endDate" label="截至日期" type="date" frontLabel="截至" className="col-span-1" />
                    <FormField path="claims.c2.interestAmount" label="利息" type="money" frontLabel="迟延支付利息" endLabel="元" className="col-span-1" />
                    <FormField path="claims.c2.penaltyAmount" label="违约金" type="money" frontLabel="违约金" endLabel="元" className="col-span-1" />
                    <FormField path="claims.c2.startDate" label="起算日期" type="date" frontLabel="利息违约金起算日" className="col-span-1" />
                    <FormField path="claims.c2.baseAmount" label="基数" type="money" frontLabel="以" endLabel="元为基数" />
                    <FormField path="claims.c2.standard" label="标准" type="text" placeholder="如：3年期LPR" frontLabel="按" endLabel="标准计算" />
                </div>
                <FormField path="claims.c2.payToActualDate" label="是否请求支付至实际清偿之日止" type="radio" options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]} />
            </div>
        ),
        formatter: (formData) => {
            const data = getValueFromPath(formData, "claims.c2") || {};
            const endDate = data.endDate ? formatDateToChinese(data.endDate) : "____";
            const interest = data.interestAmount ? `${data.interestAmount + formatNumberToCN(data.interestAmount)} 元` : "____元";
            const penalty = data.penalty ? `${data.penalty + formatNumberToCN(data.penalty)} 元` : "____元";
            const startDate = data.startDate ? `自 ${formatDateToChinese(data.startDate)} 之后的逾期利息、违约金` : "自____之后的逾期利息、违约金";
            const baseAmount = data.baseAmount ? `以 ${data.baseAmount}元${formatNumberToCN(data.baseAmount)}为基数` : "以____元为基数";
            const standard = data.standard ? `按照 ${data.standard} 标准计算` : "按照____标准计算";
            const payToActualDate = generateSelectionText(["是", "否"], data.payToActualDate === "yes" ? "是" : "否");
            return `截至${endDate}，迟延支付工程款的利息${interest}、违约金${penalty}；${startDate}，${baseAmount}，${standard}；\n是否请求支付至实际清偿之日止: ${payToActualDate}`;
        },
    },
    {
        type: "custom",
        path: "claims.c3_priority_right",
        title: "3. 是否主张建设工程价款优先受偿权",
        children: () => (
            <FormField
                path="claims.c3_priority_right"
                label=""
                type="radio_detail"
                options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]}
                triggerValue="yes"
                detailsLabel="内容"
                placeholder="请填写具体内容"
            />
        ),
        formatter: (formData) => {
            const data = getValueFromPath(formData, "claims.c3_priority_right") || {};
            const choice = data.choice;
            let yesLine = `是${choice === 'yes' ? '☑' : '☐'}`;
            if (choice === 'yes') {
                yesLine += `\n内容: ${data.details || '____'}`;
            } else {
                yesLine = "是☐ 内容"
            }
            const noLine = `否${choice != 'yes' ? '☑' : '☐'}`;
            return `${yesLine}\n${noLine}`;
        },
    },
    {
        type: "custom",
        path: "claims.c4_third_party_liability",
        title: "4. 是否请求与原告没有建设工程施工合同关系的发包人、其他转包方、分包方等主体承担责任",
        children: () => (
            <FormField
                path="claims.c4_third_party_liability"
                label=""
                type="radio_detail"
                options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]}
                triggerValue="yes"
                detailsLabel="责任主体姓名或者名称"
                placeholder="请填写责任主体姓名或者名称"
            />
        ),
        formatter: (formData) => {
            const data = getValueFromPath(formData, "claims.c4_third_party_liability") || {};
            const choice = data.choice;
            let yesLine = `是${choice === 'yes' ? '☑' : '☐'}`;
            if (choice === 'yes') {
                yesLine += ` 责任主体姓名或者名称: ${data.details || '____'}`;
            } else {
                yesLine = "是☐ 责任主体姓名或者名称:"
            }
            const noLine = `否${choice != 'yes' ? '☑' : '☐'}`;
            return `${yesLine}\n${noLine}`;
        },
    },
    {
        type: "custom",
        path: "claims.c5_damages",
        title: "5. 是否要求赔偿损失",
        children: () => {
            const { watch } = useFormContext();
            const choice = watch("claims.c5.choice");
            return (
                <div className="flex flex-col gap-y-2">
                    <FormField path="claims.c5.choice" label="" type="radio" options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]} />
                    {choice === 'yes' && (
                        <div className="flex flex-col gap-y-2 mt-2">
                            <FormField path="claims.c5.amount" label="赔偿金额" type="money" frontLabel="支付赔偿金" endLabel="元" />
                            <FormField path="claims.c5.lossType" label="责任类型" type="checkboxGroup" options={[{ value: "stoppage", label: "停窝工损失" }, { value: "other", label: "其他" }]} />
                            <FormField path="claims.c5.details" label="具体情形" type="optimizable-textarea" placeholder="说明具体情形" optimizationContext="原告关于被告赔偿违约所受损失的具体说明" />
                            <FormField path="claims.c5.calculationBasis" label="损失计算依据" type="optimizable-textarea" placeholder="说明损失如何计算" optimizationContext="原告关于被告赔偿违约所受损失的计算依据说明"/>
                        </div>
                    )}
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "claims.c5") || {};
            if (data.choice != "yes") return `是 ☐\n否 ☑`;
            const amount = data.amount ? `${data.amount}元 ${formatNumberToCN(data.amount)}` : '____元';
            const lossType = data.lossType || [];
            const typeText = `责任类型: 停窝工损失${lossType.includes('stoppage') ? '☑' : '☐'} 其他${lossType.includes('other') ? '☑' : '☐'}`;
            const details = `具体情形: ${data.details || '____'}`;
            const basis = `损失计算依据: ${data.calculationBasis || '____'}`;
            return `是 ☑ 支付赔偿金 ${amount}\n${typeText}\n${details}\n${basis}`;
        }
    },
    {
        type: "custom",
        path: "claims.c6_refund_overpayment",
        title: "6. 是否退还超付的工程款",
        children: () => {
            const { watch } = useFormContext();
            const isYes = watch("claims.c6_refund_overpayment.choice") === "yes";

            return (
                <div className="flex flex-col gap-y-2">
                    <FormField
                        path="claims.c6_refund_overpayment.choice"
                        label=""
                        type="radio"
                        options={[
                            { value: "yes", label: "是" },
                            { value: "no", label: "否" },
                        ]}
                    />

                    {isYes && (
                        <div className="mt-2 ">
                            <FormField
                                path="claims.c6_refund_overpayment.amount"
                                label="金额"
                                type="money"
                                frontLabel="希望退还的金额"
                                endLabel="元"
                                placeholder="请输入金额"
                            />
                        </div>
                    )}
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "claims.c6_refund_overpayment") || {};
            const choice = data.choice;
            const isYes = choice === 'yes';
            const isNo = choice === 'no';

            const amountText = isYes ? (data.amount || '____') : '____';

            const yesLine = `是${isYes ? `☑ 金额 ${amountText} 元 ${formatNumberToCN(amountText)} ` : '☐ 金额'}`;
            const noLine = `否${isNo ? '☑' : '☐'}`;

            return `${yesLine}\n${noLine}`;
        },
    },
    {
        type: "custom",
        path: "claims.c7_interest_overpayment",
        title: "7. 是否支付超付工程款的利息",
        children: () => {
            const { watch } = useFormContext();
            const choice = watch("claims.c7.choice");
            return (
                <div className="flex flex-col gap-y-2">
                    <FormField path="claims.c7.choice" label="" type="radio" options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]} />
                    {choice === 'yes' && (
                        <div className="flex flex-col gap-y-2 mt-2 ">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                <FormField path="claims.c7.endDate" label="截至日期" type="date" frontLabel="截至" endLabel="日" />
                                <FormField path="claims.c7.interestAmount" label="利息" type="money" frontLabel="返还超付工程款的利息" endLabel="元" />
                                <FormField path="claims.c7.startDate" label="起算日期" type="date" frontLabel="自" endLabel="之后的逾期利息" />
                                <FormField path="claims.c7.baseAmount" label="基数" type="money" frontLabel="以" endLabel="元为基数" />
                                <FormField path="claims.c7.standard" label="标准" type="text" placeholder="如：3年期LPR" frontLabel="按" endLabel="标准计算" />
                            </div>
                            <FormField path="claims.c7.calculationMethod" label="计算方式" type="textarea" placeholder="说明具体计算方式" />
                            <FormField path="claims.c7.payToActualDate" label="是否请求支付至实际清偿之日止" type="radio" options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]} />
                        </div>
                    )}
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "claims.c7") || {};
            if (data.choice !== "yes") return `是 ☐ 截至 年 月 日，返还超付工程款的利息 元，自 之后的逾期利息，以 元为基数按照 标准计算；\n计算方式：\n是否请求支付至实际清偿之日止：是☐ 否☐\n否 ☑`;
            const endDate = data.endDate ? formatDateToChinese(data.endDate) : "____";
            const interest = data.interestAmount ? `${data.interestAmount}元${formatNumberToCN(data.interestAmount)}` : "____元";
            const startDate = data.startDate ? `自 ${formatDateToChinese(data.startDate)} 之后的逾期利息` : "自____之后的逾期利息";
            const baseAmount = data.baseAmount ? `以 ${data.baseAmount}元${formatNumberToCN(data.baseAmount)}为基数` : "以____元为基数";
            const standard = data.standard ? `按照 ${data.standard} 标准计算` : "按照____标准计算";
            const calcMethod = `计算方式: ${data.calculationMethod || '____'}`;
            const payToActualDate = `是否请求支付至实际清偿之日止: ${generateSelectionText(["是", "否"], data.payToActualDate === "yes" ? "是" : "否")}`;
            return `是 ☑ 截至${endDate}，返还超付工程款的利息${interest}；${startDate}，${baseAmount}，${standard}；\n${calcMethod}\n${payToActualDate}`;
        },
    },
    {
        type: "custom",
        path: "claims.c8_repair_liability",
        title: "8. 是否对建设工程承担修复责任",
        children: () => {
            const { watch } = useFormContext();
            const choice = watch("claims.c8.choice");
            return (
                <div className="flex flex-col gap-y-2">
                    <FormField path="claims.c8.choice" label="" type="radio" options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]} />
                    {choice === 'yes' && (
                        <div className="flex flex-col gap-y-2 mt-2 ">
                            <FormField path="claims.c8.liabilityType" label="责任方式" type="checkboxGroup" options={[{ value: "repair", label: "修复" }, { value: "repair_cost", label: "付修复费用" }, { value: "reduce_payment", label: "减少工程款" }, { value: "other", label: "其他" }]} />
                            <FormField path="claims.c8.amount" label="数额" type="money" frontLabel="数额" endLabel="元" />
                        </div>
                    )}
                </div>
            )
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "claims.c8") || {};
            if (data.choice !== "yes") return `是 ☐ 修复☐ 付修复费用☐ 减少工程款☐ 其他☐，数额 元\n否 ☑`;
            const types = data.liabilityType || [];
            const typeText = `修复${types.includes('repair') ? '☑' : '☐'} 付修复费用${types.includes('repair_cost') ? '☑' : '☐'} 减少工程款${types.includes('reduce_payment') ? '☑' : '☐'} 其他${types.includes('other') ? '☑' : '☐'}`;
            const amount = data.amount ? `${data.amount}元${formatNumberToCN(data.amount)}` : '____元';
            return `是 ☑ ${typeText}, 数额 ${amount} \n否 ☐`;
        }
    },
    {
        type: "custom",
        path: "claims.c9_dev_damages",
        title: "9. 是否要求赔偿损失",
        children: () => {
            const { watch } = useFormContext();
            const choice = watch("claims.c9.choice");
            return (
                <div className="flex flex-col gap-y-2">
                    <FormField path="claims.c9.choice" label="" type="radio" options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]} />
                    {choice === 'yes' && (
                        <div className="flex flex-col gap-y-2 mt-2 ">
                            <FormField path="claims.c9.amount" label="赔偿金额" type="money" frontLabel="支付赔偿金" endLabel="元" />
                            <FormField path="claims.c9.lossType" label="责任类型" type="checkboxGroup" options={[{ value: "quality", label: "工程质量不符合约定" }, { value: "delay", label: "迟延交付工程" }, { value: "refusal", label: "拒绝履行" }, { value: "other", label: "其他" }]} />
                            <FormField path="claims.c9.details" label="具体情形" type="textarea" placeholder="说明具体情形" />
                            <FormField path="claims.c9.calculationBasis" label="损失计算依据" type="textarea" placeholder="说明损失如何计算" />
                        </div>
                    )}
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "claims.c9") || {};
            if (data.choice != "yes") return `是 ☐\n否 ☑`;
            const amount = data.amount ? `${data.amount}元` : '____元';
            const lossType = data.lossType || [];
            const typeText = `责任类型: 工程质量不符合约定${lossType.includes('quality') ? '☑' : '☐'} 迟延交付工程${lossType.includes('delay') ? '☑' : '☐'} 拒绝履行${lossType.includes('refusal') ? '☑' : '☐'} 其他${lossType.includes('other') ? '☑' : '☐'}`;
            const details = `具体情形: ${data.details || '____'}`;
            const basis = `损失计算依据: ${data.calculationBasis || '____'}`;
            return `是 ☑ 支付赔偿金 ${amount}\n${typeText}\n${details}\n${basis}\n否 ☐`;
        }
    },
    {
        type: "custom",
        path: "claims.c10_invalid_contract",
        title: "10. 请求确认建设工程施工合同无效",
        children: () => (
            <FormField
                path="claims.c10_invalid_contract"
                label=""
                type="radio_detail"
                options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]}
                triggerValue="yes"
                detailsLabel="合同无效的理由"
                placeholder="请填写理由"
            />
        ),
        formatter: (formData) => {
            const data = getValueFromPath(formData, "claims.c10_invalid_contract") || {};
            const choice = data.choice;
            let yesLine = `是${choice === 'yes' ? '☑' : '☐'}`;
            if (choice === 'yes') {
                yesLine += ` 合同无效的理由: ${data.details || '____'}`;
            }
            const noLine = `否${choice === 'no' ? '☑' : '☐'}`;
            return `${yesLine}\n${noLine}`;
        },
    },
    {
        type: "custom",
        path: "claims.c11_performance_termination",
        title: "11. 要求继续履行或是解除合同",
        children: () => {
            const { watch } = useFormContext();
            const action = watch("claims.c11.action");
            return (
                <div className="flex flex-col gap-y-2">
                    <FormField path="claims.c11.action" label="" type="radio" options={[{ value: "continue", label: "继续履行" }, { value: "terminate", label: "判令解除合同" }, { value: "confirm_terminated", label: "确认合同已解除" }]} />
                    {action === 'continue' && (
                        <div className="flex flex-col gap-y-2 mt-2 ">
                            <FormField path="claims.c11.continue.deadline" label="履行完毕日期" type="number" frontLabel="期限" endLabel="日内履行完毕" />
                            <FormField path="claims.c11.continue.obligations" label="义务" type="radio" options={[{ value: "payment", label: "付款" }, { value: "completion", label: "竣工" }]} />
                        </div>
                    )}
                    {action === 'confirm_terminated' && (
                        <div className="mt-2 ">
                            <FormField path="claims.c11.confirm.terminationDate" label="解除日期" type="date" frontLabel="合同已于" endLabel="解除" />
                        </div>
                    )}
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "claims.c11") || {};
            const action = data.action;
            const cData = data.continue || {};
            const tData = data.confirm || {};

            let continueLine = `继续履行${action === 'continue' ? '☑' : '☐  日内履行完毕 付款☐ 竣工☐ 义务'}`;
            if (action === 'continue') {
                const deadline = cData.deadline ? `${cData.deadline}日内履行完毕` : "____日内履行完毕";
                const obligations = cData.obligations || [];
                const payment = `付款${obligations.includes('payment') ? '☑' : '☐'}`;
                const completion = `竣工${obligations.includes('completion') ? '☑' : '☐'}`;
                continueLine += ` ${deadline} ${payment} ${completion} 义务`;
            }

            const terminateLine = `判令解除合同${action === 'terminate' ? '☑' : '☐'}`;
            let confirmLine = `确认建设工程施工合同已于____年____月____日解除${action === 'confirm_terminated' ? '☑' : '☐'}`;
            if (action === 'confirm_terminated' && tData.terminationDate) {
                confirmLine = `确认建设工程施工合同已于 ${formatDateToChinese(tData.terminationDate)} 解除☑`;
            } else {
                confirmLine = `确认建设工程施工合同已于 年 月 日解除`;
            }
            return [continueLine, terminateLine, confirmLine].join('\n');
        },
    },
    {
        type: "custom",
        path: "claims.c12_realization_costs",
        title: "12. 是否主张实现债权的费用",
        children: () => (
            <FormField
                path="claims.c12_realization_costs"
                label=""
                type="radio_detail"
                options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]}
                triggerValue="yes"
                detailsLabel="费用明细"
                placeholder="请填写费用明细, 如律师费XXXX元"
            />
        ),
        formatter: (formData) => {
            const data = getValueFromPath(formData, "claims.c12_realization_costs") || {};
            const choice = data.choice;
            let yesLine = `是${choice === 'yes' ? '☑' : '☐ 费用明细:'}`;
            if (choice === 'yes') {
                yesLine += ` 费用明细: ${data.details || '____'}`;
            }
            const noLine = `否${choice === 'no' ? '☑' : '☐'}`;
            return `${yesLine}\n${noLine}`;
        },
    },
    {
        type: "radio",
        path: "claims.c13_litigation_costs",
        title: "13. 是否主张诉讼费用",
        options: [{ value: "yes", label: "是" }, { value: "no", label: "否" }],
    },
    {
        type: "optimizationContext",
        path: "claims.c14_other_claims",
        title: "14. 其他请求",
    },
    {
        type: "optimizationContext",
        path: "claims.c15_total_amount",
        title: "15. 标的总额",
    },
];

// 事实与理由配置 (建设工程施工合同纠纷)
const factsConfig: QuestionConfig[] = [
    {
        type: "optimizationContext",
        path: "facts.f1_contract_signing",
        title: "1. 合同的签订情况(名称、编号、签订时间、地点、是否招投标等)",
        optimizationContext: "原告关于建设工程施工合同的签订情况的说明"
    },
    {
        type: "custom",
        path: "facts.f2_parties",
        title: "2. 签订主体",
        children: () => (
            <div className="flex flex-col gap-y-2">
                <FormField type="text" path="facts.f2.developer" label="发包人" frontLabel="发包人"/>
                <FormField type="text" path="facts.f2.contractor" label="承包人" frontLabel="承包人"/>
                <FormField type="text" path="facts.f2.lendingEntity" label="出借资质的建筑企业" frontLabel="出借资质的建筑企业"/>
                <FormField type="text" path="facts.f2.actualConstructor" label="实际施工人" frontLabel="实际施工人"/>
            </div>
        ),
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f2") || {};
            return `发包人: ${data.developer || ""}\n承包人: ${data.contractor || ""}\n出借资质的建筑企业: ${data.lendingEntity || ""}\n实际施工人: ${data.actualConstructor || ""}`;
        },
    },
    {
        type: "optimizationContext",
        path: "facts.f3_project_details",
        title: "3. 建设工程情况(工程名称、所在地点、施工范围、质量标准等)",
        optimizationContext: "原告关于建设工程情况的说明",
    },
     {
        type: "custom",
        path: "facts.f4_price_payment",
        title: "4. 合同约定的工程款及支付方式",
        children: () => {
            const { watch } = useFormContext();

            const pricingMethods = watch("facts.f4.pricingMethods") || [];
            const paymentMethods = watch("facts.f4.paymentMethod") || [];
            const paymentTypes = watch("facts.f4.paymentType") || [];
            const retentionEnabled = watch("facts.f4.retention.enabled");

            return (
                <div className="flex flex-col gap-y-4">
                    {/* --- Pricing Method --- */}
                    <div className="flex flex-col gap-y-2">
                        <label className="label-text font-semibold">计价方式</label>
                        <FormField path="facts.f4.pricingMethods" type="checkboxGroup" label="" options={[{ value: "unit", label: "综合单价" }, { value: "fixed_unit", label: "固定单价" }, { value: "fixed_total", label: "固定总价" }, { value: "other", label: "其他" }]} />
                        <div className=" mt-2 flex flex-col gap-y-2">
                            {pricingMethods.includes('unit') && <FormField path="facts.f4.pricing.unit" label="" type="money" frontLabel="综合单价金额" endLabel="元" />}
                            {pricingMethods.includes('fixed_unit') && <FormField path="facts.f4.pricing.fixed_unit" label="" type="money" frontLabel="固定单价金额" endLabel="元" />}
                            {pricingMethods.includes('fixed_total') && <FormField path="facts.f4.pricing.fixed_total" label="" type="money" frontLabel="固定总价金额" endLabel="元" />}
                            {pricingMethods.includes('other') && <FormField path="facts.f4.pricing.other_details" label=""  type="text" frontLabel="其他计价方式"  />}
                        </div>
                    </div>

                    {/* --- Payment Method --- */}
                    <div className="flex flex-col gap-y-2">
                        <FormField path="facts.f4.paymentMethod" label="支付方式" type="checkboxGroup" options={[{ value: "progress", label: "按施工进度支付工程款" }, { value: "advance", label: "垫资施工" }, { value: "other", label: "其他" }]} />
                        {paymentMethods.includes('other') && <FormField path="facts.f4.paymentMethodOtherDetails" label="其他方式" type="text"  frontLabel="其他支付方式"/>}
                    </div>

                    {/* --- Payment Type --- */}
                    <div className="flex flex-col gap-y-2">
                        <label className="label-text font-semibold">支付类型</label>
                        <FormField path="facts.f4.paymentType" label="" type="checkboxGroup" options={[{ value: "cash", label: "现金" }, { value: "transfer", label: "转账" }, { value: "bill", label: "票据" }, { value: "other", label: "其他" }]} />
                        {paymentTypes.includes('bill') && <FormField path="facts.f4.billType" label="票据类型" type="text" frontLabel="票据类型" />}
                        {paymentTypes.includes('other') && <FormField path="facts.f4.paymentTypeOtherDetails" label="其他类型" type="text" frontLabel="说明其他支付类型" />}
                    </div>

                     {/* --- Retention Money --- */}
                    <div className="flex flex-col gap-y-2">
                        <FormField path="facts.f4.retention.enabled" label="质保金" type="checkbox" />
                        {retentionEnabled && (
                            <div className="flex flex-col md:flex-row gap-4 items-center mt-2 ">
                                <FormField path="facts.f4.retention.amount" label="质保金金额" type="money" endLabel="元" frontLabel="质保金金额"/>
                                <FormField path="facts.f4.retention.period" label="质保金支付期限" type="text" placeholder="如：竣工验收合格后28天内" frontLabel="质保金支付期限"/>
                            </div>
                        )}
                    </div>
                </div>
            );
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f4") || {};
            const pricing = data.pricing || {};
            const pricingMethods = data.pricingMethods || [];
            const retention = data.retention || {};
            
            const formatPrice = (val, method) => pricingMethods.includes(method) ? (val || '____') : '____';

            const pricingText = `综合单价${pricingMethods.includes('unit') ? '☑' : '☐'} ${formatPrice(pricing.unit, 'unit')}元; 固定单价${pricingMethods.includes('fixed_unit') ? '☑' : '☐'} ${formatPrice(pricing.fixed_unit, 'fixed_unit')}元; 固定总价${pricingMethods.includes('fixed_total') ? '☑' : '☐'} ${formatPrice(pricing.fixed_total, 'fixed_total')}元;\n`+
                              `其他${pricingMethods.includes('other') ? '☑' : '☐'}: ${pricingMethods.includes('other') ? (pricing.other_details || '____') : ''}`;

            const paymentMethods = data.paymentMethod || [];
            let paymentMethodText = `按施工进度支付工程款${paymentMethods.includes('progress') ? '☑' : '☐'}; 垫资施工${paymentMethods.includes('advance') ? '☑' : '☐'}; 其他${paymentMethods.includes('other') ? '☑' : '☐'}`;
            if (paymentMethods.includes('other')) {
                paymentMethodText += `: ${data.paymentMethodOtherDetails || '____'}`;
            }

            const paymentTypes = data.paymentType || [];
            const billText = paymentTypes.includes('bill') ? ` (写明票据类型: ${data.billType || '____'})` : '';
            let paymentTypeText = `以现金${paymentTypes.includes('cash') ? '☑' : '☐'} 转账${paymentTypes.includes('transfer') ? '☑' : '☐'} 票据${paymentTypes.includes('bill') ? '☑' : '☐'}${billText} 其他${paymentTypes.includes('other') ? '☑' : '☐'} 方式`;
            if (paymentTypes.includes('other')) {
                paymentTypeText += `: ${data.paymentTypeOtherDetails || '____'}`;
            }

            let retentionText = `质保金${retention.enabled ? '☑' : '☐'}`;
            if(retention.enabled) {
                retentionText += `${retention.amount ?  formatMoneyWithCN(retention.amount) : '____元'}; 质保金支付期限: ${retention.period || '____'}`;
            }

            return [pricingText, paymentMethodText, paymentTypeText, retentionText].join('\n');
        },
    },
{
    type: "custom",
    path: "facts.f5_period",
    title: "5. 工期",
    children: () => {
        const { watch, setValue } = useFormContext();
        const startDate = watch("facts.f5.startDate");
        const endDate = watch("facts.f5.endDate");

        useEffect(() => {
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                // 确保日期有效且结束日期不早于开始日期
                if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
                    const oneDay = 1000 * 60 * 60 * 24;
                    // 计算天数差并加1，以包含首尾两天
                    const duration = Math.round((end.getTime() - start.getTime()) / oneDay) + 1;
                    setValue("facts.f5.duration", duration, { shouldValidate: true });
                } else {
                    // 如果日期无效或不合逻辑，则清空工期
                    setValue("facts.f5.duration", "", { shouldValidate: true });
                }
            } else {
                 setValue("facts.f5.duration", "", { shouldValidate: true });
            }
        }, [startDate, endDate, setValue]);

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField path="facts.f5.startDate" label="开工时间" type="date" frontLabel="开工时间" />
                <FormField path="facts.f5.endDate" label="竣工时间" type="date" frontLabel="竣工时间"/>
                <FormField 
                    path="facts.f5.duration" 
                    label="工期" 
                    type="number" 
                    endLabel="天" 
                    frontLabel="工期"
                />
            </div>
        );
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f5") || {};
        const startDateText = data.startDate ? formatDateToChinese(data.startDate) : '____';
        const endDateText = data.endDate ? formatDateToChinese(data.endDate) : '____';
        return `开工时间: ${startDateText}; 竣工时间: ${endDateText}; 工期: ${data.duration || '____'}天。`;
    }
},
    {
        type: "optimizationContext",
        path: "facts.f6_quality_acceptance",
        title: "6. 合同约定的工程质量标准及竣工验收程序",

    },
    {
    type: "custom",
    path: "facts.f7_damages_deposit",
    title: "7. 合同约定的违约金(保证金)",
    children: () => {
        const { watch } = useFormContext();

        // 分别监控三个复选框的状态
        const ldEnabled = watch("facts.f7.liquidatedDamages.enabled");
        const depositEnabled = watch("facts.f7.deposit.enabled");
        const latePenaltyEnabled = watch("facts.f7.latePenalty.enabled");

        return (
            <div className="flex flex-col gap-y-4">
                {/* --- 违约金部分 --- */}
                <div className="flex flex-col gap-y-2">
                    <FormField path="facts.f7.liquidatedDamages.enabled" label="违约金" type="checkbox" />
                    {ldEnabled && (
                        <div className="flex flex-col md:flex-row items-center gap-2 mt-1 ">
                            <FormField path="facts.f7.liquidatedDamages.amount" label="" type="money" placeholder="金额" frontLabel="金额" endLabel="元" />
                            <FormField path="facts.f7.liquidatedDamages.clause" label="" type="text" placeholder="条款号" frontLabel="合同条款: 第" endLabel="条" />
                        </div>
                    )}
                </div>

                {/* --- 保证金部分 --- */}
                <div className="flex flex-col gap-y-2">
                    <FormField path="facts.f7.deposit.enabled" label="保证金" type="checkbox" />
                    {depositEnabled && (
                         <div className="flex flex-col md:flex-row items-center gap-2 mt-1 ">
                            <FormField path="facts.f7.deposit.amount" label="" type="money" placeholder="金额" frontLabel="金额" endLabel="元" />
                            <FormField path="facts.f7.deposit.clause" label="" type="text" placeholder="条款号" frontLabel="合同条款: 第" endLabel="条" />
                        </div>
                    )}
                </div>
                
                {/* --- 迟延履行违约金部分 --- */}
                <div className="flex flex-col gap-y-2">
                    <FormField path="facts.f7.latePenalty.enabled" label="迟延履行违约金" type="checkbox" />
                    {latePenaltyEnabled && (
                        <div className="flex flex-col md:flex-row items-center gap-2 mt-1 ">
                            <FormField path="facts.f7.latePenalty.rate" label="" type="number" placeholder="利率" frontLabel="利率" endLabel="% / 日" />
                             <FormField path="facts.f7.latePenalty.clause" label="" type="text" placeholder="条款号" frontLabel="合同条款: 第" endLabel="条" />
                        </div>
                    )}
                </div>
            </div>
        );
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f7") || {};
        
        // --- 处理违约金行 ---
        const ldData = data.liquidatedDamages || {};
        const ldEnabled = ldData.enabled;
        const ldAmountText = ldEnabled ? (ldData.amount || '____') : '____';
        const ldClauseText = ldEnabled ? (ldData.clause || '____') : '____';
        const ldLine = `违约金${ldEnabled ? '☑' : '☐'} ${ldAmountText} 元 ${ldData.amount ? formatNumberToCN(ldData.amount) : ""} (合同条款: 第 ${ldClauseText} 条)`;

        // --- 处理保证金行 ---
        const depositData = data.deposit || {};
        const depositEnabled = depositData.enabled;
        const depositAmountText = depositEnabled ? (depositData.amount || '____') : '____';
        const depositClauseText = depositEnabled ? (depositData.clause || '____') : '____';
        const depositLine = `保证金${depositEnabled ? '☑' : '☐'} ${depositAmountText} 元 ${depositData.amount ? formatNumberToCN(depositData.amount) : ""} (合同条款: 第 ${depositClauseText} 条)`;

        // --- 处理迟延履行违约金行 ---
        const latePenaltyData = data.latePenalty || {};
        const latePenaltyEnabled = latePenaltyData.enabled;
        const latePenaltyRateText = latePenaltyEnabled ? (latePenaltyData.rate || '____') : '____';
        const latePenaltyClauseText = latePenaltyEnabled ? (latePenaltyData.clause || '____') : '____';
        const latePenaltyLine = `迟延履行违约金${latePenaltyEnabled ? '☑' : '☐'} ${latePenaltyRateText} %/日 (合同条款: 第 ${latePenaltyClauseText} 条)`;
        
        return [ldLine, depositLine, latePenaltyLine].join('\n');
    },
},
   {
    type: "custom",
    path: "facts.f8_payment_status",
    title: "8. 工程款支付情况",
    children: () => {
        const { watch } = useFormContext();
        // 监听单选框的选择
        const choice = watch("facts.f8.dueOrOverpaidChoice");

        return (
            <div className="flex flex-col gap-y-3">
                <FormField path="facts.f8.totalPrice" label="工程总价" type="money" frontLabel="工程总价" endLabel="元" />
                <FormField path="facts.f8.paidAmount" label="已支付工程款" type="money" frontLabel="已支付工程款" endLabel="元" />
                
                {/* 单选框，用于选择欠付还是超付 */}
                <FormField 
                    path="facts.f8.dueOrOverpaidChoice" 
                    label="款项状态"
                    type="radio" 
                    options={[
                        { value: "due", label: "欠付工程款" },
                        { value: "overpaid", label: "超付工程款" },
                    ]}
                />

                {/* 仅在选择了“欠付”或“超付”后显示金额和利息输入框 */}
                {choice && (
                    // 使用 React Fragment 包裹多个条件渲染的元素
                    <>
                         <FormField 
                            path="facts.f8.dueOrOverpaidAmount" 
                            label={choice === 'due' ? "欠付金额" : "超付金额"}
                            type="money" 
                            frontLabel={choice === 'due' ? "欠付工程款" : "超付工程款"}
                            endLabel="元" 
                        />
                         <FormField 
                            path="facts.f8.interest" 
                            label={choice === 'due' ? "欠付利息" : "超付利息"}
                            type="money" 
                            frontLabel={choice === 'due' ? "欠付工程款利息" : "超付工程款利息"}
                            endLabel="元" 
                        />
                    </>
                )}
            </div>
        )
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f8") || {};



        const totalPriceText = `工程总价: ${formatMoneyWithCN(data.totalPrice)}`;
        const paidAmountText = `已支付工程款: ${formatMoneyWithCN(data.paidAmount)}`;

        let dueOrOverpaidText = '欠/超付工程款: ____元';
        let interestText = '欠/超付工程款利息: ____元。'; 

        if (data.dueOrOverpaidChoice === 'due') {
            dueOrOverpaidText = `欠付工程款: ${formatMoneyWithCN(data.dueOrOverpaidAmount)}`;
            interestText = `欠付工程款利息: ${formatMoneyWithCN(data.interest)}。`;
        } else if (data.dueOrOverpaidChoice === 'overpaid') {
            dueOrOverpaidText = `超付工程款: ${formatMoneyWithCN(data.dueOrOverpaidAmount)}`;
            interestText = `超付工程款利息: ${formatMoneyWithCN(data.interest)}。`;
        }

        return `${totalPriceText}; ${paidAmountText};\n${dueOrOverpaidText}\n${interestText}`;
    }
},
    {
        type: "custom",
        path: "facts.f9_quality_status",
        title: "9. 建设工程质量情况",
        children: () => {
            const { watch } = useFormContext();
            return (
                <div className="flex flex-col gap-y-2">
                    <FormField path="facts.f9.isQualified" label="工程质量是否合格" type="radio" options={[{ value: 'yes', label: '是' }, { value: 'no', label: '否' }]} />
                    {watch('facts.f9.isQualified') === 'no' && <>
                        <FormField path="facts.f9.qualityIssues" label="工程质量问题" type="optimizable-textarea" optimizationContext="原告关于建设工程质量情况的说明"/>
                        <FormField path="facts.f9.lossAmount" label="工程质量造成损失" type="money" endLabel="元" frontLabel="工程质量造成的损失" />
                    </>}
                </div>
            )
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f9") || {};
            let text = `工程质量是否合格: ${generateSelectionText(['是', '否'], data.isQualified === 'yes' ? '是' : '否')}`;
            if (data.isQualified === 'no') {
                text += `\n工程质量问题: ${data.qualityIssues || '____'}\n工程质量造成损失: ${data.lossAmount ? formatMoneyWithCN(data.lossAmount) : '____元'}`;
            }
            return text;
        }
    },
    {
        type: "custom",
        path: "facts.f10_delivery_status",
        title: "10. 建设工程交付情况",
        children: () => {
            const { watch } = useFormContext();
            return (
                <div className="flex flex-col gap-y-2">
                    <FormField path="facts.f10.isDelayed" label="工程是否迟延交付" type="radio" options={[{ value: 'yes', label: '是' }, { value: 'no', label: '否' }]} />
                    {watch('facts.f10.isDelayed') === 'yes' && <>
                        <FormField path="facts.f10.deliveryDate" label="交付时间" type="date" frontLabel="具体交付日期"/>
                        <FormField path="facts.f10.lossAmount" label="工程迟延交付造成损失" type="money" endLabel="元" frontLabel="工程迟延交付造成损失"/>
                    </>}
                </div>
            )
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f10") || {};
            let text = `工程是否迟延交付: ${generateSelectionText(['是', '否'], data.isDelayed === 'yes' ? '是' : '否')}`;
            if (data.isDelayed === 'yes') {
                text += ` 交付时间: ${data.deliveryDate ?  formatDateToChinese(data.deliveryDate) : '____'}\n工程迟延交付造成损失: ${data.lossAmount || '____'}元。`;
            }
            return text;
        }
    },
    {
        type: "custom",
        path: "facts.f11_stoppage_status",
        title: "11. 停窝工等情况",
        children: () => {
            const { watch } = useFormContext();
            return (
                <div className="flex flex-col gap-y-2">
                    <FormField path="facts.f11.hasStoppage" label="工程是否停窝工" type="radio" options={[{ value: 'yes', label: '是' }, { value: 'no', label: '否' }]} />
                    {watch('facts.f11.hasStoppage') === 'yes' && <FormField path="facts.f11.lossAmount" label="工程停窝工造成损失" type="money" endLabel="元" frontLabel="停窝工造成损失"/>}
                </div>
            )
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f11") || {};
            let text = `工程是否停窝工: ${generateSelectionText(['是', '否'], data.hasStoppage === 'yes' ? '是' : '否')}`;
            if (data.hasStoppage === 'yes') {
                text += `\n工程停窝工造成损失: ${data.lossAmount ? formatMoneyWithCN(data.lossAmount)  : '____元'}`;
            }
            return text;
        }
    },
    {
        type: "custom",
        path: "facts.f12_priority_claim_status",
        title: "12. 是否主张过建设工程价款优先受偿权",
        children: () => {
            const { watch } = useFormContext();
            return (
                <div className="flex flex-col gap-y-2">
                    <FormField path="facts.f12.hasClaimed" label="" type="radio" options={[{ value: 'yes', label: '是' }, { value: 'no', label: '否' }]} />
                    {watch('facts.f12.hasClaimed') === 'yes' &&
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField path="facts.f12.claimDate" label="主张日期" type="date" frontLabel="于"  />
                            <FormField path="facts.f12.claimMethod" label="主张方式" type="text" frontLabel="通过" endLabel="方式主张了建设工程价款优先受偿权" />
                        </div>
                    }
                </div>
            )
        },
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f12") || {};
            let text = `是${data.hasClaimed === 'yes' ? '☑' : '☐'} 否${data.hasClaimed === 'no' ? '☑' : '☐'}`;
            if (data.hasClaimed === 'yes') {
                text += ` 主张情况: 于 ${data.claimDate ? formatDateToChinese(data.claimDate) :  '____'} 通过 ${data.claimMethod || '____'} 方式主张了建设工程价款优先受偿权`;
            }
            return text;
        }
    },
    {
        type: "optimizationContext",
        path: "facts.f13_other_notes",
        title: "13. 其他需要说明的内容(可另附页)",
        optimizationContext:"原告关于建设工程纠纷的其他说明"
    },
    {
        type: "LegalAnalysisField",
        path: "facts.f14_legal_basis",
        title: "14. 请求依据",
        placeholder: "合同约定：\n法律规定：",
        formDataProcessor: processFormDataForPreview,
    },
    {
        type: "textarea",
        path: "facts.f15_evidence_list",
        title: "15. 证据清单(可另附页)",
    },
];

const ClaimsSection: React.FC = () => {
    return (
        <FormSectionCard title="诉讼请求">
            <div className="text-sm p-2 bg-base-200 rounded-md mb-4">
                <p className="font-semibold">填写说明：</p>
                <p>原告为承包人或施工人时, 填写第1项至第5项; 原告为发包人时, 填写第6项至第9项; 第10项至第15项为共同项。</p>
            </div>
            <OptimizableTextarea
                path="claims.fullStatement"
                label="完整陈述"
                placeholder="可在此处完整表述您的诉讼请求..."
                rows={3}
                optimizationContext={`这是原告关于本${CASE_TYPE}案件的诉讼请求完整陈述。`}
            />
            <p className="text-sm my-2">
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
                optimizationContext={`这是一段关于${CASE_TYPE}的案件事实与理由陈述。`}
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

export const ConstructionContractClaimFormPage: React.FC = () => {
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
            formId="claim_construction_contract"
            onSubmit={handleFormSubmit}
            onPreviewData={processFormDataForPreview}
            rightPanel={rightSide}
            docType="起诉状"
            fixedFormValues={{ basicInfo: { caseCause: CASE_TYPE } }}
        >
            <BasicInfoSection case_type={CASE_TYPE} formId="claim_construction_contract" />
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
            <JurisdictionPreservationAppraisalForm path="jurisdictionPreservationAppraisal" config={FORM_CONFIGS.ALL} title="约定管辖、诉前保全及鉴定申请"/>
            <FactsAndReasonsSection />
            <FormSectionCard title="对纠纷解决方式的意愿">
                <MediationForm path="mediation" />
            </FormSectionCard>
        </FormPageLayout>
    );
};

export default ConstructionContractClaimFormPage;