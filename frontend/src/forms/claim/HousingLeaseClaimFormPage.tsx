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
  formatDateToChinese,
} from "../../utils/formatter";

import { AIChatbotPanel } from "../../components/AIChatbotPanel";
import { QuestionTable } from "../../components/claim/QuestionTable";
import type { QuestionConfig } from "../../components/claim/QuestionTable";
import { getValueFromPath } from "../../utils/formatter";
import FormField from "../../components/claim/FormField";
import { OptimizableTextarea } from "../../components/OptimizableTextarea";
import { JurisdictionAndPreservationForm, formatJurisdictionAndPreservationForDocx } from "../../components/claim/JurisdictionAndPreservationForm";

// 定义案件类型
const CASE_TYPE = "房屋租赁合同纠纷";

// --- 数据处理与格式化 ---
const processFormDataForPreview = (data: any) => {
  const partyBlueprint_plaintiffs = [
    { path: "plaintiffs_natural", roleText: "原告\n(自然人)", type: "natural" as const },
    { path: "plaintiffs_legal", roleText: "原告\n(法人、非法人组织)", type: "legal" as const },
  ];
   const partyBlueprint_others = [
    { path: "defendants_natural", roleText: "被告\n(自然人)", type: "natural" as const },
    { path: "defendants_legal", roleText: "被告\n(法人、非法人组织)", type: "legal" as const },
    { path: "third_parties_natural", roleText: "第三人\n(自然人)", type: "natural" as const },
    { path: "third_parties_legal", roleText: "第三人\n(法人、非法人组织)", type: "legal" as const },
  ];

  return {
    case_type: data.basicInfo?.caseCause,
    case_number: data.basicInfo?.caseNumber || `起诉状-${Date.now()}`,
    partyInfo: [
      ...formatPartiesForDocx(data, partyBlueprint_plaintiffs),
      ...formatAgentsForDocx(data),
      ...formatPartiesForDocx(data, partyBlueprint_others),
    ],
    // 关键：不在此处过滤，而是格式化所有定义的条目，以确保文档结构的完整性。
    claimItems: formatFormData('claim', data, claimsConfig),
    jurisdictionAndPreservation: formatJurisdictionAndPreservationForDocx(data),
    factItems: formatFormData('facts', data, factsConfig),
    mediationInfo: formatMediationForDocx(data),
  };
};

