// src/forms/application/EnforcementSupervisionFormPage.tsx

import React from "react";
import { FormPageLayout } from "../../layouts/FormPageLayout";
import { FormSectionCard } from "../../layouts/FormSectionCard";
import { PartyList } from "../../layouts/PartyList";
import { AgentList } from "../../layouts/AgentList";
import { QuestionTable } from "../../components/claim/QuestionTable";
import type { QuestionConfig } from "../../components/claim/QuestionTable";
import FormField from "../../components/claim/FormField"; // Assuming FormField exists
import {
  formatFormData,
  formatPartiesForDocx,
  formatAgentsForDocx,
  getValueFromPath,
  createDynamicConfigWithChecks
} from "../../utils/formatter";
import { useFormContext } from "react-hook-form";

// 1. 定义文档类型和常量
const DOC_TYPE = "执行监督申请书";


// =======================================================================
//                       Configuration Arrays
// =======================================================================

// 2. "监督事项" - 核心要素配置
const supervisionMattersConfig: QuestionConfig[] = [
  {
    type: "custom",
    path: "supervisionMatters.subjectMatter",
    title: "执行标的",
    children: () => <FormField path="supervisionMatters.subjectMatter.claimsOwnership" type="checkbox" label="主张标的物所有权或其他实体权利" />,
    formatter: (data) => {
      const claimsOwnership = getValueFromPath(data, 'supervisionMatters.subjectMatter.claimsOwnership');
      return `主张标的物所有权或其他实体权利${claimsOwnership ? '☑' : '☐'}`;
    },
  },
  {
    type: "custom",
    path: "supervisionMatters.filing",
    title: "执行立案",
    children: () => {
      const { watch } = useFormContext();
      const otherChecked = watch("supervisionMatters.filing.otherChecked");
      return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FormField path="supervisionMatters.filing.isOverdue" type="checkbox" label="超过法定期限" />
          <FormField path="supervisionMatters.filing.doesNotMeetConditions" type="checkbox" label="不符合立案条件" />
          <div className="flex items-center gap-2">
            <FormField path="supervisionMatters.filing.otherChecked" type="checkbox" label="其他" />
            {otherChecked && <FormField path="supervisionMatters.filing.otherDetail" type="text" placeholder="请说明其他情形" />}
          </div>
        </div>
      );
    },
    formatter: (data) => {
      const filing = getValueFromPath(data, 'supervisionMatters.filing') || {};
      const otherText = filing.otherChecked ? `☑ ${filing.otherDetail || '_____'}` : '☐';
      return `超过法定期限${filing.isOverdue ? '☑' : '☐'} 不符合立案条件${filing.doesNotMeetConditions ? '☑' : '☐'} 其他: ${otherText}`;
    }
  },
  {
    type: "custom",
    path: "supervisionMatters.amount",
    title: "执行标的额",
    children: () => {
      const { watch } = useFormContext();
      const interestOtherChecked = watch("supervisionMatters.amount.interestOtherChecked");
      const lateFeeOtherChecked = watch("supervisionMatters.amount.lateFeeOtherChecked");
      return (
        <div className="flex flex-col gap-2">
          <FormField path="supervisionMatters.amount.debtFulfilled" type="checkbox" label="债务已部分或全部履行" />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>一般债务利息:</span>
            <FormField path="supervisionMatters.amount.interestStandardWrong" type="checkbox" label="计息标准错误" />
            <FormField path="supervisionMatters.amount.interestPeriodWrong" type="checkbox" label="计息期间错误" />
            <div className="flex items-center gap-2">
              <FormField path="supervisionMatters.amount.interestOtherChecked" type="checkbox" label="其他" />
              {interestOtherChecked && <FormField path="supervisionMatters.amount.interestOtherDetail" type="text" placeholder="请说明" />}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>迟延履行利息:</span>
            <FormField path="supervisionMatters.amount.lateFeeStandardWrong" type="checkbox" label="计息标准错误" />
            <FormField path="supervisionMatters.amount.lateFeePeriodWrong" type="checkbox" label="计息期间错误" />
            <div className="flex items-center gap-2">
              <FormField path="supervisionMatters.amount.lateFeeOtherChecked" type="checkbox" label="其他" />
              {lateFeeOtherChecked && <FormField path="supervisionMatters.amount.lateFeeOtherDetail" type="text" placeholder="请说明" />}
            </div>
          </div>
        </div>
      )
    },
    formatter: (data) => {
      const amount = getValueFromPath(data, 'supervisionMatters.amount') || {};
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
    path: "supervisionMatters.seizure",
    title: "查、扣、冻财产",
    children: () => {
      const { watch } = useFormContext();
      const otherChecked = watch("supervisionMatters.seizure.otherChecked");
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <FormField path="supervisionMatters.seizure.isSupervisoryAccount" type="checkbox" label="冻结监管账户(专用账户)" />
            <FormField path="supervisionMatters.seizure.isExcessive" type="checkbox" label="超标的查、扣、冻" />
            <FormField path="supervisionMatters.seizure.isThirdPartyProperty" type="checkbox" label="查、扣、冻案外人财产" />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <FormField path="supervisionMatters.seizure.isMaturedDebtWrong" type="checkbox" label="不存在到期债权或数额错误" />
            <div className="flex items-center gap-2">
              <FormField path="supervisionMatters.seizure.otherChecked" type="checkbox" label="其他" />
              {otherChecked && <FormField path="supervisionMatters.seizure.otherDetail" type="text" placeholder="请说明" />}
            </div>
          </div>
        </div>
      )
    },
    formatter: (data) => {
      const seizure = getValueFromPath(data, 'supervisionMatters.seizure') || {};
      const otherText = seizure.otherChecked ? `☑ ${seizure.otherDetail || '_____'}` : '☐';
      return `冻结监管账户(专用账户)${seizure.isSupervisoryAccount ? '☑' : '☐'} 超标的查、扣、冻${seizure.isExcessive ? '☑' : '☐'} 查、扣、冻案外人财产${seizure.isThirdPartyProperty ? '☑' : '☐'} 不存在到期债权或数额错误${seizure.isMaturedDebtWrong ? '☑' : '☐'} 其他: ${otherText}`;
    }
  },
  {
    type: "custom",
    path: "supervisionMatters.appraisal",
    title: "评估、鉴定、询价、议价",
    children: () => {
      const { watch } = useFormContext();
      const procedureOtherChecked = watch("supervisionMatters.appraisal.procedureOtherChecked");
      const entityOtherChecked = watch("supervisionMatters.appraisal.entityOtherChecked");
      return (
        <div className="flex flex-col gap-2">
          <div>
            <p className="font-semibold">程序违法:</p>
            <div className="pl-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <FormField path="supervisionMatters.appraisal.procedureInfoWrong" type="checkbox" label="财产基本信息错误" />
              <FormField path="supervisionMatters.appraisal.procedureScopeExceeded" type="checkbox" label="超出财产范围或者遗漏财产" />
              <FormField path="supervisionMatters.appraisal.procedureOrgNotQualified" type="checkbox" label="相关机构或者人员不具备评估资质" />
              <div className="flex items-center gap-2">
                <FormField path="supervisionMatters.appraisal.procedureOtherChecked" type="checkbox" label="其他" />
                {procedureOtherChecked && <FormField path="supervisionMatters.appraisal.procedureOtherDetail" type="text" placeholder="请说明" />}
              </div>
            </div>
          </div>
          <div>
            <p className="font-semibold">实体错误:</p>
            <div className="pl-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <FormField path="supervisionMatters.appraisal.entityStandardWrong" type="checkbox" label="参照标准错误" />
              <FormField path="supervisionMatters.appraisal.entityMethodWrong" type="checkbox" label="计算方法错误" />
              <FormField path="supervisionMatters.appraisal.entityResultWrong" type="checkbox" label="结果错误" />
              <div className="flex items-center gap-2">
                <FormField path="supervisionMatters.appraisal.entityOtherChecked" type="checkbox" label="其他" />
                {entityOtherChecked && <FormField path="supervisionMatters.appraisal.entityOtherDetail" type="text" placeholder="请说明" />}
              </div>
            </div>
          </div>
        </div>
      )
    },
    formatter: (data) => {
      const appraisal = getValueFromPath(data, 'supervisionMatters.appraisal') || {};
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
    path: "supervisionMatters.disposal",
    title: "财产处置",
    children: () => {
      const { watch } = useFormContext();
      const otherChecked = watch("supervisionMatters.disposal.otherChecked");
      return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FormField path="supervisionMatters.disposal.isIllegal" type="checkbox" label="处置程序违法" />
          <FormField path="supervisionMatters.disposal.isLowPrice" type="checkbox" label="低价拍卖变卖" />
          <FormField path="supervisionMatters.disposal.isWrongfulSatisfaction" type="checkbox" label="以物抵债错误" />
          <FormField path="supervisionMatters.disposal.isTaxAllocationWrong" type="checkbox" label="税费承担分配错误" />
          <FormField path="supervisionMatters.disposal.isThirdPartyProperty" type="checkbox" label="处置案外人财产" />
          <div className="flex items-center gap-2">
            <FormField path="supervisionMatters.disposal.otherChecked" type="checkbox" label="其他" />
            {otherChecked && <FormField path="supervisionMatters.disposal.otherDetail" type="text" placeholder="请说明" />}
          </div>
        </div>
      )
    },
    formatter: (data) => {
      const disposal = getValueFromPath(data, 'supervisionMatters.disposal') || {};
      const otherText = disposal.otherChecked ? `☑ ${disposal.otherDetail || '_____'}` : '☐';
      return `处置程序违法${disposal.isIllegal ? '☑' : '☐'} 低价拍卖变卖${disposal.isLowPrice ? '☑' : '☐'} 以物抵债错误${disposal.isWrongfulSatisfaction ? '☑' : '☐'} 税费承担分配错误${disposal.isTaxAllocationWrong ? '☑' : '☐'} 处置案外人财产${disposal.isThirdPartyProperty ? '☑' : '☐'} 其他: ${otherText}`;
    }
  },
  {
    type: "custom",
    path: "supervisionMatters.distribution",
    title: "财产分配与发放",
    children: () => {
      const { watch } = useFormContext();
      const otherChecked = watch("supervisionMatters.distribution.otherChecked");
      return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FormField path="supervisionMatters.distribution.isParticipationWrong" type="checkbox" label="准予参与分配错误" />
          <FormField path="supervisionMatters.distribution.isNonParticipationWrong" type="checkbox" label="不准予参与分配错误" />
          <div className="flex items-center gap-2">
            <FormField path="supervisionMatters.distribution.otherChecked" type="checkbox" label="其他" />
            {otherChecked && <FormField path="supervisionMatters.distribution.otherDetail" type="text" placeholder="请说明" />}
          </div>
        </div>
      )
    },
    formatter: (data) => {
      const distribution = getValueFromPath(data, 'supervisionMatters.distribution') || {};
      const otherText = distribution.otherChecked ? `☑ ${distribution.otherDetail || '_____'}` : '☐';
      return `准予参与分配错误${distribution.isParticipationWrong ? '☑' : '☐'} 不准予参与分配错误${distribution.isNonParticipationWrong ? '☑' : '☐'} 其他: ${otherText}`;
    }
  },
  {
    type: "custom",
    path: "supervisionMatters.sanctions",
    title: "惩戒措施",
    children: () => {
      const { watch } = useFormContext();
      const otherChecked = watch("supervisionMatters.sanctions.other");

      return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FormField path="supervisionMatters.sanctions.highConsumption" type="checkbox" label="限制高消费" />
          <FormField path="supervisionMatters.sanctions.travelRestriction" type="checkbox" label="限制出入境" />
          <FormField path="supervisionMatters.sanctions.dishonestList" type="checkbox" label="列入失信名单" />
          <FormField path="supervisionMatters.sanctions.fine" type="checkbox" label="罚款" />
          <FormField path="supervisionMatters.sanctions.detention" type="checkbox" label="拘留" />
          <div className="flex items-center gap-2">
            <FormField path="supervisionMatters.sanctions.other" type="checkbox" label="其他" />
            {otherChecked && <FormField path="supervisionMatters.sanctions.otherDetail" type="text" placeholder="请说明" />}
          </div>
        </div>
      )
    },
    formatter: (data) => {
      const sanctions = getValueFromPath(data, 'supervisionMatters.sanctions') || {};
      const otherText = sanctions.other ? `☑ ${sanctions.otherDetail || '_____'}` : '☐';
      return `限制高消费${sanctions.highConsumption ? '☑' : '☐'} 限制出入境${sanctions.travelRestriction ? '☑' : '☐'} 列入失信名单${sanctions.dishonestList ? '☑' : '☐'} 罚款${sanctions.fine ? '☑' : '☐'} 拘留${sanctions.detention ? '☑' : '☐'} 其他: ${otherText}`;
    }
  },
  {
    type: "custom",
    path: "supervisionMatters.conclusion",
    title: "执行结案",
    children: () => {
      const { watch } = useFormContext();
      const otherChecked = watch("supervisionMatters.conclusion.otherChecked");
      return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FormField path="supervisionMatters.conclusion.isWrongfulTermination" type="checkbox" label="终结本次执行程序错误" />
          <FormField path="supervisionMatters.conclusion.isWrongfulSuspension" type="checkbox" label="中止执行错误" />
          <FormField path="supervisionMatters.conclusion.isWrongfulConclusion" type="checkbox" label="终结执行错误" />
          <FormField path="supervisionMatters.conclusion.isWrongfulCompletion" type="checkbox" label="执行完毕错误" />
          <div className="flex items-center gap-2">
            <FormField path="supervisionMatters.conclusion.otherChecked" type="checkbox" label="其他" />
            {otherChecked && <FormField path="supervisionMatters.conclusion.otherDetail" type="text" placeholder="请说明" />}
          </div>
        </div>
      )
    },
    formatter: (data) => {
      const conclusion = getValueFromPath(data, 'supervisionMatters.conclusion') || {};
      const otherText = conclusion.otherChecked ? `☑ ${conclusion.otherDetail || '_____'}` : '☐';
      return `终结本次执行程序错误${conclusion.isWrongfulTermination ? '☑' : '☐'} 中止执行错误${conclusion.isWrongfulSuspension ? '☑' : '☐'} 终结执行错误${conclusion.isWrongfulConclusion ? '☑' : '☐'} 执行完毕错误${conclusion.isWrongfulCompletion ? '☑' : '☐'} 其他: ${otherText}`;
    }
  },
  {
    type: "optimizationContext",
    path: "supervisionMatters.other",
    title: "其他",

  },
];


