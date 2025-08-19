/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
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
} from "../../utils/formatter";

import { AIChatbotPanel } from "../../components/AIChatbotPanel";
import { OptimizableTextarea } from "../../components/OptimizableTextarea";
import { PretrialPreservationForm } from "../../components/claim/PretrialPreservationForm";
import { formatPretrialPreservationForDocx } from "../../utils/formatter";
import { QuestionTable } from '../../components/claim/QuestionTable';
import type { QuestionConfig } from '../../components/claim/QuestionTable';
import { formatFormData } from "../../utils/formatter";

const processFormDataForPreview = (data: any) => {

    // 1. 定义当事人蓝图，仅供 formatPartiesForDocx 使用
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
      }
    ];

    const partyBlueprint_others = [
      { path: 'defendants_legal', roleText: '被告\n(法人/非法人组织)', type: 'legal' as const },
    ]

    // 2. 逐一构建 final 对象的每个部分
    return {
      case_type: data.basicInfo?.caseCause,
      case_number: data.basicInfo?.caseNumber || `起诉状-${Date.now()}`,

      partyInfo: [
        ...formatPartiesForDocx(data, partyBlueprint_plaintiffs),
        ...formatAgentsForDocx(data),
        ...formatPartiesForDocx(data, partyBlueprint_others),
      ],

      claimItems: formatFormData("claim", data, claimsConfig),
      pretrialPreservation: formatPretrialPreservationForDocx(data),
      factItems: formatFormData("facts", data, factsConfig),
      
      mediationInfo: formatMediationForDocx(data),
    };
  };

// 你的 LaborDisputeClaimRadioConfig 配置
const claimsConfig: QuestionConfig[] = [
  {
    type: "radio",
    path: "claims.c1_check",
    title: "1. 是否主张工资支付",
    options: [
      { value: "yes", label: "是" },
      { value: "no", label: "否" },
    ],
    detailsLabel: "明细",
    enableDetails: true, // 启用详情文本框
    // children 属性不再需要在此处定义，除非你有非常独特的逻辑
  },
  {
    type: "radio",
    path: "claims.c2_check",
    title: "2. 是否主张未签订书面劳动合同双倍工资",
    options: [
      { value: "yes", label: "是" },
      { value: "no", label: "否" },
    ],
    detailsLabel: "明细",
    enableDetails: true, // 启用详情文本框
  },
  {
    type: "radio",
    path: "claims.c3_check",
    title: "3. 是否主张加班费",
    options: [
      { value: "yes", label: "是" },
      { value: "no", label: "否" },
    ],
    detailsLabel: "明细",
    enableDetails: true, // 启用详情文本框
  },
  {
    type: "radio",
    path: "claims.c4_check",
    title: "4. 是否主张未休年休假工资",
    options: [
      { value: "yes", label: "是" },
      { value: "no", label: "否" },
    ],
    detailsLabel: "明细",
    enableDetails: true, // 启用详情文本框
  },
  {
    type: "radio",
    path: "claims.c5_check",
    title: "5. 是否主张未依法缴纳社会保险费造成的经济损失",
    options: [
      { value: "yes", label: "是" },
      { value: "no", label: "否" },
    ],
    detailsLabel: "明细",
    enableDetails: true, // 启用详情文本框
  },
  {
    type: "radio",
    path: "claims.c6_check",
    title: "6. 是否主张解除劳动合同经济补偿",
    options: [
      { value: "yes", label: "是" },
      { value: "no", label: "否" },
    ],
    detailsLabel: "明细",
    enableDetails: true, // 启用详情文本框
  },
  {
    type: "radio",
    path: "claims.c7_check",
    title: "7. 是否主张违法解除劳动合同赔偿金",
    options: [
      { value: "yes", label: "是" },
      { value: "no", label: "否" },
    ],
    detailsLabel: "明细",
    enableDetails: true, // 启用详情文本框
  },
  {
    type: "radio",
    path: "claims.c8_check",
    title: "8. 是否主张诉讼费用",
    options: [
      { value: "yes", label: "是" },
      { value: "no", label: "否" },
    ],
    
    // 对于不需要详情的，不设置或设置为 false
    // enableDetails: false,
  },
  {
    type: "optimizationContext",
    path: "claims.c9_details",
    title: "9. 其他诉讼请求",
    detailsLabel: "具体说明"
  },
  {
    path: "claims.c10_details",
    title: "10. 标的总额",
    type: "optimizationContext",
    detailsLabel: "标的总额说明"
  }

  // 示例：可以为某个独特的 children 仍然保留 children 属性
  // {
  //   path: "claims.custom_check",
  //   title: "9. 是否有其他特殊主张",
  //   options: [{ value: "yes", label: "是" }, { value: "no", label: "否" }],
  //   children: (selectedValue) => {
  //     if (selectedValue === "yes") {
  //       return <p className="text-sm text-info mt-2">这是特殊情况下的自定义内容。</p>;
  //     }
  //     return null;
  //   },
  // },
];

