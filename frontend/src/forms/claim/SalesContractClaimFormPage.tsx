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
    formatDateToChinese,
    getValueFromPath,
    formatNumberToCN,
} from "../../utils/formatter";

import { AIChatbotPanel } from "../../components/AIChatbotPanel";
import { OptimizableTextarea } from "../../components/OptimizableTextarea";
import {
    JurisdictionAndPreservationForm,
    formatJurisdictionAndPreservationForDocx,
} from "../../components/claim/JurisdictionAndPreservationForm";
import { QuestionTable } from "../../components/claim/QuestionTable";
import type { QuestionConfig } from "../../components/claim/QuestionTable";
import FormField from "../../components/claim/FormField";

// 定义案件类型
const CASE_TYPE = "买卖合同纠纷";

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
        jurisdictionAndPreservation: formatJurisdictionAndPreservationForDocx(data),
        factItems: formatFormData("facts", data, factsConfig),
        mediationInfo: formatMediationForDocx(data),
    };
};

// 诉讼请求配置 (买卖合同纠纷)
const claimsConfig: QuestionConfig[] = [
    {
        type: "custom",
        path: "claims.c1_payment_amount",
        title: "1. 给付价款（元）",
        children: () => {
            const { control, watch, register } = useFormContext();
            // 监听 "claims.c1.currency" 字段的变化
            const currencyType = watch("claims.c1.currency");

            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <FormField
                        path="claims.c1.amount"
                        label="给付价款"
                        type="money"
                        frontLabel="给付价款"
                        placeholder="输入金额"
                    />

                    <div className="md:col-span-2">
                        {" "}
                        {/* 让币种部分占据两个网格列，空间更足 */}
                        <label className="label pb-1">
                            <span className="label-text">币种</span>
                        </label>
                        <Controller
                            name="claims.c1.currency"
                            control={control}
                            defaultValue="RMB"
                            render={({ field }) => (
                                // 使用一个 flex 容器来水平排列所有选项
                                <div className="flex items-center gap-x-4 pt-1 m-1">
                                    {/* 选项1: 人民币 */}
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

                                    {/* 选项2: 外币 */}
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

                                    {/* 条件渲染的输入框，作为上面两个label的兄弟元素 */}
                                    {currencyType === "other" && (
                                        <input
                                            type="text"
                                            {...register("claims.c1.currencyName")}
                                            className="input input-bordered input-sm w-auto" // 使用 w-auto 自动宽度
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
            const amountText = data.amount
                ? ` ${data.amount} 元 ${formatNumberToCN(data.amount)}`
                : "     元";
            let currencyText = "";
            if (data.currency === "RMB") {
                currencyText = "(人民币, 下同)";
            } else if (data.currency === "other") {
                // 如果外币名称有值，就用它，否则给一个默认提示
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
        title: "2. 迟延给付价款的利息（违约金）",
        children: () => (
            <div className="flex flex-col gap-y-2">
                <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                    <FormField
                        path="claims.c2.date"
                        label="截至日期"
                        type="date"
                        frontLabel="截至"
                        endLabel="止"
                        className="col-span-1"
                    />
                    <FormField
                        path="claims.c2.totalDelayPayment"
                        label=""
                        type="money"
                        frontLabel="迟延给付价款的利息"
                        endLabel="元"
                        className="col-span-1"
                    />

                    <FormField
                        path="claims.c2.penalty"
                        label=""
                        type="money"
                        frontLabel="违约金"
                        endLabel="元"
                        className="col-span-1"
                    />
                    <FormField
                        path="claims.c2.base_amount"
                        label="基数"
                        type="money"
                        frontLabel="以"
                        endLabel="元为基数"
                        className="col-span-1"
                    />
                    <FormField
                        path="claims.c2.delay_payment_interest_calculation_date"
                        label="利息违约金计算日期"
                        type="date"
                        frontLabel="利息违约金计算起始日"
                        className="col-span-1"
                    />
                    <FormField
                        path="claims.c2.standard"
                        label="标准"
                        type="text"
                        frontLabel="按照"
                        endLabel="标准计算"
                        placeholder="例：目前3年期LPR报价"
                        className="col-span-1"
                    /></div>
                <FormField
                    label="计算方式"
                    path="claims.c2.howToCalculate"
                    type="optimizable-textarea"
                    placeholder="输入具体计算方式"
                    optimizationContext='原告关于被告迟延给付价款的利息的计算方式说明'
                />
                <FormField
                    path="claims.c2.pay_to_now"
                    label="是否请求支付至实际清偿之日止"
                    type="radio"
                    options={[
                        { value: "yes", label: "是" },
                        { value: "no", label: "否" },
                    ]}
                />
            </div>
        ),
        formatter: (formData) => {
            const data = getValueFromPath(formData, "claims.c2") || {};
            const dateText = data.date ? formatDateToChinese(data.date) : "____";
            const baseAmountText = data.base_amount || "____";
            const standardText = data.standard || "____";
            const totalDelayPaymentText = data.totalDelayPayment
                ? ` ${data.totalDelayPayment} 元 ${formatNumberToCN(data.totalDelayPayment)}`
                : "____元";
            const penaltyText = data.penalty
                ? ` ${data.penalty} 元 ${formatNumberToCN(data.penalty)}`
                : "____元";
            const delayPaymentInterestCalculationDateText = data.delay_payment_interest_calculation_date
                ? formatDateToChinese(data.delay_payment_interest_calculation_date)
                : "____";
            const howToCalculate = data.howToCalculate ? `\n${data.howToCalculate}` : "";
            const payToNowText = generateSelectionText(
                ["是", "否"],
                data.pay_to_now === "yes" ? "是" : "否"
            );
            return `截至 ${dateText} 止，迟延给付价款的利息  ${totalDelayPaymentText}、违约金 ${penaltyText} ，自 ${delayPaymentInterestCalculationDateText} 起的逾期利息、违约金，以 ${baseAmountText} 元为基数，按照 ${standardText} 计算；\n计算方式：${howToCalculate}\n是否请求支付至实际清偿之日止：${payToNowText}`;
        },
    },
    {
        type: "custom",
        path: "claims.c3_compensation_for_breach",
        title: "3. 赔偿因卖方违约所受的损失",
        children: () => (
            <div className="flex flex-col gap-y-2">
                <FormField
                    path="claims.c3.amount"
                    label="赔偿金额"
                    type="money"
                    frontLabel="支付赔偿金"
                    endLabel="元"
                />
                <FormField
                    path="claims.c3.breach_type"
                    label="违约类型"
                    type="radio"
                    options={[
                        { value: "late_delivery", label: "迟延履行" },
                        { value: "non_delivery", label: "不履行" },
                        { value: "other", label: "其他" },
                    ]}
                />
                <FormField
                    path="claims.c3.details"
                    label="具体情形"
                    type="optimizable-textarea"
                    placeholder="说明具体违约情形"
                    optimizationContext="原告关于被告赔偿因卖方违约所受的损失的计算方式说明"
                />
                <FormField
                    path="claims.c3.basis"
                    label="损失计算依据"
                    type="optimizable-textarea"
                    placeholder="说明损失如何计算得出"
                    optimizationContext="原告关于被告所欠损失所计算依据说明"
                />
            </div>
        ),
        formatter: (formData) => {
            const data = getValueFromPath(formData, "claims.c3") || {};
            const breachTypes = {
                late_delivery: "迟延履行",
                non_delivery: "不履行",
                other: "其他",
            };
            const breachText = generateSelectionText(
                Object.values(breachTypes),
                breachTypes[data.breach_type]
            );
            const details = data.details ? `\n ${data.details}` : "";
            const basis = data.basis ? `\n ${data.basis}` : "";
            const amountText = data.amount ? `${data.amount}元 ${formatNumberToCN(data.amount)}` : "____";
            return `支付赔偿金 ${amountText} 元\n违约类型: ${breachText}\n具体情形: ${details}\n损失计算依据: ${basis}`;
        },
    },
// REPLACE the old "claims.c4_defect_liability" object with this new one.
{
  type: "custom",
  path: "claims.c4_defect_liability",
  title: "4. 是否对标的物的瑕疵承担责任",
  children: () => {
    const { watch } = useFormContext();

    // Watch the 'yes'/'no' radio button
    const hasLiability = watch("claims.c4_defect_liability.hasLiability");
    // Watch the array of selected checkbox types
    const liabilityTypes = watch("claims.c4_defect_liability.types") || [];

    return (
      <div className="flex flex-col gap-y-2">
        {/* The primary Yes/No radio button */}
        <FormField
          path="claims.c4_defect_liability.hasLiability"
          label=""
          type="radio"
          options={[
            { value: "yes", label: "是" },
            { value: "no", label: "否" },
          ]}
        />

        {/* Conditionally render the detailed options only when "Yes" is selected */}
        {hasLiability === "yes" && (
          <div className="pt-2 mt-2 border-l-2 border-base-200 flex flex-col gap-y-2">
            <FormField
              path="claims.c4_defect_liability.types"
              label="请选择具体责任方式（可多选）:"
              type="checkboxGroup"
              options={[
                { value: "repair", label: "修理" },
                { value: "redo", label: "重作" },
                { value: "replace", label: "更换" },
                { value: "return", label: "退货" },
                { value: "reduce_price", label: "减少价款或者报酬" },
                { value: "other", label: "其他" },
              ]}
            />

            {/* Conditionally render the text input when "其他" is checked */}
            {liabilityTypes.includes("other") && (
              <FormField
                path="claims.c4_defect_liability.otherDetail"
                label="其他方式说明"
                frontLabel="具体责任方式"
                type="text"
                placeholder="请详细说明其他责任方式"
              />
            )}
          </div>
        )}
      </div>
    );
  },
  formatter: (formData) => {
    const data = getValueFromPath(formData, "claims.c4_defect_liability") || {};
    const isYes = data.hasLiability === 'yes';
    const isNo = data.hasLiability === 'no';

    let yesLine = `是 ${isYes ? '☑' : '☐'}`;
    const noLine = `否 ${isNo ? '☑' : '☐'}`;

    if (isYes) {
        const optionsMap = {
            repair: "修理",
            redo: "重作",
            replace: "更换",
            return: "退货",
            reduce_price: "减少价款或者报酬",
            other: "其他",
        };
        const selectedTypes = data.types || [];

        const optionsText = Object.entries(optionsMap)
            .map(([value, label]) => `${label}${selectedTypes.includes(value) ? '☑' : '☐'}`)
            .join(' ');

        yesLine += ` ${optionsText}`;

        if (selectedTypes.includes('other') && data.otherDetail) {
            yesLine += `: ${data.otherDetail}`;
        }
    }

    return `${yesLine}\n${noLine}`;
  },
},
    // 在 SalesContractClaimFormPage.tsx 文件中，找到 claimsConfig 数组并替换第5个元素

{
    type: "custom",
    path: "claims.c5_performance_or_termination",
    title: "5. 要求继续履行或者解除合同",
    children: () => {
        const { watch } = useFormContext();
        // 监听主单选按钮的选项
        const selectedAction = watch("claims.c5.action");

        return (
            <div className="flex flex-col gap-y-2">
                {/* 主要的三个选项 */}
                <FormField
                    path="claims.c5.action"
                    label=""
                    type="radio"
                    options={[
                        { value: "continue", label: "继续履行" },
                        { value: "terminate", label: "判令解除合同" },
                        { value: "confirm_terminated", label: "确认买卖合同已解除" },
                    ]}
                />

                {/* 条件：如果选择 "继续履行" */}
                {selectedAction === 'continue' && (
                    <div className="pt-2 mt-2 border-l-2 border-base-200 flex flex-col gap-y-3">
                        <FormField
                            path="claims.c5.deadline"
                            label="履行完毕日期"
                            type="number"
                            frontLabel="期限"
                            endLabel="日内履行完毕"
                        />
                        <FormField
                            path="claims.c5.obligations"
                            label="具体义务"
                            type="radio"
                            options={[
                                { value: 'payment', label: '付款' },
                                { value: 'delivery', label: '供货' },
                            ]}
                        />
                    </div>
                )}

                {/* 条件：如果选择 "确认买卖合同已解除" */}
                {selectedAction === 'confirm_terminated' && (
                    <div className="pt-2 mt-2 border-l-2 border-base-200">
                        <FormField
                            path="claims.c5.terminationDate"
                            label="解除日期"
                            type="date"
                            frontLabel="合同已于"
                            endLabel="解除"
                        />
                    </div>
                )}
            </div>
        );
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "claims.c5") || {};
        const action = data.action;

        // 1. 处理 "继续履行" 行
        let continueLine = "继续履行☐";
        if (action === 'continue') {
            const deadlineText = data.deadline ? ` ${data.deadline} 日内` : "____日内";
            const obligations = data.obligations || [];
            const obligationText = [
                `付款${obligations.includes('payment') ? '☑' : '☐'}`,
                `供货${obligations.includes('delivery') ? '☑' : '☐'}`
            ].join(' ');
            
            continueLine = `继续履行☑ ${deadlineText}履行完毕 ${obligationText} 义务`;
        } else {
            continueLine = `继续履行☐ ____日内履行完毕付款□ 供货□ 义务`;
        }

        // 2. 处理 "判令解除合同" 行
        const terminateLine = `判令解除合同${action === 'terminate' ? '☑' : '☐'}`;
        
        // 3. 处理 "确认合同解除" 行
        let confirmLine = "确认买卖合同已于____年____月____日解除☐";
        if (action === 'confirm_terminated') {
            const terminationDate = data.terminationDate ? formatDateToChinese(data.terminationDate) : '____年____月____日';
            confirmLine = `确认买卖合同已于 ${terminationDate} 解除☑`;
        }

        return [continueLine, terminateLine, confirmLine].join('\n');
    },
},
    // 替换旧的 claims.c6_security_rights 对象
{
    type: "custom",
    path: "claims.c6_security_rights",
    title: "6. 是否主张担保权利",
    children: () => {
        const { watch } = useFormContext();
        const isYes = watch("claims.c6_security_rights.choice") === "yes";

        return (
            <div className="flex flex-col gap-y-2">
                <FormField
                    path="claims.c6_security_rights.choice"
                    label=""
                    type="radio"
                    options={[
                        { value: "yes", label: "是" },
                        { value: "no", label: "否" },
                    ]}
                />
                {isYes && (
                    <div className="mt-2 border-l-2 border-base-200">
                        <FormField
                            path="claims.c6_security_rights.details"
                            label="担保权利内容"
                            type="optimizable-textarea"
                            placeholder="请填写具体内容"
                            optimizationContext="原告关于担保权利内容的说明"
                        />
                    </div>
                )}
            </div>
        );
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "claims.c6_security_rights") || {};
        let yesLine = `是 ${data.choice === 'yes' ? '☑' : '☐'}`;
        if (data.choice === 'yes') {
            yesLine += ` ${data.details ? `\n内容：${data.details}`:'内容：'}`;
        }
        const noLine = `否 ${data.choice === 'no' ? '☑' : '☐'}`;
        return `${yesLine}\n${noLine}`;
    },
},

// 替换旧的 claims.c7_realization_costs 对象
{
    type: "custom",
    path: "claims.c7_realization_costs",
    title: "7. 是否主张实现债权的费用",
    children: () => {
        const { watch } = useFormContext();
        const isYes = watch("claims.c7_realization_costs.choice") === "yes";

        return (
            <div className="flex flex-col gap-y-2">
                <FormField
                    path="claims.c7_realization_costs.choice"
                    label=""
                    type="radio"
                    options={[
                        { value: "yes", label: "是" },
                        { value: "no", label: "否" },
                    ]}
                />
                {isYes && (
                    <div className="mt-2 border-l-2 border-base-200">
                        <FormField
                            path="claims.c7_realization_costs.details"
                            label="费用明细"
                            type="textarea"
                            placeholder="请填写费用明细，例如：律师费xxxx元"
                        />
                    </div>
                )}
            </div>
        );
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "claims.c7_realization_costs") || {};
        let yesLine = `是 ${data.choice === 'yes' ? '☑' : '☐'}`;
        if (data.choice === 'yes') {
            yesLine += ` 费用明细: ${data.details || '____'}`;
        }
        const noLine = `否 ${data.choice === 'no' ? '☑' : '☐'}`;
        return `${yesLine}\n${noLine}`;
    },
},
    {
        type: "radio",
        path: "claims.c8_litigation_costs",
        title: "8. 是否主张诉讼费用",
        options: [
            { value: "yes", label: "是" },
            { value: "no", label: "否" },
        ],
    },
    {
        type: "optimizationContext",
        path: "claims.c9_other_claims",
        title: "9. 其他请求",
    },
    {
        type: "optimizationContext",
        path: "claims.c10_total_amount",
        title: "10. 标的总额",
    },
];

// 事实与理由配置 (买卖合同纠纷)
const factsConfig: QuestionConfig[] = [
    {
        type: "optimizationContext",
        path: "facts.f1_contract_signing",
        title: "1. 合同的签订情况（名称、编号、签订时间、地点等；如无书面合同，请注明“无书面合同”）",
        placeholder: "",
        optimizationContext:"原告关于合同的签订情况的说明"
    },
    {
        type: "custom",
        path: "facts.f2_parties",
        title: "2. 合同主体",
        children: () => (
            <>
            <div className="flex flex-col gap-y-2">
                <FormField type="text" path="facts.f2.seller" label="出卖人（卖方）" frontLabel="出卖人（卖方）"/>
                <FormField type="text" path="facts.f2.buyer" label="买受人（买方）" frontLabel="买受人（买方）"/>
                </div>
            </>
        ),
        formatter: (formData) => {
            const data = getValueFromPath(formData, "facts.f2") || {};
            return `出卖人（卖方）：${data.seller || "____"}\n买受人（买方）：${data.buyer || "____"
                }`;
        },
    },
    {
        type: "optimizationContext",
        path: "facts.f3_subject_matter",
        title: "3. 买卖标的物情况（标的物名称、规格、质量、数量等）",
        placeholder: "",
        optimizationContext: "原告有关买卖标的物的描述",
    },
    // 在 factsConfig 数组中，替换旧的 facts.f4_price_payment 对象

{
    type: "custom",
    path: "facts.f4_price_payment",
    title: "4. 合同约定的价格及支付方式",
    children: () => {
        const { watch } = useFormContext();
        // 监控支付方式复选框
        const paymentMethods = watch("facts.f4.payment_method") || [];
        // 监控支付期次单选按钮
        const paymentSchedule = watch("facts.f4.payment_schedule");

        return (
            <div className="flex flex-col gap-y-2">
                {/* 价格部分 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <FormField path="facts.f4.unit_price" label="单价" type="money" frontLabel="单价"/>
                    <FormField path="facts.f4.total_price" label="总价" type="money" frontLabel="总价"/>
                </div>
                
                {/* 支付方式部分 */}
                <FormField 
                    path="facts.f4.payment_method" 
                    label="支付方式" 
                    type="checkboxGroup" 
                    options={[
                        { value: "cash", label: "现金" }, 
                        { value: "transfer", label: "转账" }, 
                        { value: "bill", label: "票据" }, 
                        { value: "other", label: "其他" }
                    ]} 
                />
                
                {/* 条件渲染: 如果勾选了 "票据" */}
                {paymentMethods.includes('bill') && (
                    <div className="">
                        <FormField
                            path="facts.f4.bill_type"
                            label=""
                            type="text"
                            placeholder="请写明票据类型, 如：银行承兑汇票"
                            frontLabel="票据类型:"
                        />
                    </div>
                )}
                
                {/* 条件渲染: 如果勾选了 "其他" */}
                {paymentMethods.includes('other') && (
                    <div className="">
                        <FormField
                            path="facts.f4.other_method_details"
                            label=""
                            type="text"
                            placeholder="请说明其他支付方式"
                            frontLabel="其他方式:"
                        />
                    </div>
                )}

                {/* 支付期次部分 */}
                <FormField 
                    path="facts.f4.payment_schedule" 
                    label="支付期次" 
                    type="radio" 
                    options={[
                        { value: "lump", label: "一次性" }, 
                        { value: "installment", label: "分期" }
                    ]} 
                />

                {/* 条件渲染: 如果选择了 "分期" */}
                {paymentSchedule === 'installment' && (
                    <div className="">
                        <FormField
                            path="facts.f4.installment_details"
                            label="分期方式"
                            type="textarea"
                            rows={2}
                            placeholder="请说明具体分期方式, 如：分三期，首期支付50%..."
                        />
                    </div>
                )}
            </div>
        );
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f4") || {};
        
        // 1. 价格行
        const priceText = `单价：${data.unit_price || "____"}元；总价：${data.total_price || "____"}元`;

        // 2. 支付方式行
        const methods = data.payment_method || [];
        const paymentOptions = {
            cash: `现金${methods.includes('cash') ? '☑' : '☐'}`,
            transfer: `转账${methods.includes('transfer') ? '☑' : '☐'}`,
            bill: `票据（${methods.includes('bill') && data.bill_type ? data.bill_type : '写明票据类型'}）${methods.includes('bill') ? '☑' : '☐'}`,
            other: `其他${methods.includes('other') ? '☑' : '☐'}`
        };
        let methodText = `支付方式: ${Object.values(paymentOptions).join(' ')}`;
        if (methods.includes('other') && data.other_method_details) {
            methodText += `：${data.other_method_details}`;
        }
        
        // 3. 支付期次行
        const schedule = data.payment_schedule;
        const scheduleOptions = {
            lump: `一次性${schedule === 'lump' ? '☑' : '☐'}`,
            installment: `分期${schedule === 'installment' ? '☑' : '☐'}`
        };
        let scheduleText = `支付期次: ${Object.values(scheduleOptions).join(' ')}`;
        if (schedule === 'installment' && data.installment_details) {
            scheduleText += `\n分期方式：${data.installment_details}`;
        }

        return `${priceText}\n${methodText}\n${scheduleText}`;
    }
},
    {
        type: "optimizationContext",
        path: "facts.f5_delivery_details",
        title: "5. 合同约定的交货时间、地点、方式、风险承担、安装、调试、验收",
    },
    {
        type: "optimizationContext",
        path: "facts.f6_quality_standards",
        title: "6. 合同约定的质量标准及检验方式、质量异议期限",
    },
// 在 factsConfig 数组中，替换旧的 facts.f7_liquidated_damages 对象

{
    type: "custom",
    path: "facts.f7_liquidated_damages",
    title: "7. 合同约定的违约金（定金）",
    children: () => {
        const { watch } = useFormContext();
        // 分别监控三个复选框的状态
        const hasLiquidatedDamages = watch("facts.f7.liquidated_damages.enabled");
        const hasDeposit = watch("facts.f7.deposit.enabled");
        const hasLateFee = watch("facts.f7.late_fee.enabled");

        return (
            <div className="flex flex-col gap-y-4">
                {/* --- 违约金部分 --- */}
                <div className="flex flex-col gap-y-2">
                    <FormField
                        path="facts.f7.liquidated_damages.enabled"
                        label="违约金"
                        type="checkbox"
                    />
                    {hasLiquidatedDamages && (
                        <div className="flex flex-col md:flex-row items-center gap-2 mt-1">
                            <FormField
                                path="facts.f7.liquidated_damages.amount"
                                label=""
                                type="money"
                                placeholder="金额"
                                frontLabel="违约金金额"
                            />
                            <FormField
                                path="facts.f7.liquidated_damages.clause"
                                label=""
                                type="text"
                                placeholder="条款号"
                                frontLabel="合同条款：第"
                                endLabel="条"
                            />
                        </div>
                    )}
                </div>

                {/* --- 定金部分 --- */}
                <div className="flex flex-col gap-y-2">
                    <FormField
                        path="facts.f7.deposit.enabled"
                        label="定金"
                        type="checkbox"
                    />
                    {hasDeposit && (
                        <div className="flex flex-col md:flex-row items-center gap-2 mt-1">
                            <FormField
                                path="facts.f7.deposit.amount"
                                label=""
                                type="money"
                                placeholder="金额"
                                frontLabel="定金金额"
                            />
                            <FormField
                                path="facts.f7.deposit.clause"
                                label=""
                                type="text"
                                placeholder="条款号"
                                frontLabel="合同条款：第"
                                endLabel="条"
                            />
                        </div>
                    )}
                </div>
                
                {/* --- 迟延履行违约金部分 --- */}
                <div className="flex flex-col gap-y-2">
                    <FormField
                        path="facts.f7.late_fee.enabled"
                        label="迟延履行违约金"
                        type="checkbox"
                    />
                    {hasLateFee && (
                        <div className="flex flex-col md:flex-row items-center gap-2 mt-1">
                            <FormField
                                path="facts.f7.late_fee.rate"
                                label=""
                                type="number"
                                placeholder="利率"
                                frontLabel="违约金利率"
                                endLabel="% / 日"
                            />
                             <FormField
                                path="facts.f7.late_fee.clause"
                                label=""
                                type="text"
                                placeholder="条款号"
                                frontLabel="合同条款：第"
                                endLabel="条"
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    },
formatter: (formData) => {

    const data = getValueFromPath(formData, "facts.f7") || {};
    
    // 违约金行
    const ldData = data.liquidated_damages || {};
    const ldEnabled = ldData.enabled;
    const ldAmountText = (ldEnabled && ldData.amount) 
        ? `${ldData.amount}元 ${formatNumberToCN(ldData.amount)}` 
        : '____元';
    const ldClauseText = (ldEnabled && ldData.clause) ? ldData.clause : '____';
    const ldLine = `违约金${ldEnabled ? '☑' : '☐'} ${ldAmountText}（合同条款：第 ${ldClauseText} 条）`;

    // 定金行
    const depositData = data.deposit || {};
    const depositEnabled = depositData.enabled;
    const depositAmountText = (depositEnabled && depositData.amount) 
        ? `${depositData.amount}元 ${formatNumberToCN(depositData.amount)}` 
        : '____元';
    const depositClauseText = (depositEnabled && depositData.clause) ? depositData.clause : '____';
    const depositLine = `定金${depositEnabled ? '☑' : '☐'} ${depositAmountText}（合同条款：第 ${depositClauseText} 条）`;
    
    // 迟延履行违约金行
    const lateFeeData = data.late_fee || {};
    const lateFeeEnabled = lateFeeData.enabled;
    const lateFeeRateText = (lateFeeEnabled && lateFeeData.rate) ? lateFeeData.rate : '____';
    const lateFeeClauseText = (lateFeeEnabled && lateFeeData.clause) ? lateFeeData.clause : '____';
    const lateFeeLine = `迟延履行违约金${lateFeeEnabled ? '☑' : '☐'} ${lateFeeRateText} %/日（合同条款：第 ${lateFeeClauseText} 条）`;

    return [ldLine, depositLine, lateFeeLine].join('\n');
},
},
   {
    type: "custom",
    path: "facts.f8_payment_delivery_status",
    title: "8. 价款支付及标的物交付情况",
    children: () => (
        <div className="flex flex-col gap-y-3">
            {/* 第一行：价款支付情况 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                <FormField
                    path="facts.f8.payment.on_time"
                    label=""
                    type="money"
                    frontLabel="按期支付价款"
                    placeholder=""
                />
                <FormField
                    path="facts.f8.payment.overdue"
                    label=""
                    type="money"
                    frontLabel="逾期付款"
                    placeholder=""
                />
                <FormField
                    path="facts.f8.payment.unpaid"
                    label=""
                    type="money"
                    frontLabel="逾期未付款"
                    placeholder=""
                />
            </div>

            {/* 第二行：标的物交付情况 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                <FormField
                    path="facts.f8.delivery.on_time"
                    label=""
                    type="text"
                    frontLabel="按期交付标的物"
                    placeholder=""
                />
                <FormField
                    path="facts.f8.delivery.overdue"
                    label=""
                    type="text"
                    frontLabel="逾期交付"
                    placeholder=""
                />
                <FormField
                    path="facts.f8.delivery.undelivered"
                    label=""
                    type="text"
                    frontLabel="逾期未交付"
                    placeholder=""
                />
            </div>
        </div>
    ),

formatter: (formData) => {

    const data = getValueFromPath(formData, "facts.f8") || {};
    const paymentData = data.payment || {};
    const deliveryData = data.delivery || {};

    // 辅助函数，用于格式化金额，如果无值则返回占位符
    const formatMoneyField = (amount) => {
        return amount ? `${amount}元 ${formatNumberToCN(amount)}` : '____元';
    };

    // 构建价款支付行，对每个金额字段应用格式化
    const paymentLine = `按期支付价款 ${formatMoneyField(paymentData.on_time)}，逾期付款 ${formatMoneyField(paymentData.overdue)}，逾期未付款 ${formatMoneyField(paymentData.unpaid)}`;
    
    // 标的物交付行保持不变，因为它不是金额
    const deliveryLine = `按期交付标的物 ${deliveryData.on_time || '____件'} ，逾期交付 ${deliveryData.overdue || '____件'} ，逾期未交付 ${deliveryData.undelivered || '____件'} `;
    
    return `${paymentLine}\n${deliveryLine}`;
},
},
    {
    type: "custom",
    path: "facts.f9_is_late_performance",
    title: "9. 是否存在迟延履行",
    children: () => {
        const { watch } = useFormContext();
        const isLate = watch("facts.f9.choice") === "yes";

        return (
            <div className="flex flex-col gap-y-2">
                <FormField
                    path="facts.f9.choice"
                    label=""
                    type="radio"
                    options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]}
                />
                {isLate && (
                    <div className="flex flex-col md:flex-row items-center gap-x-4 gap-y-2 mt-2">
                        <FormField
                            path="facts.f9.delay_time"
                            label=""
                            type="text"
                            frontLabel="迟延时间:"
                            placeholder="例如：30天"
                        />
                        <FormField
                            path="facts.f9.delay_type"
                            label=""
                            type="radio"
                            options={[
                                { value: "payment", label: "逾期付款" },
                                { value: "delivery", label: "逾期交货" },
                            ]}
                        />
                    </div>
                )}
            </div>
        );
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f9") || {};
        const choice = data.choice;
        let yesLine = `是${choice === 'yes' ? '☑' : '☐'}`;
        if (choice === 'yes') {
            const delayTime = data.delay_time || '____';
            const delayType = data.delay_type;
            const paymentChecked = delayType === 'payment' ? '☑' : '☐';
            const deliveryChecked = delayType === 'delivery' ? '☑' : '☐';
            yesLine += ` 迟延时间: ${delayTime} 逾期付款${paymentChecked} 逾期交货${deliveryChecked}`;
        }else {
            return `有☐ 迟延时间： 逾期付款□ 逾期交货□\n无☑`;
        }
        const noLine = `否${choice === 'no' ? '☑' : '☐'}`;
        return `${yesLine}\n${noLine}`;
    },
},
{
    type: "custom",
    path: "facts.f10_has_urged_performance",
    title: "10. 是否催促过履行",
    children: () => (
        <FormField
            path="facts.f10_has_urged_performance"
            label=""
            type="radio_detail"
            options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]}
            triggerValue="yes"
            detailsLabel="催促情况"
            placeholder="示例：2020年3月24日、5月13日，先后通过发送催款函件方式进行了催促"
            optimizationContext="原告关于催促对方履行合同义务的具体情况描述"
        />
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f10_has_urged_performance") || {};
        const choice = data.choice;
        let yesLine = `是${choice === 'yes' ? '☑' : '☐'}`;
        if (choice === 'yes') {
            yesLine += ` 催促情况: ${data.details || '____'}`;
        }else {
            return `有☐ 催促情况： 年 月 日通过 方式进行了催促\n无☑`;
        }
        const noLine = `否${choice === 'no' ? '☑' : '☐'}`;
        return `${yesLine}\n${noLine}`;
    },
},


{
    type: "custom",
    path: "facts.f11_has_quality_dispute",
    title: "11. 买卖合同标的物有无质量争议",
    children: () => (
        <FormField
            path="facts.f11_has_quality_dispute"
            label=""
            type="radio_detail"
            options={[{ value: "yes", label: "有" }, { value: "no", label: "无" }]}
            triggerValue="yes"
            detailsLabel="具体情况"
            placeholder="请说明质量争议的具体情况"
        />
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f11_has_quality_dispute") || {};
        const choice = data.choice;
        let positiveLine = `有${choice === 'yes' ? '☑' : '☐'}`;
        if (choice === 'yes') {
            positiveLine += ` 具体情况: ${data.details || '____'}`;
        } else {
            return `有☐\n无☑`;
        }
        const negativeLine = `无${choice === 'no' ? '☑' : '☐'}`;
        // 注意：图片中“有”和“无”是在同一行，但为了UI清晰，通常分行
        // 如果严格要求同行，可以 return `${positiveLine} ${negativeLine}`;
        return `${positiveLine}\n${negativeLine}`;
    },
},
{
    type: "custom",
    path: "facts.f12_is_non_conforming",
    title: "12. 标的物质量规格或履行方式是否存在不符合约定的情况",
    children: () => (
        <FormField
            path="facts.f12_is_non_conforming"
            label=""
            type="radio_detail"
            options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]}
            triggerValue="yes"
            detailsLabel="具体情况"
            placeholder="请说明不符合约定的具体情况"
        />
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f12_is_non_conforming") || {};
        const choice = data.choice;
        let positiveLine = `是${choice === 'yes' ? '☑' : '☐'}`;
        if (choice === 'yes') {
            positiveLine += ` 具体情况: ${data.details || '____'}`;
        }
        const negativeLine = `否${choice === 'no' ? '☑' : '☐'}`;
        return `${positiveLine}\n${negativeLine}`;
    },
},
{
    type: "custom",
    path: "facts.f13_has_negotiated_quality",
    title: "13. 是否曾就标的物质量问题进行协商",
    children: () => (
        <FormField
            path="facts.f13_has_negotiated_quality"
            label=""
            type="radio_detail"
            options={[{ value: "yes", label: "是" }, { value: "no", label: "否" }]}
            triggerValue="yes"
            detailsLabel="具体情况"
            placeholder="请说明协商的具体情况"
        />
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f13_has_negotiated_quality") || {};
        const choice = data.choice;
        let positiveLine = `是${choice === 'yes' ? '☑' : '☐'}`;
        if (choice === 'yes') {
            positiveLine += ` 具体情况: ${data.details || '____'}`;
        }
        const negativeLine = `否${choice === 'no' ? '☑' : '☐'}`;
        return `${positiveLine}\n${negativeLine}`;
    },
},
{
    type: "custom",
    path: "facts.f14_has_notified_termination",
    title: "14. 是否通知解除合同",
    children: () => (
        <FormField
            path="facts.f14_has_notified_termination"
            label=""
            type="radio_detail"
            options={[{ value: "yes", label: "是" }, { value: "no", "label": "否" }]}
            triggerValue="yes"
            detailsLabel="具体情况"
            placeholder="请说明通知解除合同的具体情况"
        />
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f14_has_notified_termination") || {};
        const choice = data.choice;
        let positiveLine = `是${choice === 'yes' ? '☑' : '☐'}`;
        if (choice === 'yes') {
            positiveLine += ` 具体情况: ${data.details || '____'}`;
        }
        const negativeLine = `否${choice === 'no' ? '☑' : '☐'}`;
        return `${positiveLine}\n${negativeLine}`;
    },
},


{
    type: "custom",
    path: "facts.f15_amounts_due",
    title: "15. 被告应当支付的利息、违约金、赔偿金",
    children: () => {
        const { watch, setValue } = useFormContext();
        
        // 监控三个复选框和金额输入框
        const interestEnabled = watch("facts.f15.interest.enabled");
        const damagesEnabled = watch("facts.f15.liquidated_damages.enabled");
        const compensationEnabled = watch("facts.f15.compensation.enabled");

        const interestAmount = watch("facts.f15.interest.amount") || 0;
        const damagesAmount = watch("facts.f15.liquidated_damages.amount") || 0;
        const compensationAmount = watch("facts.f15.compensation.amount") || 0;

        // 自动计算总额
        React.useEffect(() => {
            const total = (interestEnabled ? +interestAmount : 0) + 
                          (damagesEnabled ? +damagesAmount : 0) + 
                          (compensationEnabled ? +compensationAmount : 0);
            setValue("facts.f15.total", total > 0 ? total : '');
        }, [interestEnabled, damagesEnabled, compensationEnabled, interestAmount, damagesAmount, compensationAmount, setValue]);

        return (
            <div className="flex flex-col gap-y-3">
                <div className="flex items-center gap-x-2">
                    <FormField path="facts.f15.interest.enabled" label="利息" type="checkbox" />
                    {interestEnabled && <FormField path="facts.f15.interest.amount" label="" type="money" frontLabel="利息金额"/>}
                </div>
                <div className="flex items-center gap-x-2">
                    <FormField path="facts.f15.liquidated_damages.enabled" label="违约金" type="checkbox" />
                    {damagesEnabled && <FormField path="facts.f15.liquidated_damages.amount" label="" type="money" frontLabel="违约金金额"/>}
                </div>
                 <div className="flex items-center gap-x-2">
                    <FormField path="facts.f15.compensation.enabled" label="赔偿金" type="checkbox" />
                    {compensationEnabled && <FormField path="facts.f15.compensation.amount" label="" type="money" frontLabel="赔偿金金额"/>}
                </div>
                <FormField path="facts.f15.total" label="共计" type="money" frontLabel="共计金额"/>
                <FormField path="facts.f15.calculation_method" label="计算方式" type="textarea" rows={2} placeholder="请说明计算方式"/>
            </div>
        );
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f15") || {};
        const format = (val) => val ? `${val}元 ${formatNumberToCN(val)}` : '____元';
        
        const iData = data.interest || {};
        const dData = data.liquidated_damages || {};
        const cData = data.compensation || {};

        const iLine = `利息${iData.enabled ? '☑' : '☐'} ${iData.enabled ? format(iData.amount) : '____元'}`;
        const dLine = `违约金${dData.enabled ? '☑' : '☐'} ${dData.enabled ? format(dData.amount) : '____元'}`;
        const cLine = `赔偿金${cData.enabled ? '☑' : '☐'} ${cData.enabled ? format(cData.amount) : '____元'}`;
        
        const totalLine = `共计 ${format(data.total)}`;
        const calcLine = `计算方式: ${data.calculation_method || '____'}`;
        
        return `${iLine}\n${dLine}\n${cLine}\n${totalLine} ${calcLine}`;
    },
},
{
    type: "custom",
    path: "facts.f16_collateral_agreement",
    title: "16. 是否签订物的担保（抵押、质押）合同",
    children: () => (
        <FormField
            path="facts.f16_collateral_agreement"
            label=""
            type="radio_detail"
            options={[{ value: 'yes', label: '是' }, { value: 'no', label: '否' }]}
            detailsLabel="签订时间"
            placeholder="请填写具体在什么时候签订什么合同"
        />
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f16_collateral_agreement") || {};
        const choice = data.choice;
        let yesLine = `是${choice === 'yes' ? '☑' : '☐'}`;
        if (choice === 'yes') {
            yesLine += ` 签订时间: ${data.details || '____'}`;
        }
        const noLine = `否${choice === 'no' ? '☑' : '☐'}`;
        return `${yesLine}\n${noLine}`;
    },
},
{
    type: "custom",
    path: "facts.f17_guarantor_item",
    title: "17. 担保人、担保物",
    children: () => (
        <div className="flex flex-col gap-y-3">
            <FormField path="facts.f17.guarantor" label="担保人" type="text" frontLabel="担保人" />
            <FormField path="facts.f17.collateral" label="担保物" type="text" frontLabel="担保物" />
        </div>
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f17") || {};
        return `担保人: ${data.guarantor || '____'}\n担保物: ${data.collateral || '____'}`;
    },
},
{
    type: "custom",
    path: "facts.f18_max_amount_guarantee",
    title: "18. 是否最高额担保（抵押、质押）",
    children: () => {
        const { watch } = useFormContext();
        const isYes = watch("facts.f18.choice") === "yes";
        return (
            <div className="flex flex-col gap-y-2">
                 <FormField
                    path="facts.f18.choice"
                    label=""
                    type="radio"
                    options={[{ value: 'yes', label: '是' }, { value: 'no', label: '否' }]}
                />
                {isYes && (
                    <div className="flex flex-col gap-y-3 mt-2">
                        <FormField path="facts.f18.determination_date" label="担保债权的确定时间" type="date" frontLabel="担保债权的确定时间" />
                        <FormField path="facts.f18.amount" label="担保额度" type="money" frontLabel="担保额度" />
                    </div>
                )}
            </div>
        );
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f18") || {};
        const choice = data.choice;
        let yesLine = `是${choice === 'yes' ? '☑' : '☐'}`;
        if (choice === 'yes') {
            const dateText = data.determination_date ? formatDateToChinese(data.determination_date) : '____';
            const amountText = data.amount ? `${data.amount}元 ${formatNumberToCN(data.amount)}` : '____元';
            yesLine += `\n担保债权的确定时间: ${dateText}\n担保额度: ${amountText}`;
        }
        const noLine = `否${choice === 'no' ? '☑' : '☐'}`;
        return `${yesLine}\n${noLine}`;
    },
},
{
    type: "custom",
    path: "facts.f19_registration",
    title: "19. 是否办理抵押、质押登记",
     children: () => {
        const { watch } = useFormContext();
        const isRegistered = watch("facts.f19.choice") === "yes";
        return (
            <div className="flex flex-col gap-y-2">
                 <FormField
                    path="facts.f19.choice"
                    label=""
                    type="radio"
                    options={[{ value: 'yes', label: '是' }, { value: 'no', label: '否' }]}
                />
                {isRegistered && (
                    <FormField
                        path="facts.f19.type"
                        label="登记类型"
                        type="radio"
                        options={[{ value: 'formal', label: '正式登记' }, { value: 'preliminary', label: '预告登记' }]}
                    />
                )}
            </div>
        );
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f19") || {};
        let yesLine = `是${data.choice === 'yes' ? '☑' : '☐'}`;
        if (data.choice === 'yes') {
            const type = data.type;
            const formal = type === 'formal' ? '☑' : '☐';
            const preliminary = type === 'preliminary' ? '☑' : '☐';
            yesLine += ` 正式登记${formal} 预告登记${preliminary}`;
        }
        const noLine = `否${data.choice === 'no' ? '☑' : '☐'}`;
        return `${yesLine}\n${noLine}`;
    },
},
{
    type: "custom",
    path: "facts.f20_guarantee_contract",
    title: "20. 是否签订保证合同",
    children: () => {
        const { watch } = useFormContext();
        const isYes = watch("facts.f20.choice") === "yes";
        return (
            <div className="flex flex-col gap-y-2">
                 <FormField
                    path="facts.f20.choice"
                    label=""
                    type="radio"
                    options={[{ value: 'yes', label: '是' }, { value: 'no', label: '否' }]}
                />
                {isYes && (
                    <div className="flex flex-col gap-y-3 mt-2">
                        <FormField path="facts.f20.signing_date" label="签订时间" type="date" frontLabel="签订时间"/>
                        <FormField path="facts.f20.guarantor" label="保证人" type="text" frontLabel="保证人" />
                        <FormField 
                            path="facts.f20.main_content" 
                            label="主要内容" 
                            type="optimizable-textarea"
                            rows={3}
                            placeholder="请填写保证合同的主要内容"
                        />
                    </div>
                )}
            </div>
        );
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f20") || {};
        const choice = data.choice;
        let yesLine = `是${choice === 'yes' ? '☑' : '☐'}`;
        if (choice === 'yes') {
            const dateText = data.signing_date ? `签订时间: ${formatDateToChinese(data.signing_date)}` : '签订时间: ____';
            const guarantorText = data.guarantor ? `保证人: ${data.guarantor}` : '保证人: ____';
            const contentText = data.main_content ? `主要内容: ${data.main_content}` : '主要内容: ____';
            yesLine += ` ${dateText} ${guarantorText} ${contentText}`;
        }
        const noLine = `否${choice === 'no' ? '☑' : '☐'}`;
        return `${yesLine}\n${noLine}`;
    },
},
{
    type: "custom",
    path: "facts.f21_guarantee_type",
    title: "21. 保证方式",
    children: () => (
         <FormField
            path="facts.f21_guarantee_type"
            label=""
            type="radio"
            options={[{ value: 'general', label: '一般保证' }, { value: 'joint', label: '连带责任保证' }]}
        />
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f21_guarantee_type");
        const general = data === 'general' ? '☑' : '☐';
        const joint = data === 'joint' ? '☑' : '☐';
        return `一般保证${general} 连带责任保证${joint}`;
    },
},
{
    type: "custom",
    path: "facts.f22_other_guarantee",
    title: "22. 其他担保方式",
    children: () => (
        <FormField
            path="facts.f22_other_guarantee"
            label=""
            type="radio_detail"
            options={[{ value: 'yes', label: '是' }, { value: 'no', label: '否' }]}
            detailsLabel="其他担保方式"
            placeholder="请填写具体方式的情况"
        />
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f22_other_guarantee") || {};
        const choice = data.choice;
        let yesLine = `是${choice === 'yes' ? '☑' : '☐'}`;
        if (choice === 'yes') {
            yesLine += ` 形式及签订时间: ${data.details || '____'}`;
        }
        const noLine = `否${choice === 'no' ? '☑' : '☐'}`;
        return `${yesLine}\n${noLine}`;
    },
},
    {
        type: "LegalAnalysisField",
        path: "facts.f23_legal_basis",
        title: "23. 请求承担责任的依据",
        placeholder: "合同约定：\n法律规定：",
        formDataProcessor: processFormDataForPreview,
    },
    {
        type: "textarea",
        path: "facts.f24_other_notes",
        title: "24. 其他需要说明的内容（可另附页）",
    },
    {
        type: "textarea",
        path: "facts.f25_evidence_list",
        title: "25. 证据清单（可另附页）",
    },
];

const ClaimsSection: React.FC = () => {
    return (
        <FormSectionCard title="诉讼请求">
            <div className="text-sm p-2 bg-base-200 rounded-md mb-4">
                <p className="font-semibold">填写说明：</p>
                <p>原告为卖方时，填写第1项、第2项；原告为买方时，填写第3项、第4项；第5项至第10项为共同项。</p>
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

export const SalesContractClaimFormPage: React.FC = () => {
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
            formId="claim_sales_contract"
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

export default SalesContractClaimFormPage;