// --- 诉讼请求配置 ---
// 使用 plaintiffRole 属性来控制UI中的可见性
const claimsConfig: (QuestionConfig & { plaintiffRole?: ('landlord' | 'tenant' | 'both')[] })[] = [
  {
     type: "custom",
    path: "claims.c1_pay_rent",
    title: "1. 支付租金 (元)",
    plaintiffRole: ['landlord'],
    children: () => {
        const { control, watch, register } = useFormContext();
        const currencyType = watch("claims.c1.currency");

        return (
            <div className="space-y-3">
                <FormField 
                    path="claims.c1.amount" 
                    label="到期未付租金" 
                    type="money" 
                    frontLabel="到期未付租金"
                />
                
                {/* Currency Selection Logic */}
                <div>
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
                
                <FormField 
                    path="claims.c1.details" 
                    label="明细" 
                    type="optimizable-textarea" 
                />
            </div>
        );
    },
    formatter: (data) => {
        const d = getValueFromPath(data, 'claims.c1') || {};
        const amountText = d.amount ? `到期未付租金 ${formatMoneyWithCN(d.amount)}` : "到期未付租金____元";
        
        let currencyText = "";
        if (d.currency === "RMB") {
            currencyText = "(人民币, 下同)";
        } else if (d.currency === "other") {
            currencyText = d.currencyName
                ? `(外币: ${d.currencyName})`
                : "(外币, 需特别注明)";
        } else {
             currencyText = "(人民币, 下同; 如外币需特别注明)";
        }

        return `${amountText} ${currencyText}\n明细: ${d.details || '____'}`;
    }
  },
  {
    type: "custom",
    path: "claims.c2_late_interest",
    title: "2. 迟延支付租金的利息(违约金)",
    plaintiffRole: ['landlord'],
    children: () => (
        <div className="space-y-3">
            <FormField path="claims.c2.end_date" type="date" frontLabel="截至"/>
            <FormField path="claims.c2.interest_amount" type="money" endLabel="元" frontLabel="迟延支付租金利息" />
            <FormField path="claims.c2.penalty_amount" type="money" endLabel="元" frontLabel="违约金" />
            <FormField path="claims.c2.count_date" type="date" frontLabel="自此日期起" />
            <FormField path="claims.c2.base_amount" type="money" endLabel="元" frontLabel="按基数" />
            <FormField path="claims.c2.standard" type="text" placeholder="如一年期LPR" frontLabel="按" endLabel="标准计算" />
            <FormField path="claims.c2.interest_method" type="optimizable-textarea" label="具体计算方式" placeholder="具体列明利息、违约金的计算方式" optimizationContext="原告对迟延支付租金的利息（违约金）计算方式的说明"/>
            <FormField path="claims.c2.request_until_paid" label="是否请求支付至实际清偿之日止" type="radio" options={[{value:'yes',label:'是'},{value:'no',label:'否'}]} />
            <FormField path="claims.c2.details" label="明细" type="optimizable-textarea" />
        </div>
    ),
    formatter: (data) => {
        const d = getValueFromPath(data, 'claims.c2') || {};
        return `截至 ${formatDateToChinese(d.end_date) || '____'} 止, 迟延支付租金的利息 ${formatMoneyWithCN(d.interest_amount)}、违约金${formatMoneyWithCN(d.penalty_amount)}, 自之后的逾期利息、违约金, 以 ${formatMoneyWithCN(d.base_amount)}为基数按 ${d.standard || '____'} 标准计算;\n` +
               `计算方式: 是否请求支付至实际清偿之日止: ${generateSelectionText(['是', '否'], d.request_until_paid)}\n` +
               `明细: ${d.details || '____'}`;
    }
  },
  {
    type: "custom",
    path: "claims.c3_deliver_property",
    title: "3. 交付房屋",
    plaintiffRole: ['tenant'],
    children: () => {
        const { watch } = useFormContext();
        return <div className="space-y-2">
            <FormField path="claims.c3.request" type="radio" options={[{value:'yes',label:'是'},{value:'no',label:'否'}]} />
            {watch('claims.c3.request') === 'yes' && <FormField path="claims.c3.details" label="明细" type="optimizable-textarea" />}
        </div>
    },
    formatter: (data) => {
        const d = getValueFromPath(data, 'claims.c3') || {};
        const radio = generateSelectionText(['是', '否'], d.request);
        const details = d.request === 'yes' ? `\n明细: ${d.details || '____'}` : `\n明细:`;
        return `${radio}${details}`;
    }
  },
  {
    type: "custom",
    path: "claims.c4_terminate_contract",
    title: "4. 请求解除合同",
    plaintiffRole: ['both'],
    children: () => {
        const { watch } = useFormContext();
        return <div className="space-y-2">
            <FormField path="claims.c4.request" type="radio" options={[{value:'yes',label:'是'},{value:'no',label:'否'}]} />
            {watch('claims.c4.request') === 'yes' && <FormField path="claims.c4.termination_date" type="date" frontLabel="确认合同于" endLabel="解除"/>}
        </div>
    },
    formatter: (data) => {
        const d = getValueFromPath(data, 'claims.c4') || {};
        const radio = generateSelectionText(['是', '否'], d.request);
        const date = d.request === 'yes' ? ` 确认合同于 ${formatDateToChinese(d.termination_date) || '____'} 解除` : ` 确认合同于 年 月 日解除`;
        return `${radio}${date}`;
    }
  },
  {
    type: "custom",
    path: "claims.c5_return_and_compensate",
    title: "5. 返还租赁物，并赔偿因解除合同而受到的损失",
    plaintiffRole: ['landlord'],
    children: () => {
        const { watch } = useFormContext();
        return <div className="space-y-2">
            <FormField path="claims.c5.request" type="radio" options={[{value:'yes',label:'是'},{value:'no',label:'否'}]} />
            {watch('claims.c5.request') === 'yes' && <FormField path="claims.c5.details" label="内容" type="optimizable-textarea" />}
        </div>
    },
    formatter: (data) => {
        const d = getValueFromPath(data, 'claims.c5') || {};
        const radio = generateSelectionText(['是', '否'], d.request);
        const details = `\n内容: ${d.details || '____'}`;
        return `${radio}${details}`;
    }
  },
  {
    type: "custom",
    path: "claims.c6_pay_occupancy_fee",
    title: "6. 支付房屋占有使用费",
    plaintiffRole: ['landlord'],
    children: () => {
        const { watch } = useFormContext();
        return <div className="space-y-2">
            <FormField path="claims.c6.request" type="radio" options={[{value:'yes',label:'是'},{value:'no',label:'否'}]} />
            {watch('claims.c6.request') === 'yes' && <FormField path="claims.c6.details" label="内容" type="optimizable-textarea" />}
        </div>
    },
    formatter: (data) => {
        const d = getValueFromPath(data, 'claims.c6') || {};
        return `${generateSelectionText(['是','否'], d.request)}\n内容: ${d.details || '____'}`;
    }
  },
   {
    type: "custom",
    path: "claims.c7_pay_utilities",
    title: "7. 支付水电费等费用",
    plaintiffRole: ['landlord'],
    children: () => {
        const { watch } = useFormContext();
        return <div className="space-y-2">
            <FormField path="claims.c7.request" type="radio" options={[{value:'yes',label:'是'},{value:'no',label:'否'}]} />
            {watch('claims.c7.request') === 'yes' && <FormField path="claims.c7.details" label="内容" type="optimizable-textarea" />}
        </div>
    },
    formatter: (data) => {
        const d = getValueFromPath(data, 'claims.c7') || {};
        return `${generateSelectionText(['是','否'], d.request)}\n内容: ${d.details || '____'}`;
    }
  },
   {
    type: "custom",
    path: "claims.c8_return_deposit",
    title: "8. 返还押金",
    plaintiffRole: ['tenant'],
    children: () => {
        const { watch } = useFormContext();
        return <div className="space-y-2">
            <FormField path="claims.c8.request" type="radio" options={[{value:'yes',label:'是'},{value:'no',label:'否'}]} />
            {watch('claims.c8.request') === 'yes' && <FormField path="claims.c8.amount" label="金额" type="money" frontLabel="金额" />}
        </div>
    },
    formatter: (data) => {
        const d = getValueFromPath(data, 'claims.c8') || {};
        return `${generateSelectionText(['是','否'], d.request)}\n金额: ${formatMoneyWithCN(d.amount)}`;
    }
  },
  {
    type: "custom",
    path: "claims.c9_realization_costs",
    title: "9. 是否主张实现债权的费用",
    plaintiffRole: ['both'],
    children: () => {
        const { watch } = useFormContext();
        return <div className="space-y-2">
            <FormField path="claims.c9.request" type="radio" options={[{value:'yes',label:'是'},{value:'no',label:'否'}]} />
            {watch('claims.c9.request') === 'yes' && <FormField path="claims.c9.details" label="内容" type="optimizable-textarea" />}
        </div>
    },
     formatter: (data) => {
        const d = getValueFromPath(data, 'claims.c9') || {};
        return `${generateSelectionText(['是','否'], d.request)}\n内容: ${d.details || '____'}`;
    }
  },
  {
    type: "radio",
    path: "claims.c10_litigation_costs",
    title: "10. 是否主张诉讼费用",
    plaintiffRole: ['both'],
    options: [{value:'yes',label:'是'},{value:'no',label:'否'}]
  },
  {
    type: "optimizationContext",
    path: "claims.c11_other_requests",
    title: "11. 其他请求",
    plaintiffRole: ['both'],
    optimizationContext:"原告对房屋租赁纠纷案中的其他请求的描述"
  },
  {
    type: "optimizationContext",
    path: "claims.c12_total_amount",
    title: "12. 标的总额",
    optimizationContext:"原告对房屋租赁纠纷案中的标的总额描述",
    plaintiffRole: ['both'],
  },
];