// "原文书信息" 配置
const originalDocInfoConfig: QuestionConfig[] = [
  {
    type: "custom",
    path: "originalDocNumber",
    title: "原文书号",
    formatter: (data) => getValueFromPath(data, "originalDocNumber") || "",
  },
  {
    type: "custom",
    path: "serviceDate",
    title: "送达日期",
    formatter: (data) => getValueFromPath(data, "serviceDate") || " 年  月   日",
  },
];

// "监督请求" 配置
const requestConfig: QuestionConfig[] = [
  {
    type: "optimizationContext",
    path: "request.supervisionRequest",
    title: "监督请求",
  },
  {
    type: "optimizationContext",
    path: "request.factsAndReasons",
    title: "事实与理由",
  },
  {
    type: "optimizationContext",
    path: "request.evidenceList",
    title: "证据清单",
  },
];

// =======================================================================
//                       数据处理与格式化
// =======================================================================
const processFormDataForPreview = (data: any) => {
  // 1. 格式化当事人信息
  const applicantBlueprints = [
    {
      path: "applicant_natural",
      roleText: `申请人(自然人)`,
      type: "natural" as const,
      specialType: "执行监督申请书",
    },
    {
      path: "applicant_legal",
      roleText: `申请人(法人/非法人组织)`,
      type: "legal" as const,
      specialType: "执行监督申请书",
    },
  ];
  const otherPartyBlueprints = [
    {
      path: "other_parties_natural",
      roleText: "其他当事人(自然人)",
      type: "natural" as const,
      specialType: "执行监督申请书",
    },
    {
      path: "other_parties_legal",
      roleText: "其他当事人(法人/非法人组织)",
      type: "legal" as const,
      specialType: "执行监督申请书",
    },
  ];

  const partyInfo = [
    ...formatPartiesForDocx(data, applicantBlueprints),
    ...formatAgentsForDocx(data),
    ...formatPartiesForDocx(data, otherPartyBlueprints),
  ];

  const originalDocInfo_formatted = formatFormData("originalDocInfo", data, originalDocInfoConfig);
  const supervisionMatters_formatted = formatFormData("supervisionMatters", data, createDynamicConfigWithChecks(supervisionMattersConfig, data));
  const request_supervision_formatted = formatFormData("request.supervisionRequest", data, [requestConfig[0]]);
  const request_facts_formatted = formatFormData("request.factsAndReasons", data, [requestConfig[1]]);
  const request_evidence_formatted = formatFormData("request.evidenceList", data, [requestConfig[2]]);

  return {
    partyInfo,
    originalDocInfo: originalDocInfo_formatted,
    supervisionMatters: supervisionMatters_formatted,
    request_supervision: request_supervision_formatted,
    request_facts: request_facts_formatted,
    request_evidence: request_evidence_formatted,
    sections: [
      { title: "原文书信息", items: originalDocInfo_formatted },
      { title: "监督事项", items: supervisionMatters_formatted },
      { title: "监督请求", items: request_supervision_formatted },
      { title: "事实与理由", items: request_facts_formatted },
      { title: "证据清单", items: request_evidence_formatted },
    ],
  };
};

