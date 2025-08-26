/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { useFormContext } from "react-hook-form";
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
import { QuestionTable } from "../../components/claim/QuestionTable";
import type { QuestionConfig } from "../../components/claim/QuestionTable";
import { getValueFromPath, formatDateToChinese } from "../../utils/formatter";
import FormField from "../../components/claim/FormField";
import { OptimizableTextarea } from "../../components/OptimizableTextarea";
import { JurisdictionAndPreservationForm, formatJurisdictionAndPreservationForDocx } from "../../components/claim/JurisdictionAndPreservationForm";

// 定义案件类型
const CASE_TYPE = "房屋买卖合同纠纷";

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
    claimItems: formatFormData('claim', data, claimsConfig),
    jurisdictionAndPreservation: formatJurisdictionAndPreservationForDocx(data),
    factItems: formatFormData('facts', data, factsConfig),
    mediationInfo: formatMediationForDocx(data),
  };
};

// --- 诉讼请求配置 ---
const claimsConfig: QuestionConfig[] = [
   {
    type: "custom",
    path: "claims.c1_contract_status",
    title: "1. 确定房屋买卖合同关系",
    children: () => {
        const { watch } = useFormContext();
        const hasIssue = watch("claims.c1.hasIssue");
        return (
            <div>
                <FormField path="claims.c1.hasIssue" type="radio" options={[{value: 'yes', label: '有此问题'}, {value: 'no', label: '无此问题'}]} />
                {hasIssue === 'yes' && (
                    <div className="mt-4 space-y-4">
                        <FormField 
                            path="claims.c1.main_claim" 
                            label=""
                            type="radio"
                            options={[
                                { value: "confirm_invalid", label: "主张确认合同无效" },
                                { value: "confirm_not_established", label: "主张确认合同未成立" },
                                { value: "request_rescission", label: "主张解除" },
                                { value: "request_cancellation", label: "主张撤销" },
                                { value: "request_continue", label: "主张继续履行" },
                                { value: "request_formal_contract", label: "主张订立正式房屋买卖合同" },
                            ]}
                        />
                        <FormField 
                            path="claims.c1.specific_claim" 
                            label="具体主张（例: 请求法院依法确认原、被告签订的《XX合同》自X年X月X日起无效。）" 
                            type="optimizable-textarea" 
                            placeholder="（例：确认合同无效/ 继续履行/ 解除合同/ 撤销合同/ 否定某约定合同效力/ 要求订立本约）"
                        />
                    </div>
                )}
            </div>
        );
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "claims.c1") || {};
        const radioText = generateSelectionText(['无此问题', '有此问题'], data.hasIssue === 'yes' ? '有此问题' : '无此问题');
        if (data.hasIssue === 'yes') {
            const mainClaimOptions = {
                confirm_invalid: "主张确认合同无效",
                confirm_not_established: "主张确认合同未成立",
                request_rescission: "主张解除",
                request_cancellation: "主张撤销",
                request_continue: "主张继续履行",
                request_formal_contract: "主张订立正式房屋买卖合同",
            };

            // 使用 generateSelectionText 来格式化单选按钮组
            const claimsText = generateSelectionText(Object.values(mainClaimOptions), mainClaimOptions[data.main_claim], '\n');

            const specific = `具体主张: ${data.specific_claim || '____'}`;
            return `${radioText}\n${claimsText}\n${specific}`;
        }
        return radioText;
    }
  },
  {
    type: "custom",
    path: "claims.c2_payment",
    title: "2. 支付或返还购房款",
    children: () => {
        const { watch } = useFormContext();
        const hasIssue = watch("claims.c2.hasIssue");
        return (
             <div>
                <FormField path="claims.c2.hasIssue" type="radio" options={[{value: 'yes', label: '有此问题'}, {value: 'no', label: '无此问题'}]} />
                {hasIssue === 'yes' && (
                    <div className="mt-4 space-y-4 ">
                        {/* 第一组：返还款项或支付欠款 */}
                        <div className="space-y-2">
                             <label className="label-text font-medium">款项主张:</label>
                             <FormField 
                                path="claims.c2.payment_claim" 
                                type="radio"
                                options={[
                                    { value: "return_down_payment", label: "返还首付款" },
                                    { value: "return_deposit", label: "返还定金" },
                                    { value: "return_paid", label: "返还已付款" },
                                    { value: "pay_outstanding", label: "支付欠付房款" },
                                ]}
                             />
                        </div>

                        {/* 第二组：违约金或利息 */}
                        <div className="space-y-2">
                            <label className="label-text font-medium">违约责任主张:</label>
                            <FormField
                                path="claims.c2.penalty_claim"
                                type="radio"
                                options={[
                                    { value: "pay_liquidated_damages", label: "支付违约金" },
                                    { value: "pay_interest", label: "支付利息" },
                                ]}
                            />
                        </div>

                        {/* 第三组：赔偿损失 */}
                         <div className="space-y-2">
                             <label className="label-text font-medium">其他损失主张:</label>
                            <FormField path="claims.c2.claim_compensation" label="主张赔偿损失" type="checkbox"/>
                        </div>

                        {/* 金额及明细 */}
                        <FormField path="claims.c2.amount_details" label="金额及明细" type="optimizable-textarea"/>
                    </div>
                )}
            </div>
        );
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "claims.c2") || {};
        const radioText = generateSelectionText(['无此问题', '有此问题'], data.hasIssue === 'yes' ? '有此问题' : '无此问题');
        
        if (data.hasIssue === 'yes') {
            const returnOptions = {
                return_down_payment: "主张返还首付款",
                return_deposit: "定金",
                return_paid: "已付款",
            };

            const payOutstandingOption = {
                pay_outstanding: "主张支付欠付房款",
            };

            const penaltyOptions = {
                pay_liquidated_damages: "主张支付违约金",
                pay_interest: "或利息",
            };

            // 1. 生成“返还类”主张的文本
            const returnClaimText = generateSelectionText(Object.values(returnOptions), returnOptions[data.payment_claim], ' / ');
            
            // 2. 生成“支付欠付房款”的文本
            const payOutstandingText = generateSelectionText(Object.values(payOutstandingOption), payOutstandingOption[data.payment_claim]);

            // 3. 生成其他主张的文本
            const penaltyClaimText = generateSelectionText(Object.values(penaltyOptions), penaltyOptions[data.penalty_claim], ' ');
            const compensationText = `主张赔偿损失${data.claim_compensation ? '☑' : '☐'}`;
            const details = `金额及明细: ${data.amount_details || '____'}`;
            
            // 4. 将它们用换行符拼接起来
            return `${radioText}\n具体主张: ${returnClaimText}\n${payOutstandingText}\n${penaltyClaimText}\n${compensationText}\n${details}`;
        }
        
        return radioText;
    }
  },
  {
    type: "custom",
    path: "claims.c3_house_delivery",
    title: "3. 交付或返还房屋",
    children: () => {
        const { watch } = useFormContext();
        const hasIssue = watch("claims.c3.hasIssue");
        return (
            <div>
                <FormField path="claims.c3.hasIssue" type="radio" options={[{value: 'yes', label: '有此问题'}, {value: 'no', label: '无此问题'}]} />
                {hasIssue === 'yes' && <div className="mt-4 space-y-3 ">
                    <FormField path="claims.c3.request_delivery" label="主张交付房屋" type="radio" options={[{value: 'yes', label: '是'}, {value: 'no', label: '否'}]} />
                    <FormField path="claims.c3.request_return" label="主张返还房屋" type="radio" options={[{value: 'yes', label: '是'}, {value: 'no', label: '否'}]} />
                    <FormField path="claims.c3.late_delivery_penalty" label="主张支付逾期交房违约金" type="radio" options={[{value: 'yes', label: '是'}, {value: 'no', label: '否'}]} />
                </div>}
            </div>
        );
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "claims.c3") || {};
        const radioText = generateSelectionText(['无此问题', '有此问题'], data.hasIssue === 'yes' ? '有此问题' : '无此问题');
         if (data.hasIssue === 'yes') {
             const delivery = `主张交付房屋: ${generateSelectionText(['是', '否'], data.request_delivery,"/")}`;
             const returnH = `主张返还房屋: ${generateSelectionText(['是', '否'], data.request_return,"/")}`;
             const penalty = `主张支付逾期交房违约金: ${generateSelectionText(['是', '否'], data.late_delivery_penalty,"/")}`;
             return `${radioText}\n${delivery}\n${returnH}\n${penalty}`;
         }
         return radioText;
    }
  },
  {
    type: "custom",
    path: "claims.c4_registration",
    title: "4. 办理房屋登记手续",
    children: () => {
        const { watch } = useFormContext();
        const hasIssue = watch("claims.c4.hasIssue");
        return (
            <div>
                <FormField path="claims.c4.hasIssue" type="radio" options={[{value: 'yes', label: '有此问题'}, {value: 'no', label: '无此问题'}]} />
                {hasIssue === 'yes' && <div className="mt-4 space-y-3 ">
                    <FormField path="claims.c4.assist_registration" label="主张协助办理不动产登记" type="radio" options={[{value: 'yes', label: '是'}, {value: 'no', label: '否'}]} />
                    <FormField path="claims.c4.late_registration_penalty" label="主张支付逾期办证违约金" type="radio" options={[{value: 'yes', label: '是'}, {value: 'no', label: '否'}]} />
                </div>}
            </div>
        )
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "claims.c4") || {};
        const radioText = generateSelectionText(['无此问题', '有此问题'], data.hasIssue === 'yes' ? '有此问题' : '无此问题');
        if (data.hasIssue === 'yes') {
            const assist = `主张协助办理不动产登记: ${generateSelectionText(['是','否'], data.assist_registration,"/")}`;
            const penalty = `主张支付逾期办证违约金: ${generateSelectionText(['是','否'], data.late_registration_penalty,"/")}`;
            return `${radioText}\n${assist}\n${penalty}`;
        }
        return radioText;
    }
  },
  {
    type: "custom",
    path: "claims.c5_agency_fee",
    title: "5. 返还或承担中介服务费",
    children: () => {
        const { watch } = useFormContext();
        const hasIssue = watch("claims.c5.hasIssue");
        return (
            <div>
                <FormField path="claims.c5.hasIssue" type="radio" options={[{value: 'yes', label: '有此问题'}, {value: 'no', label: '无此问题'}]} />
                {hasIssue === 'yes' && <div className="mt-4 space-y-3 ">
                    <FormField path="claims.c5.return_fee" label="主张返还中介服务费" type="radio" options={[{value: 'yes', label: '是'}, {value: 'no', label: '否'}]} />
                    <FormField path="claims.c5.defendant_bears_fee" label="主张被告承担中介服务费" type="radio" options={[{value: 'yes', label: '是'}, {value: 'no', label: '否'}]} />
                    <FormField path="claims.c5.amount_details" label="金额及明细" type="optimizable-textarea" />
                </div>}
            </div>
        )
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "claims.c5") || {};
        const radioText = generateSelectionText(['无此问题', '有此问题'], data.hasIssue === 'yes' ? '有此问题' : '无此问题');
        if (data.hasIssue === 'yes') {
            const returnFee = `主张返还中介服务费: ${generateSelectionText(['是','否'], data.return_fee,"/")}`;
            const bearFee = `主张被告承担中介服务费: ${generateSelectionText(['是','否'], data.defendant_bears_fee,"/")}`;
            const details = `金额及明细: ${data.amount_details || '____'}`;
            return `${radioText}\n${returnFee}\n${bearFee}\n${details}`;
        }
        return radioText;
    }
  },
  {
    type: "custom",
    path: "claims.c6_quality_compensation",
    title: "6. 房屋质量损害赔偿",
    children: () => {
        const { watch } = useFormContext();
        const hasIssue = watch("claims.c6.hasIssue");
        return (
            <div>
                <FormField path="claims.c6.hasIssue" type="radio" options={[{value: 'yes', label: '有此问题'}, {value: 'no', label: '无此问题'}]} />
                {hasIssue === 'yes' && <div className="mt-4 space-y-3 ">
                    <FormField path="claims.c6.request_repair" label="主张被告予以维修" type="radio" options={[{value: 'yes', label: '是'}, {value: 'no', label: '否'}]} />
                    <FormField path="claims.c6.defendant_bears_cost" label="主张被告承担原告垫付的维修费" type="radio" options={[{value: 'yes', label: '是'}, {value: 'no', label: '否'}]} />
                    <FormField path="claims.c6.amount_details" label="金额及明细" type="optimizable-textarea" />
                </div>}
            </div>
        )
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "claims.c6") || {};
        const radioText = generateSelectionText(['无此问题', '有此问题'], data.hasIssue === 'yes' ? '有此问题' : '无此问题');
        if (data.hasIssue === 'yes') {
            const repair = `主张被告予以维修: ${generateSelectionText(['是','否'], data.request_repair,"/")}`;
            const bearCost = `主张被告承担原告垫付的维修费: ${generateSelectionText(['是','否'], data.defendant_bears_cost,"/")}`;
            const details = `金额及明细: ${data.amount_details || '____'}`;
            return `${radioText}\n${repair}\n${bearCost}\n${details}`;
        }
        return radioText;
    }
  },
  {
    type: "custom",
    path: "claims.c7_mortgage_termination",
    title: "7. 解除担保贷款(按揭)合同",
    children: () => {
        const { watch } = useFormContext();
        const hasIssue = watch("claims.c7.hasIssue");
        return (
            <div>
                <FormField path="claims.c7.hasIssue" type="radio" options={[{value: 'yes', label: '有此问题'}, {value: 'no', label: '无此问题'}]} />
                {hasIssue === 'yes' && <div className="mt-4 ">
                    <FormField path="claims.c7.specific_request" label="具体要求" type="optimizable-textarea" />
                </div>}
            </div>
        )
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "claims.c7") || {};
        const radioText = generateSelectionText(['无此问题', '有此问题'], data.hasIssue === 'yes' ? '有此问题' : '无此问题');
        if (data.hasIssue === 'yes') {
            return `${radioText}\n具体要求: ${data.specific_request || '____'}`;
        }
        return radioText;
    }
  },
  {
    type: "custom",
    path: "claims.c8_appraisal_fee",
    title: "8. 鉴定及其他实现债权的费用",
    children: () => {
        const { watch } = useFormContext();
        const hasIssue = watch("claims.c8.hasIssue");
        return (
            <div>
                <FormField path="claims.c8.hasIssue" type="radio" options={[{value: 'yes', label: '有此问题'}, {value: 'no', label: '无此问题'}]} />
                {hasIssue === 'yes' && <div className="mt-4 space-y-3 ">
                     <FormField path="claims.c8.request_appraisal" label="请求委托鉴定" type="radio" options={[{value: 'yes', label: '是'}, {value: 'no', label: '否'}]} />
                     <FormField path="claims.c8.cost_details" label="费用明细" type="optimizable-textarea" />
                </div>}
            </div>
        )
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "claims.c8") || {};
        const radioText = generateSelectionText(['无此问题', '有此问题'], data.hasIssue === 'yes' ? '有此问题' : '无此问题');
        if (data.hasIssue === 'yes') {
            const appraisal = `请求委托鉴定: ${generateSelectionText(['是','否'], data.request_appraisal,"/")}`;
            const details = `费用明细: ${data.cost_details || '____'}`;
            return `${radioText}\n${appraisal}\n${details}`;
        }
        return radioText;
    }
  },
  {
    type: "radio",
    path: "claims.c9_litigation_costs_check",
    title: "9. 是否主张诉讼费用",
    options: [{ value: "yes", label: "是" }, { value: "no", label: "否" }],
  },
   {
    type: "optimizationContext",
    path: "claims.c10_other_claims",
    title: "10. 其他请求",
  },
  {
    type: "optimizationContext",
    path: "claims.c11_total_amount",
    title: "11. 标的总额",
  },
];


