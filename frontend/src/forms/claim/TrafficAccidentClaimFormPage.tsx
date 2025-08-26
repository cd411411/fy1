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
  formatDateToChinese,
} from "../../utils/formatter";

import { AIChatbotPanel } from "../../components/AIChatbotPanel";
import { QuestionTable } from "../../components/claim/QuestionTable";
import type { QuestionConfig } from "../../components/claim/QuestionTable";
import { getValueFromPath } from "../../utils/formatter";
import FormField from "../../components/claim/FormField";
import { OptimizableTextarea } from "../../components/OptimizableTextarea";
import {JurisdictionPreservationAppraisalForm,FORM_CONFIGS,formatJurisdictionPreservationAppraisalForDocx } from "../../components/claim/JurisdictionPreservationAppraisalForm"
// 定义案件类型
const CASE_TYPE = "机动车交通事故责任纠纷";

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
    preservationAndAppraisal: formatJurisdictionPreservationAppraisalForDocx(data, FORM_CONFIGS.PRESERVATION_AND_APPRAISAL),
    factItems: formatFormData('facts', data, factsConfig),
    mediationInfo: formatMediationForDocx(data),
  };
};


// --- 诉讼请求配置 ---
const claimsConfig: (QuestionConfig & { claimTypes?: ('personal_injury' | 'property_damage' | 'both')[] })[] = [
  {
    type: "custom",
    path: "claims.c1_medical_fee",
    title: "1. 医疗费",
    claimTypes: ['personal_injury', 'both'],
    children: () => (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-4">
            <FormField path="claims.c1.start_date" type="date" frontLabel="治疗期开始日" /> 
            <FormField path="claims.c1.end_date" type="date" frontLabel="治疗期结束日" /> 
            <FormField path="claims.c1.hospital_name" type="text" placeholder="医院名称" frontLabel="治疗所在医院名称" />
            <FormField path="claims.c1.amount" type="money" frontLabel="累计医疗费" endLabel="元" />
        </div>
        <FormField path="claims.c1.has_evidence" label="医疗费发票、医疗费清单、病历资料" type="radio" options={[{value: 'yes', label: '有'}, {value: 'no', label: '无'}]}/>
      </div>
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "claims.c1") || {};
        return `自 ${formatDateToChinese(data.start_date) || '____'} 至 ${formatDateToChinese(data.end_date) || '____'} 期间在 ${data.hospital_name || '____'} 医院住院(门诊)治疗, 累计发生医疗费 ${formatMoneyWithCN(data.amount)}\n` +
               `医疗费发票、医疗费清单、病历资料: ${generateSelectionText(['有', '无'], data.has_evidence," ")}`;
    }
  },
  {
    type: "custom",
    path: "claims.c2_nursing_fee",
    title: "2. 护理费",
    claimTypes: ['personal_injury', 'both'],
    children: () => (
         <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-4">
                <FormField path="claims.c2.days" type="number" endLabel="天" frontLabel="住院护理天数" /> 
                <FormField path="claims.c2.amount" type="money" endLabel="元" frontLabel="支付护理费"/>
                <FormField path="claims.c2.lost_income_amount" type="money" endLabel="元" frontLabel="或护理人员发生误工费"/> 
                <FormField path="claims.c2.short_term_amount" type="money" endLabel="元" frontLabel="或遵医嘱短期护理发生护理费 "/>
            </div>
            <FormField path="claims.c2.has_evidence" label="住院证明、医嘱等" type="radio" options={[{value: 'yes', label: '有'}, {value: 'no', label: '无'}]}/>
        </div>
    ),
    formatter: (formData) => {
        const data = getValueFromPath(formData, "claims.c2") || {};
        return `住院护理 ${data.days || '____'} 天支付护理费 ${formatMoneyWithCN(data.amount)} (或护理人员发生误工费 ${formatMoneyWithCN(data.lost_income_amount)}), 或遵医嘱短期护理发生护理费 ${formatMoneyWithCN(data.short_term_amount)}\n`+
               `住院证明、医嘱等: ${generateSelectionText(['有', '无'], data.has_evidence," ")}`;
    }
  },
  {
    // --- CORRECTED AS PER YOUR REQUEST ---
    type: "custom",
    path: "claims.c3_nutrition_fee",
    title: "3. 营养费",
    claimTypes: ['personal_injury', 'both'],
    children: () => (
      <div className="flex flex-wrap items-center gap-4">
        <FormField path="claims.c3.amount" type="money" endLabel="元" frontLabel="支付营养费"/>
        <FormField path="claims.c3.has_evidence" label="病历资料:" type="radio" options={[{value:'yes', label:'有'},{value:'no', label:'无'}]} />
      </div>
    ),
    formatter: (data) => {
        const d = getValueFromPath(data, 'claims.c3') || {};
        return `营养费 ${formatMoneyWithCN(d.amount)}\n病历资料: ${generateSelectionText(['有','无'], d.has_evidence)}`;
    }
  },
  {
    // --- CORRECTED AS PER YOUR REQUEST ---
    type: "custom",
    path: "claims.c4_hospital_food_allowance",
    title: "4. 住院伙食补助费",
    claimTypes: ['personal_injury', 'both'],
    children: () => (
        <div className="flex flex-wrap items-center gap-4">
            <FormField path="claims.c4.amount" type="money" endLabel="元" frontLabel="支付住院伙食补助费"/>
            <FormField path="claims.c4.has_evidence" label="病历资料:" type="radio" options={[{value:'yes', label:'有'},{value:'no', label:'无'}]} />
        </div>
    ),
    formatter: (data) => {
        const d = getValueFromPath(data, 'claims.c4') || {};
        return `住院伙食补助费 ${formatMoneyWithCN(d.amount)}\n病历资料: ${generateSelectionText(['有','无'], d.has_evidence)}`;
    }
  },
  {
    type: "custom",
    path: "claims.c5_lost_income_fee",
    title: "5. 误工费",
    claimTypes: ['personal_injury', 'both'],
    children: () => (
        <div className="flex flex-wrap items-center gap-4">
            <FormField path="claims.c5.start_date" type="date" frontLabel="误工开始日期"/> 
            <FormField path="claims.c5.end_date" type="date" frontLabel="误工结束日期"/>
            <FormField path="claims.c5.amount" type="money" endLabel="元" frontLabel="误工费合计"/>
        </div>
    ),
    formatter: (data) => {
        const d = getValueFromPath(data, "claims.c5") || {};
        return `自 ${formatDateToChinese(d.start_date) || '____'} 至 ${formatDateToChinese(d.end_date) || '____'} 误工费 ${formatMoneyWithCN(d.amount)}`
    }
  },
  {
    // --- CORRECTED AS PER YOUR REQUEST ---
    type: "custom",
    path: "claims.c6_transportation_fee",
    title: "6. 交通费",
    claimTypes: ['personal_injury', 'both'],
    children: () => (
      <div className="flex flex-wrap items-center gap-4">
        <FormField path="claims.c6.amount" type="money" endLabel="元" frontLabel="支付交通费" />
        <FormField path="claims.c6.has_evidence" label="交通费凭证:" type="radio" options={[{value:'yes', label:'有'},{value:'no', label:'无'}]} />
      </div>
    ),
    formatter: (data) => {
        const d = getValueFromPath(data, 'claims.c6') || {};
        return `交通费 ${formatMoneyWithCN(d.amount)}\n交通费凭证: ${generateSelectionText(['有','无'], d.has_evidence)}`;
    }
  },
  {
    type: "custom",
    path: "claims.c7_disability_compensation",
    title: "7. 残疾赔偿金(含被扶养人生活费)",
    claimTypes: ['personal_injury', 'both'],
    children: () => (
        <div className="flex flex-wrap items-center gap-4">
            <FormField path="claims.c7.disability_amount" type="money" endLabel="元" frontLabel="支付残疾赔偿金" />
            <FormField path="claims.c7.dependent_amount" type="money" endLabel="元" frontLabel="支付被扶养人生活费"/>
        </div>
    ),
    formatter: (data) => {
        const d = getValueFromPath(data, "claims.c7") || {};
        return `残疾赔偿金 ${formatMoneyWithCN(d.disability_amount)}; 被扶养人生活费 ${formatMoneyWithCN(d.dependent_amount)}`
    }
  },
    {
    // --- CORRECTED AS PER YOUR REQUEST ---
    type: "custom",
    path: "claims.c8_disability_aids_fee",
    title: "8. 残疾辅助器具费",
    claimTypes: ['personal_injury', 'both'],
    children: () => <FormField path="claims.c8.amount" type="money" endLabel="元" frontLabel="支付残疾辅助器具费"/>,
    formatter: data => `残疾辅助器具费 ${formatMoneyWithCN(getValueFromPath(data, 'claims.c8.amount'))}`
  },
  {
    type: "custom",
    path: "claims.c9_death_compensation",
    title: "9. 死亡赔偿金、丧葬费",
    claimTypes: ['personal_injury', 'both'],
    children: () => (
        <div className="flex flex-wrap items-center gap-4">
            <FormField path="claims.c9.death_amount" type="money" endLabel="元" frontLabel="支付死亡赔偿金"/>
            <FormField path="claims.c9.funeral_amount" type="money" endLabel="元" frontLabel="支付丧葬费"/>
        </div>
    ),
    formatter: (data) => {
        const d = getValueFromPath(data, "claims.c9") || {};
        return `死亡赔偿金 ${formatMoneyWithCN(d.death_amount)}, 丧葬费 ${formatMoneyWithCN(d.funeral_amount)}`
    }
  },
  {
    // --- CORRECTED AS PER YOUR REQUEST ---
    type: "custom",
    path: "claims.c10_mental_distress_solatium",
    title: "10. 精神损害抚慰金",
    claimTypes: ['personal_injury', 'both'],
    children: () => <FormField path="claims.c10.amount" type="money" endLabel="元" frontLabel="支付精神损害抚慰金" />,
    formatter: data => `精神损害抚慰金 ${formatMoneyWithCN(getValueFromPath(data, 'claims.c10.amount'))}`
  },
  {
    type: "custom",
    path: "claims.c11_property_loss",
    title: "11. 财产损失",
    claimTypes: ['property_damage', 'both'],
    children: () => (
      <div className="space-y-2">
        <FormField path="claims.c11.vehicle_loss" label="车辆损失" type="money" frontLabel="车辆损失"/>
        <FormField path="claims.c11.interruption_loss" label="停运损失" type="money" frontLabel="停运损失"/>
        <FormField path="claims.c11.other_loss" label="其他损失" type="money" frontLabel="其他损失"/>
      </div>
    ),
    formatter: (data) => {
        const d = getValueFromPath(data, "claims.c11") || {};
        return `车辆损失: ${formatMoneyWithCN(d.vehicle_loss)}\n` +
               `停运损失: ${formatMoneyWithCN(d.interruption_loss)}\n` +
               `其他损失: ${formatMoneyWithCN(d.other_loss)}`;
    }
  },
  {
    type: "optimizationContext",
    path: "claims.c12_other_fees",
    title: "12. 其他费用",
    placeholder: "（诉讼费、鉴定费等）",
    claimTypes: ['personal_injury', 'property_damage', 'both'],
  },
  {
    // --- CORRECTED AS PER YOUR REQUEST ---
    type: "custom",
    path: "claims.c13_total_amount",
    title: "13. 标的总额",
    claimTypes: ['personal_injury', 'property_damage', 'both'],
    children: () => <FormField path="claims.c13.amount" type="money" endLabel="元" />,
    formatter: data => `标的总额 ${formatMoneyWithCN(getValueFromPath(data, 'claims.c13.amount'))}`
  }
];

