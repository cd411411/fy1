// src/forms/application/EnforcementObjectionFormPage.tsx

import React from "react";
import { useFormContext } from "react-hook-form";
import { FormPageLayout } from "../../layouts/FormPageLayout";
import { FormSectionCard } from "../../layouts/FormSectionCard";
import { PartyList } from "../../layouts/PartyList";
import { AgentList } from "../../layouts/AgentList";
import { QuestionTable } from "../../components/claim/QuestionTable";
import type { QuestionConfig } from "../../components/claim/QuestionTable";
import FormField from "../../components/claim/FormField";
import {
  formatFormData,
  formatPartiesForDocx,
  formatAgentsForDocx,
  getValueFromPath,
  createDynamicConfigWithChecks
} from "../../utils/formatter";

const DOC_TYPE = "执行异议申请书";


// '异议事项' 配置 (已按要求重构“其他”项)
const objectionMattersConfig: QuestionConfig[] = [
  {
    type: "custom",
    path: "objectionMatters.subjectMatter",
    title: "执行标的",
    children: () => <FormField path="objectionMatters.subjectMatter.claimsOwnership" type="checkbox" label="主张标的物所有权或其他实体权利" />,
    formatter: (data) => {
      const claimsOwnership = getValueFromPath(data, 'objectionMatters.subjectMatter.claimsOwnership');
      return `主张标的物所有权或其他实体权利${claimsOwnership ? '☑' : '☐'}`;
    },
  },
  {
    type: "custom",
    path: "objectionMatters.filing",
    title: "执行立案",
    children: () => {
      const { watch } = useFormContext();
      const otherChecked = watch("objectionMatters.filing.otherChecked");
      return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FormField path="objectionMatters.filing.isOverdue" type="checkbox" label="超过法定期限" />
          <FormField path="objectionMatters.filing.doesNotMeetConditions" type="checkbox" label="不符合立案条件" />
          <div className="flex items-center gap-2">
            <FormField path="objectionMatters.filing.otherChecked" type="checkbox" label="其他" />
            {otherChecked && <FormField path="objectionMatters.filing.otherDetail" type="text" placeholder="请说明其他情形" />}
          </div>
        </div>
      );
    },
    formatter: (data) => {
      const filing = getValueFromPath(data, 'objectionMatters.filing') || {};
      const otherText = filing.otherChecked ? `☑ ${filing.otherDetail || '_____'}` : '☐';
      return `超过法定期限${filing.isOverdue ? '☑' : '☐'} 不符合立案条件${filing.doesNotMeetConditions ? '☑' : '☐'} 其他: ${otherText}`;
    }
  },
  {
    type: "custom",
    path: "objectionMatters.amount",
    title: "执行标的额",
    children: () => {
      const { watch } = useFormContext();
      const interestOtherChecked = watch("objectionMatters.amount.interestOtherChecked");
      const lateFeeOtherChecked = watch("objectionMatters.amount.lateFeeOtherChecked");
      return (
        <div className="flex flex-col gap-2">
          <FormField path="objectionMatters.amount.debtFulfilled" type="checkbox" label="债务已部分或全部履行" />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>一般债务利息:</span>
            <FormField path="objectionMatters.amount.interestStandardWrong" type="checkbox" label="计息标准错误" />
            <FormField path="objectionMatters.amount.interestPeriodWrong" type="checkbox" label="计息期间错误" />
            <div className="flex items-center gap-2">
              <FormField path="objectionMatters.amount.interestOtherChecked" type="checkbox" label="其他" />
              {interestOtherChecked && <FormField path="objectionMatters.amount.interestOtherDetail" type="text" placeholder="请说明" />}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>迟延履行利息:</span>
            <FormField path="objectionMatters.amount.lateFeeStandardWrong" type="checkbox" label="计息标准错误" />
            <FormField path="objectionMatters.amount.lateFeePeriodWrong" type="checkbox" label="计息期间错误" />
            <div className="flex items-center gap-2">
              <FormField path="objectionMatters.amount.lateFeeOtherChecked" type="checkbox" label="其他" />
              {lateFeeOtherChecked && <FormField path="objectionMatters.amount.lateFeeOtherDetail" type="text" placeholder="请说明" />}
            </div>
          </div>
        </div>
      )
    },
    formatter: (data) => {
      const amount = getValueFromPath(data, 'objectionMatters.amount') || {};
      const interestOtherText = amount.interestOtherChecked ? `☑ ${amount.interestOtherDetail || '_____'}` : '☐';
      const lateFeeOtherText = amount.lateFeeOtherChecked ? `☑ ${amount.lateFeeOtherDetail || '_____'}` : '☐';
      const lines = [
        `债务已部分或全部履行${amount.debtFulfilled ? '☑' : '☐'}`,
        `一般债务利息: 计息标准错误${amount.interestStandardWrong ? '☑' : '☐'} 计息期间错误${amount.interestPeriodWrong ? '☑' : '☐'} 其他: ${interestOtherText}`,
        `迟延履行利息: 计息标准错误${amount.lateFeeStandardWrong ? '☑' : '☐'} 计息期间错误${amount.lateFeePeriodWrong ? '☑' : '☐'} 其他: ${lateFeeOtherText}`
      ];
      return lines.join('\n');
    }
  },
  {
    type: "custom",
    path: "objectionMatters.seizure",
    title: "查、扣、冻财产",
    children: () => {
      const { watch } = useFormContext();
      const otherChecked = watch("objectionMatters.seizure.otherChecked");
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <FormField path="objectionMatters.seizure.isSupervisoryAccount" type="checkbox" label="冻结监管账户(专用账户)" />
            <FormField path="objectionMatters.seizure.isExcessive" type="checkbox" label="超标的查、扣、冻" />
            <FormField path="objectionMatters.seizure.isThirdPartyProperty" type="checkbox" label="查、扣、冻案外人财产" />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <FormField path="objectionMatters.seizure.isMaturedDebtWrong" type="checkbox" label="不存在到期债权或数额错误" />
            <div className="flex items-center gap-2">
              <FormField path="objectionMatters.seizure.otherChecked" type="checkbox" label="其他" />
              {otherChecked && <FormField path="objectionMatters.seizure.otherDetail" type="text" placeholder="请说明" />}
            </div>
          </div>
        </div>
      )
    },
    formatter: (data) => {
      const seizure = getValueFromPath(data, 'objectionMatters.seizure') || {};
      const otherText = seizure.otherChecked ? `☑ ${seizure.otherDetail || '_____'}` : '☐';
      return `冻结监管账户(专用账户)${seizure.isSupervisoryAccount ? '☑' : '☐'} 超标的查、扣、冻${seizure.isExcessive ? '☑' : '☐'} 查、扣、冻案外人财产${seizure.isThirdPartyProperty ? '☑' : '☐'} 不存在到期债权或数额错误${seizure.isMaturedDebtWrong ? '☑' : '☐'} 其他: ${otherText}`;
    }
  },
  {
    type: "custom",
    path: "objectionMatters.appraisal",
    title: "评估、鉴定、询价、议价",
    children: () => {
      const { watch } = useFormContext();
      const procedureOtherChecked = watch("objectionMatters.appraisal.procedureOtherChecked");
      const entityOtherChecked = watch("objectionMatters.appraisal.entityOtherChecked");
      return (
        <div className="flex flex-col gap-2">
          <div>
            <p className="font-semibold">程序违法:</p>
            <div className="pl-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <FormField path="objectionMatters.appraisal.procedureInfoWrong" type="checkbox" label="财产基本信息错误" />
              <FormField path="objectionMatters.appraisal.procedureScopeExceeded" type="checkbox" label="超出财产范围或者遗漏财产" />
              <FormField path="objectionMatters.appraisal.procedureOrgNotQualified" type="checkbox" label="相关机构或者人员不具备评估资质" />
              <div className="flex items-center gap-2">
                <FormField path="objectionMatters.appraisal.procedureOtherChecked" type="checkbox" label="其他" />
                {procedureOtherChecked && <FormField path="objectionMatters.appraisal.procedureOtherDetail" type="text" placeholder="请说明" />}
              </div>
            </div>
          </div>
          <div>
            <p className="font-semibold">实体错误:</p>
            <div className="pl-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <FormField path="objectionMatters.appraisal.entityStandardWrong" type="checkbox" label="参照标准错误" />
              <FormField path="objectionMatters.appraisal.entityMethodWrong" type="checkbox" label="计算方法错误" />
              <FormField path="objectionMatters.appraisal.entityResultWrong" type="checkbox" label="结果错误" />
              <div className="flex items-center gap-2">
                <FormField path="objectionMatters.appraisal.entityOtherChecked" type="checkbox" label="其他" />
                {entityOtherChecked && <FormField path="objectionMatters.appraisal.entityOtherDetail" type="text" placeholder="请说明" />}
              </div>
            </div>
          </div>
        </div>
      )
    },
    formatter: (data) => {
      const appraisal = getValueFromPath(data, 'objectionMatters.appraisal') || {};
      const procedureOtherText = appraisal.procedureOtherChecked ? `☑ ${appraisal.procedureOtherDetail || '_____'}` : '☐';
      const entityOtherText = appraisal.entityOtherChecked ? `☑ ${appraisal.entityOtherDetail || '_____'}` : '☐';
      const lines = [
        `程序违法: 财产基本信息错误${appraisal.procedureInfoWrong ? '☑' : '☐'} 超出财产范围或者遗漏财产${appraisal.procedureScopeExceeded ? '☑' : '☐'} 相关机构或者人员不具备评估资质${appraisal.procedureOrgNotQualified ? '☑' : '☐'} 其他: ${procedureOtherText}`,
        `实体错误: 参照标准错误${appraisal.entityStandardWrong ? '☑' : '☐'} 计算方法错误${appraisal.entityMethodWrong ? '☑' : '☐'} 结果错误${appraisal.entityResultWrong ? '☑' : '☐'} 其他: ${entityOtherText}`
      ];
      return lines.join('\n');
    }
  },
  {
    type: "custom",
    path: "objectionMatters.disposal",
    title: "财产处置",
    children: () => {
      const { watch } = useFormContext();
      const otherChecked = watch("objectionMatters.disposal.otherChecked");
      return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FormField path="objectionMatters.disposal.isIllegal" type="checkbox" label="处置程序违法" />
          <FormField path="objectionMatters.disposal.isLowPrice" type="checkbox" label="低价拍卖变卖" />
          <FormField path="objectionMatters.disposal.isWrongfulSatisfaction" type="checkbox" label="以物抵债错误" />
          <FormField path="objectionMatters.disposal.isTaxAllocationWrong" type="checkbox" label="税费承担分配错误" />
          <FormField path="objectionMatters.disposal.isThirdPartyProperty" type="checkbox" label="处置案外人财产" />
          <div className="flex items-center gap-2">
            <FormField path="objectionMatters.disposal.otherChecked" type="checkbox" label="其他" />
            {otherChecked && <FormField path="objectionMatters.disposal.otherDetail" type="text" placeholder="请说明" />}
          </div>
        </div>
      )
    },
    formatter: (data) => {
      const disposal = getValueFromPath(data, 'objectionMatters.disposal') || {};
      const otherText = disposal.otherChecked ? `☑ ${disposal.otherDetail || '_____'}` : '☐';
      return `处置程序违法${disposal.isIllegal ? '☑' : '☐'} 低价拍卖变卖${disposal.isLowPrice ? '☑' : '☐'} 以物抵债错误${disposal.isWrongfulSatisfaction ? '☑' : '☐'} 税费承担分配错误${disposal.isTaxAllocationWrong ? '☑' : '☐'} 处置案外人财产${disposal.isThirdPartyProperty ? '☑' : '☐'} 其他: ${otherText}`;
    }
  },
  {
    type: "custom",
    path: "objectionMatters.distribution",
    title: "财产分配与发放",
    children: () => {
      const { watch } = useFormContext();
      const otherChecked = watch("objectionMatters.distribution.otherChecked");
      return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FormField path="objectionMatters.distribution.isParticipationWrong" type="checkbox" label="准予参与分配错误" />
          <FormField path="objectionMatters.distribution.isNonParticipationWrong" type="checkbox" label="不准予参与分配错误" />
          <div className="flex items-center gap-2">
            <FormField path="objectionMatters.distribution.otherChecked" type="checkbox" label="其他" />
            {otherChecked && <FormField path="objectionMatters.distribution.otherDetail" type="text" placeholder="请说明" />}
          </div>
        </div>
      )
    },
    formatter: (data) => {
      const distribution = getValueFromPath(data, 'objectionMatters.distribution') || {};
      const otherText = distribution.otherChecked ? `☑ ${distribution.otherDetail || '_____'}` : '☐';
      return `准予参与分配错误${distribution.isParticipationWrong ? '☑' : '☐'} 不准予参与分配错误${distribution.isNonParticipationWrong ? '☑' : '☐'} 其他: ${otherText}`;
    }
  },
  {
    type: "custom",
    path: "objectionMatters.conclusion",
    title: "执行结案",
    children: () => {
      const { watch } = useFormContext();
      const otherChecked = watch("objectionMatters.conclusion.otherChecked");
      return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FormField path="objectionMatters.conclusion.isWrongfulTermination" type="checkbox" label="终结本次执行程序错误" />
          <FormField path="objectionMatters.conclusion.isWrongfulSuspension" type="checkbox" label="中止执行错误" />
          <FormField path="objectionMatters.conclusion.isWrongfulConclusion" type="checkbox" label="终结执行错误" />
          <FormField path="objectionMatters.conclusion.isWrongfulCompletion" type="checkbox" label="执行完毕错误" />
          <div className="flex items-center gap-2">
            <FormField path="objectionMatters.conclusion.otherChecked" type="checkbox" label="其他" />
            {otherChecked && <FormField path="objectionMatters.conclusion.otherDetail" type="text" placeholder="请说明" />}
          </div>
        </div>
      )
    },
    formatter: (data) => {
      const conclusion = getValueFromPath(data, 'objectionMatters.conclusion') || {};
      const otherText = conclusion.otherChecked ? `☑ ${conclusion.otherDetail || '_____'}` : '☐';
      return `终结本次执行程序错误${conclusion.isWrongfulTermination ? '☑' : '☐'} 中止执行错误${conclusion.isWrongfulSuspension ? '☑' : '☐'} 终结执行错误${conclusion.isWrongfulConclusion ? '☑' : '☐'} 执行完毕错误${conclusion.isWrongfulCompletion ? '☑' : '☐'} 其他: ${otherText}`;
    }
  },
  {
    type: "optimizationContext",
    path: "objectionMatters.other",
    title: "其他",

  },
];

