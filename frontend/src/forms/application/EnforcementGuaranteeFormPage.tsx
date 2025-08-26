// src/forms/application/EnforcementGuaranteeFormPage.tsx

import React from "react";
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
  formatDateToChinese,
  formatMoneyWithCN
} from "../../utils/formatter";

// 1. 定义文档类型
const DOC_TYPE = "执行担保申请书";

// 2. 定义配置数组



const guaranteeRecipientConfig: QuestionConfig[] = [
  {
    type: "custom",
    path: "guaranteeRecipient.info",
    title: "被担保人",
    children: () => (
      <div className="flex flex-col gap-4">
        {/* 身份区域 - 使用 radio_detail 实现单选 */}
        <FormField
          path="guaranteeRecipient.info.identity"
          type="radio_detail"
          frontLabel="身份"
          options={[
            { value: "申请执行人", label: "申请执行人" },
            { value: "被执行人", label: "被执行人" },
            { value: "利害关系人", label: "利害关系人" },
            { value: "案外人", label: "案外人" },
            { value: "其他", label: "其他" },
          ]}
          triggerValue="其他"
          placeholder="请说明其他身份"
        />

        {/* 姓名和电话区域 */}
        <FormField path="guaranteeRecipient.info.name" type="text" frontLabel="姓名/名称" />
        <FormField path="guaranteeRecipient.info.phone" type="text" frontLabel="联系电话" />
      </div>
    ),
    formatter: (formData) => {
      const info = getValueFromPath(formData, "guaranteeRecipient.info") || {};
      const identity = info.identity || {}; // radio_detail 的数据结构为 { choice: string, details?: string }

      const options = ["申请执行人", "被执行人", "利害关系人", "案外人", "其他"];

      // 格式化身份单选项
      const identityString = options.map(opt => {
        const checked = identity.choice === opt ? '☑' : '☐';
        // 如果是"其他"且被选中，则附加上详细信息
        if (opt === '其他' && identity.choice === '其他') {
          return `${opt}${checked} ${identity.details || '_____'}`;
        }
        return `${opt}${checked}`;
      }).join(' ');

      const nameString = `姓名 / 名称: ${info.name || ''}`;
      const phoneString = `联系电话: ${info.phone || ''}`;

      // 组合成最终的预览文本
      return [
        `身份: ${identityString}`,
        nameString,
        phoneString
      ].join('\n');
    },
  },
];


