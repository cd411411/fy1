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
const CASE_TYPE = "物业服务合同纠纷";

const processFormDataForPreview = (data: any) => {
  // 1. 定义当事人蓝图
  const partyBlueprint_plaintiffs = [
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
    claimItems: formatFormData('claim', data, claimsConfig),
    jurisdictionAndPreservation: formatJurisdictionAndPreservationForDocx(data),
    factItems: formatFormData('facts', data, factsConfig),
    mediationInfo: formatMediationForDocx(data),
  };
};

// 诉讼请求配置
const claimsConfig: QuestionConfig[] = [
  {
    type: "custom",
    path: "claims.c1_property_fee",
    title: "1. 物业费",
    children: () => (
      <div className="grid grid-cols-2 gap-x-4">
        <FormField path="claims.c1_property_fee.date" label="截至日期" type="date" frontLabel="截至"/>
        <FormField path="claims.c1_property_fee.amount" label="尚欠物业费" type="money" frontLabel="尚欠物业费"/>
      </div>
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "claims.c1_property_fee") || {};
        const dateText = data.date ? `截至 ${formatDateToChinese(data.date)} 止, ` : "截至 ____年____月____日 止, ";
        return `${dateText}尚欠物业费 ${formatMoneyWithCN(data.amount)}`;
    }
  },
  {
    type: "custom",
    path: "claims.c2_late_fee",
    title: "2. 违约金",
    children: () => (
      <div className="flex flex-col gap-y-2">
        <div className="grid grid-cols-2 gap-x-4">
            <FormField path="claims.c2_late_fee.date" label="截至日期" type="date" frontLabel="截至" />
            <FormField path="claims.c2_late_fee.amount" label="欠逾期物业费的违约金" type="money" frontLabel="违约金"/>
        </div>
        <FormField path="claims.c2_late_fee.payToNow" label="是否请求支付至实际清偿之日止" type="radio" options={[{value: "yes", label: "是"}, {value: "no", label: "否"}]} />
      </div>
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "claims.c2_late_fee") || {};
        const dateText = data.date ? `截至 ${formatDateToChinese(data.date)} 止, ` : "截至 ____年____月____日 止, ";
        const amountText = `欠逾期物业费的违约金 ${formatMoneyWithCN(data.amount)}`;
        const payToNowText = `\n是否请求支付至实际清偿之日止: ${generateSelectionText(['是','否'], data.payToNow)}`;
        return `${dateText}${amountText}${payToNowText}`;
    }
  },
  {
    type: "radio",
    path: "claims.c3_litigation_costs_check",
    title: "3. 是否主张诉讼费用",
    options: [{ value: "yes", label: "是" }, { value: "no", label: "否" }],
  },
  {
    type: "optimizationContext",
    path: "claims.c4_other_claims",
    title: "4. 其他请求",
  },
  {
    type: "optimizationContext",
    path: "claims.c5_total_amount",
    title: "5. 标的总额",
  },
];