const caseInfoConfig: QuestionConfig[] = [
  {
    type: "custom",
    path: "caseInfo",
    title: "执行案号",
    children: () => (
      <FormField
        path="caseInfo.caseNumber"
        type="text"
      />

    ), formatter: (data) => {
      const caseNumber = getValueFromPath(data, "caseInfo.caseNumber");
      return caseNumber
    }
  },
];

// 请求配置
const requestConfig: QuestionConfig[] = [
  {
    type: "optimizationContext",
    path: "request.main",
    title: "异议请求",
  },
  {
    type: "optimizationContext",
    path: "request.factsAndReasons",
    title: "事实与理由（可另附页）",
  },
  {
    type: "optimizationContext",
    path: "request.evidenceList",
    title: "证据清单 (案外人异议必填，可另附页)",
  },
];

// 数据预览处理器
const processFormDataForPreview = (data: any) => {
  const applicantBlueprints = [
    {
      path: "objector_natural",
      roleText: "异议申请人(自然人)",
      type: "natural" as const,
      specialType: "执行异议申请书",
    },
    {
      path: "objector_legal",
      roleText: "异议申请人(法人、非法人组织)",
      type: "legal" as const,
      specialType: "执行异议申请书",
    },
  ];
  const otherPartyBlueprints = [
    {
      path: "other_parties_natural",
      roleText: "其他当事人(自然人)",
      type: "natural" as const,
      specialType: "执行异议申请书",
    },
    {
      path: "other_parties_legal",
      roleText: "其他当事人(法人、非法人组织)",
      type: "legal" as const,
      specialType: "执行异议申请书",
    },
  ];

  const partyInfo = [
    ...formatPartiesForDocx(data, applicantBlueprints),
    ...formatAgentsForDocx(data),
    ...formatPartiesForDocx(data, otherPartyBlueprints),
  ];

  const objectionMatters_formatted = formatFormData(
    "objectionMatters",
    data,
    createDynamicConfigWithChecks(objectionMattersConfig, data) // <-- 使用动态配置
  );

  const case_number_formatted = formatFormData("case_number", data, caseInfoConfig);
  const request_main_formatted = formatFormData("request.main", data, [requestConfig[0]]);
  const request_facts_formatted = formatFormData("request.factsAndReasons", data, [requestConfig[1]]);
  const request_evidence_formatted = formatFormData("request.evidenceList", data, [requestConfig[2]]);

  return {
    partyInfo,
    caseNumber: case_number_formatted,
    objectionMatters: objectionMatters_formatted,
    request_main: request_main_formatted,
    request_facts: request_facts_formatted,
    request_evidence: request_evidence_formatted,
    sections: [
      { title: "执行案号", items: case_number_formatted },
      { title: "异议事项", items: objectionMatters_formatted },
      { title: "异议请求", items: request_main_formatted },
      { title: "事实与理由", items: request_facts_formatted },
      { title: "证据清单", items: request_evidence_formatted },
    ],
  };
};