const guaranteeInfoConfig: QuestionConfig[] = [
  {
    type: "custom",
    path: "guaranteeInfo.method",
    title: "担保方式",
    children: () => (
      <FormField
        path="guaranteeInfo.method"
        type="radio_detail"
        options={[
          { value: "财产担保", label: "财产担保" },
          { value: "保证", label: "保证" },
          { value: "其他", label: "其他" },
        ]}
        triggerValue="其他"
        placeholder="请说明其他方式"
      />
    ),
    formatter: (data) => {
      const value = getValueFromPath(data, "guaranteeInfo.method") || {};
      const options = ["财产担保", "保证", "其他"];
      return options.map(opt =>
        `${opt}${value.choice === opt ? `☑ ${opt === '其他' ? value.details || '' : ''}`.trim() : '☐'}`
      ).join(' ');
    },
  },
  {
    type: "custom",
    path: "guaranteeInfo.debt",
    title: "被担保的债权种类及数额",
    children: () => (
      <div className="flex flex-col gap-2">
        <FormField
          path="guaranteeInfo.debt.type"
          type="checkboxGroup"
          options={[
            { value: "金钱给付", label: "金钱给付" },
            { value: "特定物交付", label: "特定物交付" },
            { value: "行为", label: "行为" },
            { value: "其他", label: "其他" },
          ]}
        />
        <FormField
          path="guaranteeInfo.debt.amount"
          type="money"
          frontLabel="被担保的债权数额"
        />
      </div>
    ),
    formatter: (data) => {
      const debt = getValueFromPath(data, "guaranteeInfo.debt") || {};
      const types = debt.type || {};
      const options = ["金钱给付", "特定物交付", "行为", "其他"];
      const typeString = options.map(opt => `${opt}${types[opt] ? '☑' : '☐'}`).join(' ');
      const amountString = debt.amount ? `\n被担保的债权数额: ${formatMoneyWithCN(debt.amount)}` : '______';
      return typeString + amountString;
    },
  },
  {
    type: "optimizationContext",
    path: "guaranteeInfo.scope",
    title: "担保范围",
  },
  {
    type: "custom",
    path: "guaranteeInfo.guaranteePeriod",
    title: "担保期限",
    children: () => (
      <div className="flex  gap-4">
        <FormField path="guaranteeInfo.guaranteePeriod.start" type="date" frontLabel="担保期间起始日" />
        <FormField path="guaranteeInfo.guaranteePeriod.end" type="date" frontLabel="担保期间结束日" />
      </div>
    ),
    formatter: (data) => {
      const periods = getValueFromPath(data, "guaranteeInfo.guaranteePeriod") || {};
      const gp_start = periods.start;
      const gp_end = periods.end;
      const gpString = `${gp_start ? formatDateToChinese(gp_start) : "  年   月  日"} — ${gp_end ? formatDateToChinese(gp_end) : "  年   月  日"}`;

      return `${gpString}`;
    }
  },
  {
    type: "custom",
    path: "guaranteeInfo.stayPeriod",
    title: "申请暂缓执行期限",
    children: () => (
      <div className="flex gap-4">
        <FormField path="guaranteeInfo.stayPeriod.start" type="date" frontLabel="申请暂缓执行期限起始日" />
        <FormField path="guaranteeInfo.stayPeriod.end" type="date" frontLabel="申请暂缓执行期限起始日" />
      </div>
    ),
    formatter: (data) => {
      const periods = getValueFromPath(data, "guaranteeInfo.stayPeriod") || {};
      const sp_start = periods.start;
      const sp_end = periods.end;
      const spString = `${sp_start ? formatDateToChinese(sp_start) : "  年   月  日"} — ${sp_end ? formatDateToChinese(sp_end) : "  年   月  日"}`;

      return `${spString}`;
    }
  },

  {
    type: "custom",
    path: "guaranteeInfo.property",
    title: "担保财产的情况",
    children: () => (
      <div className="flex flex-col gap-4">
        <FormField path="guaranteeInfo.property.name" type="text" frontLabel="名称" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
          <FormField path="guaranteeInfo.property.quantity" type="text" frontLabel="数量" />
          <FormField path="guaranteeInfo.property.quality" type="text" frontLabel="质量" />
          <FormField path="guaranteeInfo.property.condition" type="text" frontLabel="状况" />
        </div>

        <FormField path="guaranteeInfo.property.location" type="text" frontLabel="所在地" />
        <FormField path="guaranteeInfo.property.ownership" type="text" frontLabel="所有权或使用权归属" />
        <FormField path="guaranteeInfo.property.encumbrances" type="text" frontLabel="权利瑕疵（如有抵押、有其他担保、有租赁等）" />
        <FormField path="guaranteeInfo.property.other" type="text" frontLabel="其他" />
      </div>
    ),
    formatter: (data) => {
      const p = getValueFromPath(data, "guaranteeInfo.property") || {};

      const line1 = `名称: ${p.name || '__________'}`;
      const line2 = `数量: ${p.quantity || '______'}    质量: ${p.quality || '______'}    状况: ${p.condition || '______'}`;
      const line3 = `所在地: ${p.location || '__________'}`;
      const line4 = `所有权或使用权归属: ${p.ownership || '__________'}`;
      const line5 = `权利瑕疵（如有抵押、有其他担保、有租赁等）: ${p.encumbrances || '__________'}`;
      const line6 = `其他: ${p.other || '__________'}`;

      return [line1, line2, line3, line4, line5, line6].join('\n');
    }
  },
];

const commitmentConfig: QuestionConfig[] = [
  {
    type: "custom",
    path: "commitment.display",
    title: "承诺（电子版需输入一遍承诺内容，并在承诺人处签名；纸质版需手写一遍承诺内容，并在承诺人处签名。）",
    children: () => (
      <div className="flex flex-col gap-2">
        <div className="p-4 rounded-md bg-base-200/30">
          <p className="font-semibold">
            如被执行人在你院暂缓执行期限届满后仍不履行义务，你院可以直接执行本人/本单位的财产。
          </p>

          <div className="text-right mt-8 mr-20">
            <span>承诺人：</span>
          </div>
        </div>
      </div>
    ),
    formatter: () => {
      const fixedCommitmentText = "如被执行人在你院暂缓执行期限届满后仍不履行义务，你院可以直接执行本人/本单位的财产。";
      const promisorLine = "承诺人:               "; 

      return `${fixedCommitmentText}\n\n\n\n                  ${promisorLine}`;
    }
  },
];