// --- 事实与理由配置 ---
const factsConfig: QuestionConfig[] = [
  {
    type: "textarea",
    path: "facts.f1_accident_description",
    title: "1. 交通事故发生情况",
  },
  {
    type: "textarea",
    path: "facts.f2_liability_determination",
    title: "2. 交通事故责任认定",
  },
  {
    type: "textarea",
    path: "facts.f3_insurance_coverage",
    title: "3. 机动车投保情况",
  },
  {
    type: "LegalAnalysisField",
    path: "facts.f4_claim_basis",
    title: "4. 请求依据",
    formDataProcessor: processFormDataForPreview,
    withContractAnalysis: false, 
  },
  {
    type: "textarea",
    path: "facts.f5_evidence_list",
    title: "5. 证据清单(可另附页)",
  }
];


// --- Sections and Main Page Component ---
const ClaimsSection: React.FC = () => {
    const { watch } = useFormContext();
    const claimType = watch('claims.claim_type');

    return (
        <FormSectionCard title="诉讼请求">
            <OptimizableTextarea path="claims.fullStatement" label="完整陈述" placeholder="可在此处完整表述您的诉讼请求..."/>

            <div className="my-4 p-4 border rounded-md bg-base-200">
                <label className="label font-semibold">请选择您主张的赔偿类型：</label>
                <FormField path="claims.claim_type" type="radio" options={[
                    {value: 'personal_injury', label: '主张人身损害赔偿 (填写第1-10项)'},
                    {value: 'property_damage', label: '主张财产损失赔偿 (填写第11项)'},
                    {value: 'both', label: '同时主张人身损害和财产损失赔偿 (填写第1-11项)'}
                ]} />
                 <p className="text-sm mt-2">说明：第12项至第13项为共同项，所有类型均需填写。</p>
            </div>
            
            <p className="text-sm my-2">为方便、准确梳理要点，请根据您的选择在下方要素式表格中填写：</p>
            
            {claimType && <QuestionTable config={
                claimsConfig.filter(c => {
                    return !c.claimTypes || c.claimTypes.includes(claimType);
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

export const TrafficAccidentClaimFormPage: React.FC = () => {
    const title = `民事起诉状 (${CASE_TYPE})`;

    const handleFormSubmit = async (data: any) => {
        const final = processFormDataForPreview(data);
        console.log("最终提交的起诉状Payload:", JSON.stringify(final, null, 2));
    };

    const rightSide = <AIChatbotPanel caseType={CASE_TYPE} />;

    return (
        <FormPageLayout
            title={title}
            formId="claim_motor_vehicle_accident"
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
            <FormSectionCard title="诉前保全及鉴定申请">
                <JurisdictionPreservationAppraisalForm path="preservationAndAppraisal" title="诉前保全及鉴定申请" config={FORM_CONFIGS.PRESERVATION_AND_APPRAISAL}/>
            </FormSectionCard>
            <FactsAndReasonsSection />
            <FormSectionCard title="对纠纷解决方式的意愿">
                <MediationForm path="mediation" />
            </FormSectionCard>
        </FormPageLayout>
    );
};

export default TrafficAccidentClaimFormPage;