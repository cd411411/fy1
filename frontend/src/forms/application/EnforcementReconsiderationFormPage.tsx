// src/forms/application/EnforcementReconsiderationFormPage.tsx

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

const DOC_TYPE = "执行复议申请书";


// '复议事项' 配置
const reconsiderationMattersConfig: QuestionConfig[] = [
  {
    type: "custom",
    path: "reconsiderationMatters.subjectMatter",
    title: "执行标的",
    children: () => <FormField path="reconsiderationMatters.subjectMatter.claimsOwnership" type="checkbox" label="主张标的物所有权或其他实体权利" />,
    formatter: (data) => {
      const claimsOwnership = getValueFromPath(data, 'reconsiderationMatters.subjectMatter.claimsOwnership');
      return `主张标的物所有权或其他实体权利${claimsOwnership ? '☑' : '☐'}`;
    },
  },
  {
    type: "custom",
    path: "reconsiderationMatters.filing",
    title: "执行立案",
    children: () => {
      const { watch } = useFormContext();
      const otherChecked = watch("reconsiderationMatters.filing.otherChecked");
      return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FormField path="reconsiderationMatters.filing.isOverdue" type="checkbox" label="超过法定期限" />
          <FormField path="reconsiderationMatters.filing.doesNotMeetConditions" type="checkbox" label="不符合立案条件" />
          <div className="flex items-center gap-2">
            <FormField path="reconsiderationMatters.filing.otherChecked" type="checkbox" label="其他" />
            {otherChecked && <FormField path="reconsiderationMatters.filing.otherDetail" type="text" placeholder="请说明其他情形" />}
          </div>
        </div>
      );
    },
    formatter: (data) => {
      const filing = getValueFromPath(data, 'reconsiderationMatters.filing') || {};
      const otherText = filing.otherChecked ? `☑ ${filing.otherDetail || '_____'}` : '☐';
      return `超过法定期限${filing.isOverdue ? '☑' : '☐'} 不符合立案条件${filing.doesNotMeetConditions ? '☑' : '☐'} 其他: ${otherText}`;
    }
  },
  {
    type: "custom",
    path: "reconsiderationMatters.amount",
    title: "执行标的额",
    children: () => {
      const { watch } = useFormContext();
      const interestOtherChecked = watch("reconsiderationMatters.amount.interestOtherChecked");
      const lateFeeOtherChecked = watch("reconsiderationMatters.amount.lateFeeOtherChecked");
      return (
        <div className="flex flex-col gap-2">
          <FormField path="reconsiderationMatters.amount.debtFulfilled" type="checkbox" label="债务已部分或全部履行" />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>一般债务利息:</span>
            <FormField path="reconsiderationMatters.amount.interestStandardWrong" type="checkbox" label="计息标准错误" />
            <FormField path="reconsiderationMatters.amount.interestPeriodWrong" type="checkbox" label="计息期间错误" />
            <div className="flex items-center gap-2">
              <FormField path="reconsiderationMatters.amount.interestOtherChecked" type="checkbox" label="其他" />
              {interestOtherChecked && <FormField path="reconsiderationMatters.amount.interestOtherDetail" type="text" placeholder="请说明" />}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>迟延履行利息:</span>
            <FormField path="reconsiderationMatters.amount.lateFeeStandardWrong" type="checkbox" label="计息标准错误" />
            <FormField path="reconsiderationMatters.amount.lateFeePeriodWrong" type="checkbox" label="计息期间错误" />
            <div className="flex items-center gap-2">
              <FormField path="reconsiderationMatters.amount.lateFeeOtherChecked" type="checkbox" label="其他" />
              {lateFeeOtherChecked && <FormField path="reconsiderationMatters.amount.lateFeeOtherDetail" type="text" placeholder="请说明" />}
            </div>
          </div>
        </div>
      )
    },
    formatter: (data) => {
      const amount = getValueFromPath(data, 'reconsiderationMatters.amount') || {};
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
    path: "reconsiderationMatters.seizure",
    title: "查、扣、冻财产",
    children: () => {
      const { watch } = useFormContext();
      const otherChecked = watch("reconsiderationMatters.seizure.otherChecked");
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <FormField path="reconsiderationMatters.seizure.isSupervisoryAccount" type="checkbox" label="冻结监管账户(专用账户)" />
            <FormField path="reconsiderationMatters.seizure.isExcessive" type="checkbox" label="超标的查、扣、冻" />
            <FormField path="reconsiderationMatters.seizure.isThirdPartyProperty" type="checkbox" label="查、扣、冻案外人财产" />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <FormField path="reconsiderationMatters.seizure.isMaturedDebtWrong" type="checkbox" label="不存在到期债权或数额错误" />
            <div className="flex items-center gap-2">
              <FormField path="reconsiderationMatters.seizure.otherChecked" type="checkbox" label="其他" />
              {otherChecked && <FormField path="reconsiderationMatters.seizure.otherDetail" type="text" placeholder="请说明" />}
            </div>
          </div>
        </div>
      )
    },
    formatter: (data) => {
      const seizure = getValueFromPath(data, 'reconsiderationMatters.seizure') || {};
      const otherText = seizure.otherChecked ? `☑ ${seizure.otherDetail || '_____'}` : '☐';
      return `冻结监管账户(专用账户)${seizure.isSupervisoryAccount ? '☑' : '☐'} 超标的查、扣、冻${seizure.isExcessive ? '☑' : '☐'} 查、扣、冻案外人财产${seizure.isThirdPartyProperty ? '☑' : '☐'} 不存在到期债权或数额错误${seizure.isMaturedDebtWrong ? '☑' : '☐'} 其他: ${otherText}`;
    }
  },
  {
    type: "custom",
    path: "reconsiderationMatters.appraisal",
    title: "评估、鉴定、询价、议价",
    children: () => {
      const { watch } = useFormContext();
      const procedureOtherChecked = watch("reconsiderationMatters.appraisal.procedureOtherChecked");
      const entityOtherChecked = watch("reconsiderationMatters.appraisal.entityOtherChecked");
      return (
        <div className="flex flex-col gap-2">
          <div>
            <p className="font-semibold">程序违法:</p>
            <div className="pl-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <FormField path="reconsiderationMatters.appraisal.procedureInfoWrong" type="checkbox" label="财产基本信息错误" />
              <FormField path="reconsiderationMatters.appraisal.procedureScopeExceeded" type="checkbox" label="超出财产范围或者遗漏财产" />
              <FormField path="reconsiderationMatters.appraisal.procedureOrgNotQualified" type="checkbox" label="相关机构或者人员不具备评估资质" />
              <div className="flex items-center gap-2">
                <FormField path="reconsiderationMatters.appraisal.procedureOtherChecked" type="checkbox" label="其他" />
                {procedureOtherChecked && <FormField path="reconsiderationMatters.appraisal.procedureOtherDetail" type="text" placeholder="请说明" />}
              </div>
            </div>
          </div>
          <div>
            <p className="font-semibold">实体错误:</p>
            <div className="pl-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <FormField path="reconsiderationMatters.appraisal.entityStandardWrong" type="checkbox" label="参照标准错误" />
              <FormField path="reconsiderationMatters.appraisal.entityMethodWrong" type="checkbox" label="计算方法错误" />
              <FormField path="reconsiderationMatters.appraisal.entityResultWrong" type="checkbox" label="结果错误" />
              <div className="flex items-center gap-2">
                <FormField path="reconsiderationMatters.appraisal.entityOtherChecked" type="checkbox" label="其他" />
                {entityOtherChecked && <FormField path="reconsiderationMatters.appraisal.entityOtherDetail" type="text" placeholder="请说明" />}
              </div>
            </div>
          </div>
        </div>
      )
    },
    formatter: (data) => {
      const appraisal = getValueFromPath(data, 'reconsiderationMatters.appraisal') || {};
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
    path: "reconsiderationMatters.disposal",
    title: "财产处置",
    children: () => {
      const { watch } = useFormContext();
      const otherChecked = watch("reconsiderationMatters.disposal.otherChecked");
      return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FormField path="reconsiderationMatters.disposal.isIllegal" type="checkbox" label="处置程序违法" />
          <FormField path="reconsiderationMatters.disposal.isLowPrice" type="checkbox" label="低价拍卖变卖" />
          <FormField path="reconsiderationMatters.disposal.isWrongfulSatisfaction" type="checkbox" label="以物抵债错误" />
          <FormField path="reconsiderationMatters.disposal.isTaxAllocationWrong" type="checkbox" label="税费承担分配错误" />
          <FormField path="reconsiderationMatters.disposal.isThirdPartyProperty" type="checkbox" label="处置案外人财产" />
          <div className="flex items-center gap-2">
            <FormField path="reconsiderationMatters.disposal.otherChecked" type="checkbox" label="其他" />
            {otherChecked && <FormField path="reconsiderationMatters.disposal.otherDetail" type="text" placeholder="请说明" />}
          </div>
        </div>
      )
    },
    formatter: (data) => {
      const disposal = getValueFromPath(data, 'reconsiderationMatters.disposal') || {};
      const otherText = disposal.otherChecked ? `☑ ${disposal.otherDetail || '_____'}` : '☐';
      return `处置程序违法${disposal.isIllegal ? '☑' : '☐'} 低价拍卖变卖${disposal.isLowPrice ? '☑' : '☐'} 以物抵债错误${disposal.isWrongfulSatisfaction ? '☑' : '☐'} 税费承担分配错误${disposal.isTaxAllocationWrong ? '☑' : '☐'} 处置案外人财产${disposal.isThirdPartyProperty ? '☑' : '☐'} 其他: ${otherText}`;
    }
  },
  {
    type: "custom",
    path: "reconsiderationMatters.distribution",
    title: "财产分配与发放",
    children: () => {
      const { watch } = useFormContext();
      const otherChecked = watch("reconsiderationMatters.distribution.otherChecked");
      return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FormField path="reconsiderationMatters.distribution.isParticipationWrong" type="checkbox" label="准予参与分配错误" />
          <FormField path="reconsiderationMatters.distribution.isNonParticipationWrong" type="checkbox" label="不准予参与分配错误" />
          <div className="flex items-center gap-2">
            <FormField path="reconsiderationMatters.distribution.otherChecked" type="checkbox" label="其他" />
            {otherChecked && <FormField path="reconsiderationMatters.distribution.otherDetail" type="text" placeholder="请说明" />}
          </div>
        </div>
      )
    },
    formatter: (data) => {
      const distribution = getValueFromPath(data, 'reconsiderationMatters.distribution') || {};
      const otherText = distribution.otherChecked ? `☑ ${distribution.otherDetail || '_____'}` : '☐';
      return `准予参与分配错误${distribution.isParticipationWrong ? '☑' : '☐'} 不准予参与分配错误${distribution.isNonParticipationWrong ? '☑' : '☐'} 其他: ${otherText}`;
    }
  },
  {
    type: "custom",
    path: "reconsiderationMatters.sanctions",
    title: "惩戒措施",
    children: () => {
      const { watch } = useFormContext();
      const otherChecked = watch("reconsiderationMatters.sanctions.other");

      return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FormField path="reconsiderationMatters.sanctions.highConsumption" type="checkbox" label="限制高消费" />
          <FormField path="reconsiderationMatters.sanctions.travelRestriction" type="checkbox" label="限制出入境" />
          <FormField path="reconsiderationMatters.sanctions.dishonestList" type="checkbox" label="列入失信名单" />
          <FormField path="reconsiderationMatters.sanctions.fine" type="checkbox" label="罚款" />
          <FormField path="reconsiderationMatters.sanctions.detention" type="checkbox" label="拘留" />
          <div className="flex items-center gap-2">
            <FormField path="reconsiderationMatters.sanctions.other" type="checkbox" label="其他" />
            {otherChecked && <FormField path="reconsiderationMatters.sanctions.otherDetail" type="text" placeholder="请说明" />}
          </div>
        </div>
      )
    },
    formatter: (data) => {
      const sanctions = getValueFromPath(data, 'reconsiderationMatters.sanctions') || {};
      const otherText = sanctions.other ? `☑ ${sanctions.otherDetail || '_____'}` : '☐';
      return `限制高消费${sanctions.highConsumption ? '☑' : '☐'} 限制出入境${sanctions.travelRestriction ? '☑' : '☐'} 列入失信名单${sanctions.dishonestList ? '☑' : '☐'} 罚款${sanctions.fine ? '☑' : '☐'} 拘留${sanctions.detention ? '☑' : '☐'} 其他: ${otherText}`;
    }
  },
  {
    type: "custom",
    path: "reconsiderationMatters.conclusion",
    title: "执行结案",
    children: () => {
      const { watch } = useFormContext();
      const otherChecked = watch("reconsiderationMatters.conclusion.otherChecked");
      return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FormField path="reconsiderationMatters.conclusion.isWrongfulTermination" type="checkbox" label="终结本次执行程序错误" />
          <FormField path="reconsiderationMatters.conclusion.isWrongfulSuspension" type="checkbox" label="中止执行错误" />
          <FormField path="reconsiderationMatters.conclusion.isWrongfulConclusion" type="checkbox" label="终结执行错误" />
          <FormField path="reconsiderationMatters.conclusion.isWrongfulCompletion" type="checkbox" label="执行完毕错误" />
          <div className="flex items-center gap-2">
            <FormField path="reconsiderationMatters.conclusion.otherChecked" type="checkbox" label="其他" />
            {otherChecked && <FormField path="reconsiderationMatters.conclusion.otherDetail" type="text" placeholder="请说明" />}
          </div>
        </div>
      )
    },
    formatter: (data) => {
      const conclusion = getValueFromPath(data, 'reconsiderationMatters.conclusion') || {};
      const otherText = conclusion.otherChecked ? `☑ ${conclusion.otherDetail || '_____'}` : '☐';
      return `终结本次执行程序错误${conclusion.isWrongfulTermination ? '☑' : '☐'} 中止执行错误${conclusion.isWrongfulSuspension ? '☑' : '☐'} 终结执行错误${conclusion.isWrongfulConclusion ? '☑' : '☐'} 执行完毕错误${conclusion.isWrongfulCompletion ? '☑' : '☐'} 其他: ${otherText}`;
    }
  },
  {
    type: "optimizationContext",
    path: "reconsiderationMatters.other",
    title: "其他",
  },
];