// 3. 创建数据预览处理器
const processFormDataForPreview = (data: any) => {
  // 格式化当事人信息
  const guarantorBlueprints = [
    { path: "guarantor_natural", roleText: `担保人(自然人)`, type: "natural" as const, specialType: DOC_TYPE },
    { path: "guarantor_legal", roleText: `担保人(法人/非法人组织)`, type: "legal" as const, specialType: DOC_TYPE },
  ];
  const partyInfo = [...formatPartiesForDocx(data, guarantorBlueprints), ...formatAgentsForDocx(data)];

  // 格式化表单要素部分
  const guaranteeRecipient_formatted = formatFormData("guaranteeRecipient", data, guaranteeRecipientConfig);
  // 【修改】直接从数据中获取，不再使用 formatFormData
  const caseInfo_formatted = [{ question: "执行案号", answers: getValueFromPath(data, "caseInfo.caseNumber") || "" }];
  const guaranteeInfo_formatted = formatFormData("guaranteeInfo", data, guaranteeInfoConfig);
  const commitment_formatted = formatFormData("commitment", data, commitmentConfig);
   // 【修改】直接从数据中获取，不再使用 formatFormData
  const materialList_formatted = [{ question: "材料清单 (可另附页)", answers: getValueFromPath(data, "materialList.items") || "" }];
  
  // 组合成最终的 context 对象
  return {
    partyInfo,
    guaranteeRecipient: guaranteeRecipient_formatted,
    caseInfo: caseInfo_formatted,
    guaranteeInfo: guaranteeInfo_formatted,
    commitment: commitment_formatted,
    materialList: materialList_formatted,
    sections: [
      { title: "被担保人", items: guaranteeRecipient_formatted },
      { title: "执行案号", items: caseInfo_formatted },
      { title: "担保信息", items: guaranteeInfo_formatted },
      { title: "承诺", items: commitment_formatted },
      { title: "材料清单", items: materialList_formatted },
    ],
  };
};

// 4. 定义表单主组件
export const EnforcementGuaranteeFormPage: React.FC = () => {
  const instructions = `
    <ol class="list-decimal list-inside space-y-2">
      <li>在执行中，被执行人向人民法院提供担保，并经申请执行人同意的，人民法院可以决定暂缓执行及暂缓执行的期限。被执行人逾期仍不履行的，人民法院有权执行被执行人的担保财产或者担保人的财产。</li>
      <li>本表所涉内容系针对被执行人或他人提供执行担保专用，有些内容可能与您的具体申请无关，您认为与申请无关的项目可以填“无”或不填；对于本表中勾选项可以在对应项打“√”；您认为另有重要内容需要列明的，可以另附页填写。</li>
      <li>本表word 电子版填写时, 相关栏目可复制粘贴或扩容, 但不得改变要素内容、格式设置。例如, 多原告、多被告或多委托诉讼代理人等情况, 可根据实际情况复制粘贴; 需填写文字较多时，可根据实际对栏目进行扩容等。</li>
    </ol>
    <div class="alert alert-warning shadow-md mt-4 text-warning-content">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      <div>
        <h3 class="font-bold">★ 特别提示 ★</h3>
        <ul class="list-disc list-inside mt-2 space-y-1">
          <li>被执行人或他人提供执行担保应当遵守诚信原则如实认真填写表格。如果被执行人或他人违反民事诉讼法及相关司法解释的规定，提供虚假担保，人民法院将视违法情形依法追究责任。</li>
          <li>执行担保可以由被执行人提供财产担保，也可以由他人提供财产担保或者保证。公司为被执行人提供执行担保的，应当提交符合公司法规定的董事会或者股东会决议。</li>
        </ul>
      </div>
    </div>`;

  return (
    <FormPageLayout
      title={DOC_TYPE}

      formId={`application_enforcement_guarantee`}
      docType="申请书"
      onPreviewData={processFormDataForPreview}
      fixedFormValues={{}}
      instructions={instructions}
    >
      <FormSectionCard title="担保人">
        <PartyList
          path="guarantor_natural"
          title="自然人"
          partyType="natural"
          specialType={DOC_TYPE}
        />
        <div className="divider my-4"></div>
        <PartyList
          path="guarantor_legal"
          title="法人/非法人组织"
          partyType="legal"
          specialType={DOC_TYPE}
        />
      </FormSectionCard>

      <AgentList path="agents" />

      <FormSectionCard title="被担保人">
        <QuestionTable config={guaranteeRecipientConfig} />
      </FormSectionCard>

      <FormSectionCard title="执行案号">
        <FormField path="caseInfo.caseNumber" type="text" />
      </FormSectionCard>

      <FormSectionCard title="担保信息">
        <QuestionTable config={guaranteeInfoConfig} />
      </FormSectionCard>

      <FormSectionCard title="承诺">
        <QuestionTable config={commitmentConfig} />
      </FormSectionCard>

      <FormSectionCard title="材料清单（可另附页）">
        <FormField path="materialList.items" type="optimizable-textarea" />
      </FormSectionCard>

    </FormPageLayout>
  );
};

export default EnforcementGuaranteeFormPage;