// --- 事实与理由配置 ---
const factsConfig: QuestionConfig[] = [
  { type: "optimizationContext", path: "facts.f1_contract_signing", title: "1. 合同的签订情况(名称、编号、签订时间、地点等)", optimizationContext: "原告对房屋租赁纠纷案中的合同签订情况的描述" },
  { 
    type: "custom", 
    path: "facts.f2_parties",
    title: "2. 签订主体",
    children: () => (
      <div className="space-y-2">
        <FormField path="facts.f2.landlord" label="出租人" type="text" frontLabel="出租人:"/>
        <FormField path="facts.f2.tenant" label="承租人" type="text" frontLabel="承租人:"/>
      </div>
    ),
    formatter: d => `出租人: ${getValueFromPath(d, 'facts.f2.landlord') || '____'}\n承租人: ${getValueFromPath(d, 'facts.f2.tenant') || '____'}`
  },
  { type: "textarea", path: "facts.f3_property_details", title: "3. 租赁标的物情况(坐落位置、面积、产权情况等)" },
  { 
    type: "custom", 
    path: "facts.f4_lease_term",
    title: "4. 合同约定的租赁期限",
    children: () => <div className="flex flex-col space-y-2"><FormField path="facts.f4.start_date" type="date" frontLabel="起始日"/> <FormField path="facts.f4.end_date" type="date" frontLabel="到期日"/> </div>,
    formatter: d => `自 ${formatDateToChinese(getValueFromPath(d, 'facts.f4.start_date')) || '____'} 起至 ${formatDateToChinese(getValueFromPath(d, 'facts.f4.end_date')) || '____'} 止`
  },
   {
    type: "custom",
    path: "facts.f5_rent_payment",
    title: "5. 合同约定的租金及支付方式",
    children: () => {
        const { watch } = useFormContext();
        // 监控支付方式复选框
        const paymentMethods = watch("facts.f5.payment_method") || [];
        // 监控支付周期单选按钮
        const paymentSchedule = watch("facts.f5.payment_schedule");

        return (
            <div className="flex flex-col gap-y-3">
                {/* 租金部分 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <FormField path="facts.f5.rent_per_month" label="租金" type="money" frontLabel="租金" endLabel="元/月"/>
                    <FormField path="facts.f5.total_rent" label="总价" type="money" frontLabel="总价" endLabel="元"/>
                </div>
                
                {/* 支付方式部分 */}
                <FormField 
                    path="facts.f5.payment_method" 
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
                            path="facts.f5.bill_type"
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
                            path="facts.f5.other_method_details"
                            label=""
                            type="text"
                            placeholder="请说明其他支付方式"
                            frontLabel="其他方式:"
                        />
                    </div>
                )}

                {/* 支付周期部分 */}
                <FormField 
                    path="facts.f5.payment_schedule" 
                    label="支付周期" 
                    type="radio" 
                    options={[
                        { value: "onetime", label: "一次性" }, 
                        { value: "installment", label: "分期" }
                    ]} 
                />

                {/* 条件渲染: 如果选择了 "分期" */}
                {paymentSchedule === 'installment' && (
                    <div className="">
                        <FormField
                            path="facts.f5.installment_details"
                            label="分期方式"
                            type="optimizable-textarea"
                            rows={2}
                            placeholder="请说明具体分期方式, 如：分三期，首期支付50%..."
                        />
                    </div>
                )}
            </div>
        );
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f5") || {};
        
        // 1. 租金行
        const rentText = `租金: ${formatMoneyWithCN(data.rent_per_month) || '____'}元/月; 总价: ${formatMoneyWithCN(data.total_rent) || '____'}元`;

        // 2. 支付方式行
        const methods = data.payment_method || [];
        const paymentOptions = {
            cash: `以现金${methods.includes('cash') ? '☑' : '☐'}`,
            transfer: `转账${methods.includes('transfer') ? '☑' : '☐'}`,
            bill: `票据${methods.includes('bill') ? '☑' : '☐'}${methods.includes('bill') ? `(${data.bill_type || '写明票据类型'})` : ''}`,
            other: `其他${methods.includes('other') ? '☑' : '☐'}`
        };
        let methodText = `支付方式: ${Object.values(paymentOptions).join(' ')}`;
        if (methods.includes('other') && data.other_method_details) {
            methodText += `：${data.other_method_details}`;
        }
        
        // 3. 支付周期行
        const schedule = data.payment_schedule;
        const scheduleOptions = {
            onetime: `一次性${schedule === 'onetime' ? '☑' : '☐'}`,
            installment: `分期${schedule === 'installment' ? '☑' : '☐'}`
        };
        let scheduleText = `支付周期: ${Object.values(scheduleOptions).join(' ')}`;
        if (schedule === 'installment' && data.installment_details) {
            scheduleText += `\n分期方式：${data.installment_details || '____'}`;
        }

        return `${rentText}\n${methodText}\n${scheduleText}`;
    }
  },
    {
    type: "custom",
    path: "facts.f6_other_fees",
    title: "6. 其他费用约定(物业费、水电燃气费用等)",
    children: () => (
      <div className="space-y-3">
        <FormField
          path="facts.f6.landlord_share"
          label="出租人负担"
          type="optimizable-textarea"
          placeholder="例如：房屋主体维修费用..."
          rows={2}
        />
        <FormField
          path="facts.f6.tenant_share"
          label="承租人负担"
          type="optimizable-textarea"
          placeholder="例如：物业费、水电费、燃气费..."
          rows={2}
        />
      </div>
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, 'facts.f6') || {};
        const landlordText = `出租人负担: ${data.landlord_share || '____'}`;
        const tenantText = `承租人负担: ${data.tenant_share || '____'}`;
        return `${landlordText}\n${tenantText}`;
    }
  },
  { type: "optimizationContext", path: "facts.f7_liability_clause", title: "7. 合同约定的违约责任", optimizationContext:"原告对合同约定的违约责任的详细说明"},
  {
    type: "custom",
    path: "facts.f8_termination_conditions",
    title: "8. 是否约定合同解除的条件",
    children: () => {
        const { watch } = useFormContext();
        return <div className="space-y-2">
            <FormField path="facts.f8.agreed" type="radio" options={[{value:'yes',label:'是'},{value:'no',label:'否'}]} />
            {watch('facts.f8.agreed') === 'yes' && <FormField path="facts.f8.details" label="具体内容" type="optimizable-textarea" />}
        </div>
    },
    formatter: (data) => {
        const d = getValueFromPath(data, 'facts.f8') || {};
        return `${generateSelectionText(['是','否'], d.agreed)}\n具体内容: ${d.details || '____'}`;
    }
  },
  {  type: "custom",
    path: "facts.f9_delivery_date",
    title: "9. 租赁物交付时间",
    children: () => (
      <div className="flex items-center gap-2">
        <FormField path="facts.f9.date" type="date" frontLabel="交付日期"/>
      </div>
    ),
    formatter: (data) => {
      const d = getValueFromPath(data, 'facts.f9') || {};
      const dateStr = d.date ? formatDateToChinese(d.date) : '____年____月____日';
      return `于 ${dateStr} 交付租赁物`;
    } },
  {
    type: "custom",
    path: "facts.f10_deposit_agreement",
    title: "10. 押金约定情况",
    children: () => {
        const { watch } = useFormContext();
        return <div className="space-y-2">
            <FormField path="facts.f10.agreed" type="radio" options={[{value:'yes',label:'有'},{value:'no',label:'无'}]} />
            {watch('facts.f10.agreed') === 'yes' && <div className="flex flex-col space-y-2"><FormField path="facts.f10.amount" type="money" frontLabel="押金数额"/><FormField path="facts.f10.payment_date" type="date" frontLabel="支付日期"/></div>}
        </div>
    },
    formatter: d => {
        const data = getValueFromPath(d, 'facts.f10') || {};
        const radio = generateSelectionText(['有', '无'], data.agreed);
        const details = data.agreed === 'yes' ? ` 押金数额: ${formatMoneyWithCN(data.amount)}, ${formatDateToChinese(data.payment_date) || '____'} 已支付押金。` : ``;
        return `${radio}${details}`;
    }
  },
    {
    type: "custom",
    path: "facts.f11_rent_payment_status",
    title: "11. 租金支付情况",
    children: () => (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <FormField path="facts.f11.start_date" type="date" frontLabel="租金正常支付起始日期"/>
            <FormField path="facts.f11.end_date" type="date" frontLabel="租金正常支付结束日期"/>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
             <FormField path="facts.f11.paid_on_time_amount" type="money" frontLabel="已付租金" endLabel="元"/>
             <FormField path="facts.f11.paid_late_amount" type="money" frontLabel="逾期但已付租金" endLabel="元"/>
        </div>
        <FormField path="facts.f11.details" label="明细" type="optimizable-textarea" rows={2}/>
      </div>
    ),
    formatter: (formData) => {
        const d = getValueFromPath(formData, 'facts.f11') || {};
        const startDate = formatDateToChinese(d.start_date) || '____年____月____日';
        const endDate = formatDateToChinese(d.end_date) || '____年____月____日';
        const onTimeAmount = formatMoneyWithCN(d.paid_on_time_amount);
        const lateAmount = formatMoneyWithCN(d.paid_late_amount);

        return `自 ${startDate} 至 ${endDate}, 按约定交纳租金, 已付租金 ${onTimeAmount} 元, 逾期但已付租金 ${lateAmount} 元\n` +
               `明细: ${d.details || '____'}`;
    }
  },
  {
    type: "custom",
    path: "facts.f12_overdue_rent_status",
    title: "12. 逾期未付租金情况",
    children: () => (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <FormField path="facts.f12.start_date" type="date" frontLabel="欠付租金起始日期"/>
        <FormField path="facts.f12.end_date" type="date" frontLabel="欠付租金计算截至"/>
        <FormField path="facts.f12.overdue_amount" type="money" frontLabel="合计欠付租金" endLabel="元"/>
      </div>
    ),
    formatter: (formData) => {
        const d = getValueFromPath(formData, 'facts.f12') || {};
        const startDate = formatDateToChinese(d.start_date) || '____年____月____日';
        const endDate = formatDateToChinese(d.end_date) || '____年____月____日';
        const overdueAmount = formatMoneyWithCN(d.overdue_amount);

        return `自 ${startDate} 日起开始欠付租金, 截至 ${endDate}, 欠付租金 ${overdueAmount} 元`;
    }
  },
  { type: "optimizationContext", path: "facts.f13_other_notes", title: "13. 其他需要说明的内容(可另附页)" },
  {
    type: "LegalAnalysisField",
    path: "facts.f14_claim_basis",
    title: "14. 请求依据",
    formDataProcessor: processFormDataForPreview,
    withContractAnalysis: true,
  },
  { type: "textarea", path: "facts.f15_evidence_list", title: "15. 证据清单(可另附页)" },
];