// 请求配置
const requestConfig: QuestionConfig[] = [
  {
    type: "optimizationContext",
    path: "request.main",
    title: "复议请求",
  },
  {
    type: "optimizationContext",
    path: "request.factsAndReasons",
    title: "事实与理由（可另附页）",
  },
  {
    type: "optimizationContext",
    path: "request.evidenceList",
    title: "证据清单 (可另附页)",
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

// 数据预览处理器
const processFormDataForPreview = (data: any) => {
  const applicantBlueprints = [
    {
      path: "reconsideration_applicant_natural",
      roleText: "复议申请人(自然人)",
      type: "natural" as const,
      specialType: DOC_TYPE,
    },
    {
      path: "reconsideration_applicant_legal",
      roleText: "复议申请人(法人、非法人组织)",
      type: "legal" as const,
      specialType: DOC_TYPE,
    },
  ];
  const otherPartyBlueprints = [
    {
      path: "other_parties_natural",
      roleText: "其他当事人(自然人)",
      type: "natural" as const,
      specialType: DOC_TYPE,
    },
    {
      path: "other_parties_legal",
      roleText: "其他当事人(法人、非法人组织)",
      type: "legal" as const,
      specialType: DOC_TYPE,
    },
  ];

  const partyInfo = [
    ...formatPartiesForDocx(data, applicantBlueprints),
    ...formatAgentsForDocx(data),
    ...formatPartiesForDocx(data, otherPartyBlueprints),
  ];

  const reconsiderationMatters_formatted = formatFormData(
    "reconsiderationMatters",
    data,
    createDynamicConfigWithChecks(reconsiderationMattersConfig, data)
  );

  const originalDocInfo_formatted = formatFormData("originalDocInfo", data, originalDocInfoConfig);
  const request_main_formatted = formatFormData("request.main", data, [requestConfig[0]]);
  const request_facts_formatted = formatFormData("request.factsAndReasons", data, [requestConfig[1]]);
  const request_evidence_formatted = formatFormData("request.evidenceList", data, [requestConfig[2]]);

  return {
    partyInfo,
    originalDocInfo: originalDocInfo_formatted,
    reconsiderationMatters: reconsiderationMatters_formatted,
    request_main: request_main_formatted,
    request_facts: request_facts_formatted,
    request_evidence: request_evidence_formatted,
    sections: [
      { title: "执行案号", items: originalDocInfo_formatted },
      { title: "复议事项", items: reconsiderationMatters_formatted },
      { title: "复议请求", items: request_main_formatted },
      { title: "事实与理由", items: request_facts_formatted },
      { title: "证据清单", items: request_evidence_formatted },
    ],
  };
};

// 表单主组件
export const EnforcementReconsiderationFormPage: React.FC = () => {
  const instructions = `
    <ol>
      <li>1. 当事人、利害关系人对不予受理或者驳回申请裁定不服的，可以自裁定送达之日起十日内向上一级人民法院申请复议。为了方便您提出执行复议申请，保护您的合法权利，请您如实填写本表。</li>
      <li>2. 申请执行复议时需向人民法院提交以下材料：（1）提交证明您身份的材料，如身份证复印件、营业执照复印件、法定代表人身份证明和负责人身份证明等；（2）相关证据材料。</li>
      <li>3. 本表所涉内容系针对申请执行复议专用，有些内容可能与您的具体申请无关，您认为与申请无关的项目可以填“无”或不填；对于本表中勾选项可以在对应项打“√”；您认为另有重要内容需要列明的，可以另附页填写。</li>
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
      formId={`application_enforcement_reconsideration`}
      docType="申请书"
      onPreviewData={processFormDataForPreview}
      fixedFormValues={{}}
      instructions={instructions}
    >
      <FormSectionCard title="当事人信息">
        <PartyList
          path="reconsideration_applicant_natural"
          title="复议申请人（自然人）"
          partyType="natural"
          specialType={DOC_TYPE}
        />
        <PartyList
          path="reconsideration_applicant_legal"
          title="复议申请人（法人/非法人组织）"
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

      <FormSectionCard title="复议事项">
        <QuestionTable config={reconsiderationMattersConfig} />
      </FormSectionCard>

      <FormSectionCard title="复议请求">
        <FormField path="request.main" type="optimizable-textarea" label="请在此处填写复议请求的具体内容" />
      </FormSectionCard>

      <FormSectionCard title="事实与理由">
        <FormField path="request.factsAndReasons" type="optimizable-textarea" label="请在此处填写支持复议请求的事实和法律依据..." />
      </FormSectionCard>

      <FormSectionCard title="证据清单">
        <FormField path="request.evidenceList" type="optimizable-textarea" label="请在此处列明证据清单，说明证据来源、证明对象和内容..." />
      </FormSectionCard>

    </FormPageLayout>
  );
};

export default EnforcementReconsiderationFormPage;