// =======================================================================
//                       表单主组件
// =======================================================================
export const EnforcementSupervisionFormPage: React.FC = () => {
  const instructions = `
    <ol>
      <li class="mb-1">1. 当事人、利害关系人对于人民法院作出的执行复议裁定不服,可在裁定书生效后六个月内向上一级人民法院申请执行监督。为了方便您的申请,保护您的合法权利,请如实填写本表。</li>
      <li class="mb-1">2. 执行监督申请时需向人民法院提交的材料:(1)提交证明您身份的材料,如身份证复印件、营业执照复印件、法定代表人身份证明和负责人身份证明等;(2)相关证据材料。</li>
      <li class="mb-1">3. 本表所涉内容系针对执行监督申请专用,有些内容可能与您的具体申请无关,您认为与申请无关的项目可以填“无”或不填;对于本表中勾选项可以在对应项打“√”;您认为另有重要内容需要列明的,可以另附页填写。</li>
      <li class="mb-1">4. 本表word 电子版填写时, 相关栏目可复制粘贴或扩容, 但不得改变要素内容、格式设置。例如, 多原告、多被告或多委托诉讼代理人等情况, 可根据实际情况复制粘贴; 需填写文字较多时，可根据实际对栏目进行扩容等。</li>
    </ol>
    <div class="alert alert-warning shadow-md mt-4 text-warning-content">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      <div>
        <h3 class="font-bold">★ 特别提示 ★</h3>
        <p>当事人、利害关系人、案外人应当遵守诚信原则如实认真填写表格。如果当事人、利害关系人、案外人违反民事诉讼法的规定,虚假诉讼、恶意诉讼、滥用诉权,人民法院将视违法情形依法追究责任。</p>
      </div>
    </div>`;

  return (
    <FormPageLayout
      title={DOC_TYPE}
      formId="application_enforcement_supervision"
      docType="申请书"
      onPreviewData={processFormDataForPreview}
      fixedFormValues={{}}
      instructions={instructions}
    >
      <FormSectionCard title="当事人信息">
        <PartyList
          path="applicant_natural"
          title="自然人"
          partyType="natural"
          specialType={DOC_TYPE}
        />
        <PartyList
          path="applicant_legal"
          title="法人/非法人组织"
          partyType="legal"
          specialType={DOC_TYPE}
        />
      </FormSectionCard>

      <AgentList path="agents" />

      <FormSectionCard title="其他当事人">
        <PartyList
          path="other_parties_natural"
          title="自然人"
          partyType="natural"
          specialType={DOC_TYPE}
        />
        <PartyList
          path="other_parties_legal"
          title="法人/非法人组织"
          partyType="legal"
          specialType={DOC_TYPE}
        />
      </FormSectionCard>

      <FormSectionCard title="原文书信息">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <FormField
            path="originalDocNumber"
            type="text"
            frontLabel="原文书号"
          />
          <FormField path="serviceDate" type="date" frontLabel="送达日期" />
        </div>
      </FormSectionCard>

      <FormSectionCard title="监督事项">
        <QuestionTable config={supervisionMattersConfig} />
      </FormSectionCard>

      <FormSectionCard title="监督请求">
        <FormField path="request.supervisionRequest" type="optimizable-textarea" label="请在此处填写监督请求的具体内容" />
      </FormSectionCard>

      <FormSectionCard title="事实与理由">
        <FormField path="request.factsAndReasons" type="optimizable-textarea" label="请在此处填写支持监督请求的事实和法律依据" />
      </FormSectionCard>

      <FormSectionCard title="证据清单">
        <FormField path="request.evidenceList" type="optimizable-textarea" label="请在此处列明证据清单，说明证据来源、证明对象和内容" />
      </FormSectionCard>
    </FormPageLayout>
  );
};

export default EnforcementSupervisionFormPage;