// --- Sections and Main Page Component ---
const ClaimsSection: React.FC = () => {
    const { watch } = useFormContext();
    // 监视原告身份的 radio 按钮
    const plaintiffRole = watch('claims.plaintiff_role');

    const roleMap: Record<string, ('landlord' | 'tenant' | 'both')[]> = {
        landlord: ['landlord', 'both'],
        tenant: ['tenant', 'both'],
    };

    return (
        <FormSectionCard title="诉讼请求">
            <OptimizableTextarea path="claims.fullStatement" label="完整陈述" placeholder="可在此处完整表述您的诉讼请求..."/>
            
            <div className="my-4 p-4 border rounded-md bg-base-200">
                <label className="label font-semibold">请选择您的身份 (原告):</label>
                <FormField path="claims.plaintiff_role" type="radio" options={[
                    {value: 'landlord', label: '出租方 (请填写第1、2、5、6、7项)'},
                    {value: 'tenant', label: '承租方 (请填写第3、8项)'}
                ]} />
                <p className="text-sm mt-2">说明：第4项、第9项至第12项为共同项，无论选择哪个身份均需根据情况填写。</p>
            </div>

            <p className="text-sm my-2">为方便、准确梳理要点，请根据您的身份在下方要素式表格中填写：</p>
            
            {/* 根据 plaintiffRole 的值动态渲染UI */}
            {plaintiffRole && <QuestionTable config={
                claimsConfig.filter(c => {
                    const allowedRoles = roleMap[plaintiffRole];
                    // 如果配置项没有plaintiffRole, 或其角色数组中包含当前选中的角色，则显示
                    return !c.plaintiffRole || c.plaintiffRole.some(role => allowedRoles.includes(role));
                })
            } />}

        </FormSectionCard>
    );
};