// 事实与理由配置
const factsConfig: QuestionConfig[] = [
  {
    type: "optimizationContext",
    path: "facts.f1_contract_signing",
    title: "1. 物业服务合同或前期物业服务合同签订情况 (名称、编号、签订时间、地点等)",
  },
  {
    type: "custom",
    path: "facts.f2_signing_parties",
    title: "2. 签订主体",
    children: () => (
        <div className="flex flex-col gap-y-2">
            <FormField path="facts.f2_signing_parties.owner" label="业主/建设单位" type="text" frontLabel="业主/建设单位"/>
            <FormField path="facts.f2_signing_parties.provider" label="物业服务人" type="text" frontLabel="物业服务人"/>
        </div>
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f2_signing_parties") || {};
        return `业主/建设单位: ${data.owner || '____'}\n物业服务人: ${data.provider || '____'}`;
    }
  },
  {
    type: "custom",
    path: "facts.f3_project_details",
    title: "3. 物业项目情况",
    children: () => (
        <div className="flex flex-col gap-y-2">
            <FormField path="facts.f3_project_details.location" label="坐落位置" type="text" frontLabel="坐落位置"/>
            <FormField path="facts.f3_project_details.area" label="面积" type="text" frontLabel="面积"/>
            <FormField path="facts.f3_project_details.ownerName" label="所有权人" type="text" frontLabel="所有权人"/>
        </div>
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f3_project_details") || {};
        return `坐落位置: ${data.location || '____'}\n面积: ${data.area || '____'}\n所有权人: ${data.ownerName || '____'}`;
    }
  },
  {
    type: "optimizationContext",
    path: "facts.f4_fee_standard",
    title: "4. 约定的物业费标准",
  },
  {
    type: "custom",
    path: "facts.f5_service_period",
    title: "5. 约定的物业服务期限",
    children: () => (
        <div className="grid grid-cols-2 gap-x-4">
            <FormField path="facts.f5_service_period.startDate" label="起始日期" type="date" frontLabel="自"/>
            <FormField path="facts.f5_service_period.endDate" label="截止日期" type="date" frontLabel="至"/>
        </div>
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f5_service_period") || {};
        const startDate = data.startDate ? formatDateToChinese(data.startDate) : '____年____月____日';
        const endDate = data.endDate ? formatDateToChinese(data.endDate) : '____年____月____日';
        return `${startDate} 起至 ${endDate} 止`;
    }
  },
  {
    type: "optimizationContext",
    path: "facts.f6_payment_method",
    title: "6. 约定的物业费支付方式",
  },
  {
    type: "optimizationContext",
    path: "facts.f7_late_fee_standard",
    title: "7. 约定的逾期支付物业费违约金标准",
  },
  {
    type: "custom",
    path: "facts.f8_fee_owed",
    title: "8. 被告欠付物业费数额及计算方式",
    children: () => (
      <div>
        <FormField path="facts.f8_fee_owed.amount" label="欠付物业费数额" type="money" frontLabel="欠付物业费数额"/>
        <FormField path="facts.f8_fee_owed.calculation" label="具体计算方式" type="optimizable-textarea" optimizationContext="关于欠付物业费的计算方式说明"/>
      </div>
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f8_fee_owed") || {};
        return `欠付物业费数额: ${formatMoneyWithCN(data.amount)}\n具体计算方式: ${data.calculation || '____'}`;
    }
  },
  {
    type: "custom",
    path: "facts.f9_late_fee_owed",
    title: "9. 被告应付违约金数额及计算方式",
    children: () => (
      <div>
        <FormField path="facts.f9_late_fee_owed.amount" label="应付违约金数额" type="money" frontLabel="应付违约金数额"/>
        <FormField path="facts.f9_late_fee_owed.calculation" label="具体计算方式" type="optimizable-textarea" optimizationContext="关于应付违约金的计算方式说明"/>
      </div>
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "facts.f9_late_fee_owed") || {};
        return `应付违约金数额: ${formatMoneyWithCN(data.amount)}\n具体计算方式: ${data.calculation || '____'}`;
    }
  },
  {
    type: "optimizationContext",
    path: "facts.f10_collection_situation",
    title: "10. 催缴情况",
  },
  {
    type: "optimizationContext",
    path: "facts.f11_other_notes",
    title: "11. 其他需要说明的内容 (可另附页)",
  },
  {
    type: 'LegalAnalysisField',
    path: 'facts.f12_claim_basis',
    title: '12. 请求依据',
    formDataProcessor: processFormDataForPreview,
    // 该案由有明确的合同部分，因此使用默认的 withContractAnalysis: true
  },
  {
    type: "textarea",
    path: "facts.f13_evidence_list",
    title: "13. 证据清单 (可另附页)",
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
      optimizationContext="这是原告关于本物业服务合同纠纷案件的诉讼请求完整陈述。"
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
      optimizationContext="这是一段关于物业服务合同纠纷的案件事实与理由陈述。"
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
export const PropertyManagementContractClaimFormPage: React.FC = () => {
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
      formId="claim_property_service_dispute"
      onSubmit={handleFormSubmit}
      onPreviewData={processFormDataForPreview}
      rightPanel={rightSide}
      docType="起诉状"
      fixedFormValues={{ basicInfo: { caseCause: CASE_TYPE } }}
    >
      <BasicInfoSection case_type={CASE_TYPE} />
      <FormSectionCard title="原告">
        {/* 物业公司通常是法人 */}
        <PartyList path="plaintiffs_legal" title="法人/非法人组织" partyType="legal"/>
      </FormSectionCard>
      <AgentList path="agents" />
      <FormSectionCard title="被告">
        {/* 业主通常是自然人 */}
        <PartyList path="defendants_natural" title="自然人" partyType="natural"/>
      </FormSectionCard>
      <FormSectionCard title="第三人">
        <PartyList path="third_parties_natural" title="自然人" partyType="natural"/>
        <div className="divider my-4"></div>
        <PartyList path="third_parties_legal" title="法人/非法人组织" partyType="legal"/>
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

export default PropertyManagementContractClaimFormPage;