// --- 事实与理由配置 (全部实现) ---
const factsConfig: QuestionConfig[] = [
 {
    type: "custom",
    path: "facts.f1_basic_info",
    title: "1. 涉及房屋买卖合同关系的基本情况",
    children: () => {
        const { watch, setValue } = useFormContext();
        
        // --- 1. 自动计算总价 ---
        const area = watch("facts.f1.area");
        const unitPrice = watch("facts.f1.unit_price");

        React.useEffect(() => {
            const areaNum = parseFloat(area);
            const priceNum = parseFloat(unitPrice);

            if (!isNaN(areaNum) && !isNaN(priceNum)) {
                const total = areaNum * priceNum;
                // 使用 toFixed(2) 来避免浮点数精度问题，并格式化为两位小数
                setValue("facts.f1.total_price", total.toFixed(2), { shouldValidate: true });
            }
        }, [area, unitPrice, setValue]);


        return (
            <div className="space-y-3">
                <FormField path="facts.f1.signing_time" label="合同订立时间" type="date" frontLabel="合同订立时间"/>
                <div className="flex flex-wrap gap-4 items-center">
                    <FormField path="facts.f1.prop_type" label="房屋性质" type="radio" options={[{value:'商品房', label:'商品房'}, {value:'经济适用房', label:'经济适用房'}, {value:'自建房', label:'自建房'}, {value:'其他', label:'其他'}]} />
                    {watch('facts.f1.prop_type') === '其他' && <FormField path="facts.f1.prop_type_other" label="" type="text" placeholder="请注明其他性质"/>}
                </div>
                <FormField path="facts.f1.location" label="房屋位置" type="text" frontLabel="房屋位置"/>
                <FormField path="facts.f1.area" label="房屋面积" type="number" frontLabel="房屋面积" endLabel="平方米"/>
                <FormField path="facts.f1.unit_price" label="房屋单价" type="money" frontLabel="房屋单价" endLabel="元/平方米"/>
                <FormField path="facts.f1.total_price" label="总价" type="money" frontLabel="总价"/>
                <FormField path="facts.f1.first_sale" label="房屋是否首次出售" type="radio" options={[{value:'yes', label:'是'}, {value:'no', label:'否'}]} />
                <FormField path="facts.f1.is_presale" label="是否为预售房" type="radio" options={[{value:'yes', label:'是'}, {value:'no', label:'否'}]} />
                <FormField path="facts.f1.presale_registered" label="预售合同是否登记备案" type="radio" options={[{value:'yes', label:'是'}, {value:'no', label:'否'}]} />
                <FormField path="facts.f1.is_online_signed" label="是否网签" type="radio" options={[{value:'yes', label:'是'}, {value:'no', label:'否'}]} />
                <FormField path="facts.f1.is_pre_registered" label="是否预告登记" type="radio" options={[{value:'yes', label:'是'}, {value:'no', label:'否'}]} />
                <FormField path="facts.f1.contract_nature" label="订立的合同性质" type="radio"options={[{value:'本约', label:'本约'}, {value:'预约', label:'预约'}]} />
                <div className="flex items-center gap-x-2">
                    <FormField path="facts.f1.notice_sent" label="是否已向被告发出解除/撤销合同的通知" type="radio" options={[{value:'yes', label:'是'}, {value:'no', label:'否'}]} />
                    {watch('facts.f1.notice_sent') === 'yes' && <FormField path="facts.f1.notice_arrival_time" label="通知到达对方时间" type="date" frontLabel="通知到达对方时间"/>}
                </div>
                <FormField path="facts.f1.reason" label="解除/撤销事由" type="optimizable-textarea"/>
            </div>
        )
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f1") || {};
        const yesNo = (val:any) => generateSelectionText(['是','否'], val);
        const propType = generateSelectionText(['商品房','经济适用房','自建房','其他'], data.prop_type);
        const otherProp = data.prop_type === '其他' ? `(${data.prop_type_other || '____'})` : '';

        // --- 2. 调整通知日期的格式化逻辑 ---
        const noticeDateText = data.notice_sent === 'yes' 
            ? ` (通知到达对方时间: ${data.notice_arrival_time ? formatDateToChinese(data.notice_arrival_time) : ''})` 
            : '(通知到达对方时间: )';
        const noticeText = `是${data.notice_sent === 'yes' ? '☑' : '☐'}${noticeDateText} 否${data.notice_sent === 'no' ? '☑' : '☐'}`;


        return `合同订立时间: ${data.signing_time ? formatDateToChinese(data.signing_time) : '____'}\n` +
               `房屋性质: ${propType} ${otherProp}\n` +
               `房屋位置: ${data.location || '____'}\n` +
               `房屋面积: ${data.area || '____'} 平方米\n` +
               `房屋单价: ${formatMoneyWithCN(data.unit_price)}/平方米\n` +
               `总价: ${formatMoneyWithCN(data.total_price)}\n` +
               `房屋是否首次出售: ${yesNo(data.first_sale)}\n` +
               `是否为预售房: ${yesNo(data.is_presale)}\n` +
               `预售合同是否登记备案: ${yesNo(data.presale_registered)}\n` +
               `是否网签: ${yesNo(data.is_online_signed)}\n` +
               `是否预告登记: ${yesNo(data.is_pre_registered)}\n` +
               `订立的合同性质: ${generateSelectionText(['本约', '预约'], data.contract_nature)}\n` +
               `是否已向被告发出解除/撤销合同的通知: ${noticeText}\n` +
               `解除/撤销事由: ${data.reason || '____'}`;
    }
  },
  {
    type: "custom",
    path: "facts.f2_payment_status",
    title: "2. 购房款支付情况",
    children: () => {
        const {watch} = useFormContext();
        return (
            <div className="space-y-3">
                <div className="flex flex-wrap gap-x-4 items-center">
                    <label className="label-text">支付方式:</label>
                    <FormField path="facts.f2.pay_mortgage" label="按揭贷款" type="checkbox"/>
                    <FormField path="facts.f2.pay_cash" label="支付现金" type="checkbox"/>
                    <FormField path="facts.f2.pay_offset" label="以房抵债" type="checkbox"/>
                    <FormField path="facts.f2.pay_other" label="其他" type="checkbox"/>
                    {watch('facts.f2.pay_other') && <FormField path="facts.f2.pay_other_detail" type="text" placeholder="请注明其他方式"/>}
                </div>
                <FormField path="facts.f2.amount" label="已支付/欠付购房款数额" type="money" frontLabel="已支付/ 欠付购房款数额"/>
                <div className="flex flex-wrap items-center gap-y-2">
                    <FormField path="facts.f2.deposit_paid" label="是否已支付定金" type="radio" options={[{value:'yes', label:'是'}, {value:'no', label:'否'}]} />
                    {watch('facts.f2.deposit_paid') === 'yes' && <FormField path="facts.f2.deposit_amount" label="定金数额" type="money" frontLabel="定金数额"/>}
                </div>
                <FormField path="facts.f2.includes_decoration" label="是否包含精装修" type="radio" options={[{value:'yes', label:'是'}, {value:'no', label:'否'}]} />
                <FormField path="facts.f2.contract_payment_terms" label="合同有关购房款支付的约定" type="optimizable-textarea"/>
                <FormField path="facts.f2.other_reasons" label="其他事由" type="optimizable-textarea"/>
            </div>
        )
    },
     formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f2") || {};
        const paymentMethods = [
            `按揭贷款${data.pay_mortgage ? '☑':'☐'}`,
            `支付现金${data.pay_cash ? '☑':'☐'}`,
            `以房抵债${data.pay_offset ? '☑':'☐'}`,
            `其他${data.pay_other ? '☑':'☐'} ${data.pay_other ? `(${data.pay_other_detail || '____'})` : ''}`
        ].join(' ');

        // --- 这是修改的核心部分 ---
        // 1. 无论是否选择“是”，都准备好括号内的文本
        const depositAmountText = `(定金数额 ${formatMoneyWithCN(data.deposit_amount)})`;
        
        // 2. 构建“是否已支付定金”的完整行
        const depositPaidText = `是${data.deposit_paid === 'yes' ? '☑' : '☐'} ${depositAmountText} / 否${data.deposit_paid === 'no' ? '☑' : '☐'}`;

        return `支付方式: ${paymentMethods}\n` +
               `已支付/欠付购房款数额: ${formatMoneyWithCN(data.amount)}\n` +
               `是否已支付定金: ${depositPaidText}\n`+
               `是否包含精装修: ${generateSelectionText(['是','否'], data.includes_decoration,"/")}\n` +
               `合同有关购房款支付的约定: ${data.contract_payment_terms || '____'}\n` +
               `其他事由: ${data.other_reasons || '____'}`;
    }
  },
  {
    type: "custom",
    path: "facts.f3_delivery_status",
    title: "3. 房屋交付情况",
    children: () => (
        <div className="space-y-3">
            <FormField path="facts.f3.is_delivered" label="是否已经实际交付" type="radio" options={[{value: 'yes', label: '是'}, {value: 'no', label: '否'}]} />
            <FormField path="facts.f3.has_area_diff" label="是否存在房屋面积差" type="radio" options={[{value: 'yes', label: '是'}, {value: 'no', label: '否'}]} />
            <FormField path="facts.f3.includes_parking" label="是否包含车位或车库" type="radio" options={[{value: 'yes', label: '是'}, {value: 'no', label: '否'}]} />
            <FormField path="facts.f3.contract_delivery_date" label="合同约定的交房时间" type="date" frontLabel="合同约定的交房时间"/>
        </div>
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f3") || {};
        return `是否已经实际交付: ${generateSelectionText(['是','否'], data.is_delivered)}\n` +
               `是否存在房屋面积差: ${generateSelectionText(['是','否'], data.has_area_diff)}\n` +
               `是否包含车位或车库: ${generateSelectionText(['是','否'], data.includes_parking)}\n` +
               `合同约定的交房时间: ${data.contract_delivery_date ? formatDateToChinese(data.contract_delivery_date) : '____'}`;
    }
  },
{
    type: "custom",
    path: "facts.f4_registration_status",
    title: "4. 房屋登记手续办理情况",
    children: () => {
        const { watch } = useFormContext();
        const hasLatePenaltyClause = watch("facts.f4.has_late_penalty_clause");

        return (
            <div className="space-y-3">
                <FormField path="facts.f4.initial_registration" label="是否已经取得首次登记" type="radio" options={[{value:'yes',label:'是'},{value:'no',label:'否'}]} />
                <FormField path="facts.f4.transfer_registration" label="是否办理不动产转移登记手续" type="radio" options={[{value:'yes',label:'是'},{value:'no',label:'否'}]} />
                
                {/* 新的条件输入组 */}
                <div className="space-y-2">
                    <FormField 
                        path="facts.f4.has_late_penalty_clause" 
                        label="是否约定逾期办证违约金" 
                        type="radio" 
                        options={[{value:'yes',label:'是'},{value:'no',label:'否'}]} 
                    />
                    {hasLatePenaltyClause === 'yes' && (
                        <div className="space-y-3">
                            <FormField 
                                path="facts.f4.late_penalty_amount" 
                                label="违约金金额" 
                                type="money" 
                                frontLabel="违约金金额"
                            />
                            <FormField 
                                path="facts.f4.late_penalty_calculation" 
                                label="具体计算标准" 
                                type="optimizable-textarea" 
                                placeholder="请填写具体计算标准"
                            />
                        </div>
                    )}
                </div>
            </div>
        )
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f4") || {};
        const initialRegText = `是否已经取得首次登记: ${generateSelectionText(['是','否'], data.initial_registration)}`;
        const transferRegText = `是否办理不动产转移登记手续: ${generateSelectionText(['是','否'], data.transfer_registration)}`;

        // --- 这是修改的核心部分 ---
        // 1. 准备括号内的违约金金额文本
        const penaltyAmountText = `(违约金金额: ${formatMoneyWithCN(data.late_penalty_amount)})`;
        
        // 2. 构建“是否约定...”这一行
        const hasPenaltyClauseText = `是否约定逾期办证违约金: 是${data.has_late_penalty_clause === 'yes' ? '☑' : '☐'} ${penaltyAmountText} / 否${data.has_late_penalty_clause === 'no' ? '☑' : '☐'}`;

        // 3. 只有在选择“是”时，才显示计算标准
        const calculationText = data.has_late_penalty_clause === 'yes' 
            ? `具体计算标准: ${data.late_penalty_calculation || '____'}`
            : '具体计算标准:'; // 如果选否，则只显示标题

        return `${initialRegText}\n${transferRegText}\n${hasPenaltyClauseText}\n${calculationText}`;
    }
  },
 {
    type: "custom",
    path: "facts.f5_agency_fee_status",
    title: "5. 中介服务费情况",
    children: () => (
        <div className="space-y-3">
            {/* 新增的单选按钮组 */}
            <FormField 
                path="facts.f5.claim_type"
                label=""
                type="radio"
                options={[
                    { value: "return", label: "被告应返还中介费" },
                    { value: "bear", label: "被告应承担中介费" },
                ]}
            />
            {/* 保持事由输入框 */}
            <FormField 
                path="facts.f5.reason" 
                label="中介服务费的事由" 
                type="optimizable-textarea"
                placeholder="请根据上述选择，详细说明事由..."
            />
        </div>
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f5") || {};
        
        // --- 修改的核心部分 ---
        // 1. 使用 generateSelectionText 来格式化单选按钮
        const claimTypeText = generateSelectionText(['应返还', '应承担'], data.claim_type === 'return' ? '应返还' : '应承担', ' / ');

        // 2. 拼接完整的字符串
        return `${claimTypeText} 中介服务费的事由: ${data.reason || '____'}`;
    }
  },
  {
    type: "custom",
    path: "facts.f6_quality_issues",
    title: "6. 质量损害赔偿相关情况",
    children: () => (
        <div className="space-y-3">
            <FormField path="facts.f6.serious_issue" label="属于严重影响正常居住使用的质量问题" type="checkbox"/>
            <FormField path="facts.f6.repairable_issue" label="属于可修复的质量问题" type="checkbox"/>
            <FormField path="facts.f6.in_warranty" label="是否还在质保期内" type="radio" options={[{value:'yes',label:'是'},{value:'no',label:'否'}]} />
            <FormField path="facts.f6.repair_action_taken" label="是否存在修复行为" type="radio" options={[{value:'yes',label:'是'},{value:'no',label:'否'}]} />
            <FormField path="facts.f6.notified_for_repair" label="是否通知维修" type="radio" options={[{value:'yes',label:'是'},{value:'no',label:'否'}]} />
            <FormField path="facts.f6.compensation_amount" label="赔偿数额" type="money" frontLabel="赔偿数额"/>
        </div>
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f6") || {};
        return `属于严重影响正常居住使用的质量问题${data.serious_issue ? '☑':'☐'}\n` +
               `属于可修复的质量问题${data.repairable_issue ? '☑':'☐'}\n` +
               `是否还在质保期内: ${generateSelectionText(['是','否'], data.in_warranty)}\n` +
               `是否存在修复行为: ${generateSelectionText(['是','否'], data.repair_action_taken)}\n` +
               `是否通知维修: ${generateSelectionText(['是','否'], data.notified_for_repair)}\n` +
               `赔偿数额: ${formatMoneyWithCN(data.compensation_amount)}`;
    }
  },
  {
    type: "custom",
    path: "facts.f7_mortgage_status",
    title: "7. 是否签订担保贷款(按揭)合同",
    children: () => {
        const { watch } = useFormContext();
        return (
            <div>
                <FormField path="facts.f7.signed" type="radio" options={[{value:'yes',label:'是'},{value:'no',label:'否'}]} />
                {watch('facts.f7.signed')==='yes' && <FormField path="facts.f7.details" label="具体情况" type="optimizable-textarea" />}
            </div>
        )
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f7") || {};
        const radioText = generateSelectionText(['是','否'], data.signed);
        if (data.signed === 'yes') {
            return `${radioText}\n具体情况: ${data.details || '____'}`;
        }
        return radioText;
    }
  },
  {
    type: "custom",
    path: "facts.f8_appraisal_status",
    title: "8. 申请鉴定及其他实现债权费用的事实",
    children: () => {
        const { watch } = useFormContext();
        return (
            <div>
                <FormField path="facts.f8.request" type="radio" options={[{value:'yes',label:'是'},{value:'no',label:'否'}]} />
                {watch('facts.f8.request')==='yes' && <FormField path="facts.f8.details" label="具体情况" type="optimizable-textarea" />}
            </div>
        )
    },
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f8") || {};
        const radioText = generateSelectionText(['是','否'], data.request);
        if (data.request === 'yes') {
            return `${radioText}\n具体情况: ${data.details || '____'}`;
        }
        return radioText;
    }
  },
  {
    type: "LegalAnalysisField",
    path: "facts.f9_claim_basis",
    title: "9. 请求依据",
    formDataProcessor: processFormDataForPreview,
    withContractAnalysis: true,
  },
  {
    type: "textarea",
    path: "facts.f10_evidence_list",
    title: "10. 证据清单(可另附页)",
  }
];