const FactsAndReasonsSection: React.FC = () => (
    <FormSectionCard title="事实与理由">
        <OptimizableTextarea path="facts.fullStatement" label="完整陈述" placeholder="可在此处完整表述纠纷涉及的事实与理由..."/>
        <p className="text-sm my-2">为方便、准确梳理要点，相关内容请在下方要素式表格中填写：</p>
        <QuestionTable config={factsConfig} />
    </FormSectionCard>
);

export const HousingLeaseClaimFormPage: React.FC = () => {
    const title = `民事起诉状 (${CASE_TYPE})`;

    const handleFormSubmit = async (data: any) => {
        const final = processFormDataForPreview(data);
        console.log("最终提交的起诉状Payload:", JSON.stringify(final, null, 2));
    };

    const rightSide = <AIChatbotPanel />;

    return (
        <FormPageLayout
            title={title}
            formId="claim_house_rental_dispute"
            onSubmit={handleFormSubmit}
            onPreviewData={processFormDataForPreview}
            rightPanel={rightSide}
            docType="起诉状"
            fixedFormValues={{ basicInfo: { caseCause: CASE_TYPE } }}
        >
            <BasicInfoSection case_type={CASE_TYPE} />
            <FormSectionCard title="原告">
                <PartyList path="plaintiffs_natural" title="自然人" partyType="natural"/>
                <div className="divider my-4"></div>
                <PartyList path="plaintiffs_legal" title="法人/非法人组织" partyType="legal"/>
            </FormSectionCard>
            <AgentList path="agents" />
            <FormSectionCard title="被告">
                <PartyList path="defendants_natural" title="自然人" partyType="natural"/>
                <div className="divider my-4"></div>
                <PartyList path="defendants_legal" title="法人/非法人组织" partyType="legal"/>
            </FormSectionCard>
            <FormSectionCard title="第三人">
                <PartyList path="third_parties_natural" title="自然人" partyType="natural"/>
                <div className="divider my-4"></div>
                <PartyList path="third_parties_legal" title="法人/非法人组织" partyType="legal"/>
            </FormSectionCard>

            <ClaimsSection />
            <FormSectionCard title="约定管辖和诉前保全">
                <JurisdictionAndPreservationForm path="jurisdictionAndPreservation"/>
            </FormSectionCard>
            <FactsAndReasonsSection />
            <FormSectionCard title="对纠纷解决方式的意愿">
                <MediationForm path="mediation" />
            </FormSectionCard>
        </FormPageLayout>
    );
};

export default HousingLeaseClaimFormPage;