const factsConfig: QuestionConfig[] = [
  {
    path: "facts.f1_details",
    title: "1. 劳动合同签订情况",
    type: "optimizationContext",
    placeholder: "（合同主体、签订时间、地点、合同名称等）",
  },
  {
    path: "facts.f2_details",
    title: "2. 劳动合同履行情况",
    type: "optimizationContext",
    placeholder:
      "（入职时间、用人单位、工作岗位、工作地点、合同约定的每月工资数额及工资构成、办理社会保险的时间及险种、劳动者实际领取的每月工资数额及工资构成、加班工资计算基数及计算方法、原告加班时间及加班费、年休假等）",
  },
  {
    path: "facts.f3_details",
    title: "3. 解除或终止劳动关系情况",
    type: "optimizationContext",
    placeholder: "（解除或终止劳动关系的原因、经济补偿/赔偿金数额等）",
  },
  {
    path: "facts.f4_details",
    title: "4. 工伤情况",
    type: "optimizationContext",
    placeholder: "（发生工伤时间、工伤认定情况、工伤伤残等级、工伤费用等）",
  },
  {
    path: "facts.f5_details",
    title: "5. 劳动仲裁相关情况",
    type: "optimizationContext",
    placeholder: "（申请劳动仲裁时间、仲裁请求、仲裁文书、仲裁结果等）",
  },
  {
    path: "facts.f6_details",
    title: "6. 其他相关情况",
    type: "optimizationContext",
    placeholder: "（如是否是农民工）",
  },
  {
    path: "facts.f7_details",
    title: "7. 诉请依据",
    type: "LegalAnalysisField",
    placeholder: `（法律及司法解释的规定，要写明具体条文）`,
    formDataProcessor: processFormDataForPreview,
  },
  {
    path: "facts.f8_details",
    title: "8. 证据清单 (可另附页)",
    type: "textarea",
  },
];

const ClaimsSection: React.FC = () => {
  return (
    <FormSectionCard title="诉讼请求">
      {/* 1. 顶部的完整陈述 Textarea */}
      <OptimizableTextarea
        path="claims.fullStatement"
        label="完整陈述"
        placeholder="可在此处完整表述您的诉讼请求..."
        rows={3}
        optimizationContext="这是原告关于本劳动纠纷案件的诉讼请求完整陈述。"
      />

      <p className="text-sm text-neutral-500 my-2">
        为方便、准确梳理要点，请在下方要素式表格中填写：
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
      {/* 1. 顶部的完整陈述 Textarea */}
      <OptimizableTextarea
        path="facts.fullStatement"
        label="完整陈述"
        placeholder="可在此处完整表述纠纷涉及的事实与理由..."
        rows={3}
        optimizationContext="这是一段关于不正当竞争纠纷的案件事实与理由陈述。"
      />

      <p className="text-sm text-neutral-500 my-2">
        为方便、准确梳理要点，请在下方要素式表格中填写：
      </p>

      <table className="table w-full">
        <tbody>
          <QuestionTable config={factsConfig} />
        </tbody>
      </table>
    </FormSectionCard>
  );
};



export const LaborDisputeClaimFormPage: React.FC = () => {
  const title = "民事起诉状 (劳动纠纷)";


  const handleFormSubmit = async (data: any) => {
    const final = processFormDataForPreview(data);
    const payload = { formData: data, final };

    console.log("最终提交的起诉状Payload:", JSON.stringify(payload, null, 2));
  };

  const rightSide = <AIChatbotPanel />;

  return (
    <FormPageLayout
      title={title}
      formId="claim_labor_dispute"
      onSubmit={handleFormSubmit}
      onPreviewData={processFormDataForPreview}
      rightPanel={rightSide}
      docType="起诉状"
      fixedFormValues={{ basicInfo: { caseCause: "劳动争议纠纷" } }}
    >
      <BasicInfoSection case_type="劳动争议纠纷" />
      <FormSectionCard title="原告">
        <PartyList
          path="plaintiffs_natural"
          title="自然人"
          partyType="natural"
        />
      </FormSectionCard>
      <AgentList path="agents" />
      <FormSectionCard title="被告">
        <PartyList
          path="defendants_legal"
          title="法人/非法人组织"
          partyType="legal"
        />
      </FormSectionCard>

      <ClaimsSection />
      <PretrialPreservationForm path="pretrialPreservation" />
      <FactsAndReasonsSection />
      <FormSectionCard title="对纠纷解决方式的意愿">
        <MediationForm path="mediation" />
      </FormSectionCard>
    </FormPageLayout>
  );
};

export default LaborDisputeClaimFormPage;