// --- Sections and Main Page Component ---
const ClaimsSection: React.FC = () => (
    <FormSectionCard title="诉讼请求">
        <OptimizableTextarea path="claims.fullStatement" label="完整陈述" placeholder="可在此处完整表述您的诉讼请求..."/>
        <p className="text-sm my-2">为方便、准确梳理要点，相关内容请在下方要素式表格中填写：</p>
        <QuestionTable config={claimsConfig} />
    </FormSectionCard>
);

const FactsAndReasonsSection: React.FC = () => (
    <FormSectionCard title="事实与理由">
        <OptimizableTextarea path="facts.fullStatement" label="完整陈述" placeholder="可在此处完整表述纠纷涉及的事实与理由..."/>
        <p className="text-sm my-2">为方便、准确梳理要点，相关内容请在下方要素式表格中填写：</p>
        <QuestionTable config={factsConfig} />
    </FormSectionCard>
);

export const HouseSaleDisputeClaimFormPage: React.FC = () => {
    const title = `民事起诉状 (${CASE_TYPE})`;

    const handleFormSubmit = async (data: any) => {
        const final = processFormDataForPreview(data);
        console.log("最终提交的起诉状Payload:", JSON.stringify(final, null, 2));
    };

    const rightSide = <AIChatbotPanel caseType={CASE_TYPE} />;

    return (
        <FormPageLayout
            title={title}
            formId="claim_house_sale_dispute"
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

export default HouseSaleDisputeClaimFormPage;