// 表单主组件
export const EnforcementObjectionFormPage: React.FC = () => {
  const instructions = `
    <ol>
      <li>1. 当事人、利害关系人认为执行行为违反法律规定的，或者案外人对执行标的有异议的，可以向负责执行的人民法院提出书面异议。为了方便您提出执行异议申请，保护您的合法权利，请您如实填写本表。</li>
      <li>2. 申请执行异议时需向人民法院提交以下材料：(1)证明您身份的材料，如身份证复印件、营业执照复印件、法定代表人身份证明或负责人身份证明等；(2)相关证据材料。</li>
      <li>3. 本表所涉内容系针对申请执行异议专用，有些内容可能与您的具体申请无关，您认为与申请无关的项目可以填“无”或不填；对于本表中勾选项可以在对应项打“√”；您认为另有重要内容需要列明的，可以另附页填写。</li>
      <li>4. 本表word 电子版填写时, 相关栏目可复制粘贴或扩容, 但不得改变要素内容、格式设置。例如, 多原告、多被告或多委托诉讼代理人等情况, 可根据实际情况复制粘贴; 需填写文字较多时，可根据实际对栏目进行扩容等。</li>
    </ol>
    <div class="alert alert-warning shadow-md mt-4 text-warning-content">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      <div>
        <h3 class="font-bold">★ 特别提示 ★</h3>
        <p>当事人、利害关系人、案外人应当遵守诚信原则如实认真填写表格。如果当事人、利害关系人、案外人违反民事诉讼法的规定，虚假诉讼、恶意诉讼、滥用诉权，人民法院将视违法情形依法追究责任。</p>
      </div>
    </div>`;

  return (
    <FormPageLayout
      title={DOC_TYPE}
      formId={`application_enforcement_objection`}
      docType="申请书"
      onPreviewData={processFormDataForPreview}
      fixedFormValues={{}}
      instructions={instructions}
    >
      <FormSectionCard title="当事人信息">
        <PartyList
          path="objector_natural"
          title="异议申请人（自然人）"
          partyType="natural"
          specialType="执行异议申请书"
        />
        <PartyList
          path="objector_legal"
          title="异议申请人（法人/非法人组织）"
          partyType="legal"
          specialType="执行异议申请书"
        />
      </FormSectionCard>

      <AgentList path="agents" />

      <FormSectionCard title="其他当事人">
        <PartyList
          path="other_parties_natural"
          title="自然人"
          partyType="natural"
          specialType="执行异议申请书"
        />
        <PartyList
          path="other_parties_legal"
          title="法人/非法人组织"
          partyType="legal"
          specialType="执行异议申请书"
        />
      </FormSectionCard>

      <FormSectionCard title="执行案号">
        <QuestionTable config={caseInfoConfig} />
      </FormSectionCard>

      <FormSectionCard title="异议事项">
        <QuestionTable config={objectionMattersConfig} />
      </FormSectionCard>

      <FormSectionCard title="异议请求">
        <FormField path="request.main" type="optimizable-textarea" label="请在此处填写异议请求的具体内容" />
      </FormSectionCard>

      <FormSectionCard title="事实与理由">
        <FormField path="request.factsAndReasons" type="optimizable-textarea" label="请在此处填写支持异议请求的事实和法律依据..." />
      </FormSectionCard>

      <FormSectionCard title="证据清单">
        <p className="text-sm text-base-content/70 -mt-4 mb-4">
          案外人异议必填
        </p>
        <FormField path="request.evidenceList" type="optimizable-textarea" label="请在此处列明证据清单，说明证据来源、证明对象和内容..." />
      </FormSectionCard>

    </FormPageLayout>
  );
};

export default EnforcementObjectionFormPage;