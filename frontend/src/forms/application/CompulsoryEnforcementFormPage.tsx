// src/forms/enforcement/CompulsoryEnforcementFormPage.tsx

import React from "react";
import { FormPageLayout } from "../../layouts/FormPageLayout";
import { FormSectionCard } from "../../layouts/FormSectionCard";
import { PartyList } from "../../layouts/PartyList";
import { AgentList } from "../../layouts/AgentList";
import { QuestionTable } from '../../components/claim/QuestionTable'; // 可复用起诉状的QuestionTable
import type { QuestionConfig } from '../../components/claim/QuestionTable';
import { createEnforcementFormatter } from '../../utils/formatter'; // 假设已创建对应的格式化工具
import { FormField } from "../../components/form/FormField";

// 1. 定义文书类型
const DOC_TYPE = "申请书";
const CASE_TYPE = "强制执行"; // 用于内部标识

// 2. 定义 "执行依据信息" 的配置
const basisConfig: QuestionConfig[] = [
  {
    type: 'custom',
    path: 'basis.docType', // 路径
    title: '文书类型',
    children: () => (
      <div className="flex flex-col space-y-2">
        <FormField type="checkboxGroup" path="basis.docType.civil" label="民事类" options={['判决书', '裁定书', '调解书', '制裁决定', '支付令']} />
        <FormField type="checkboxGroup" path="basis.docType.criminal" label="刑事类" options={['刑事附带民事判决书', '刑事附带民事裁定书', '刑事附带民事调解书']} />
        <FormField type="checkboxGroup" path="basis.docType.admin" label="行政类" options={['判决书', '裁定书', '调解书', '行政处罚决定']} />
        <FormField type="checkboxGroup" path="basis.docType.other" label="仲裁/公证类" options={['裁决书', '调解书', '赋予强制执行效力的债权文书']} />
      </div>
    ),
    formatter: (data) => {
      // 格式化逻辑：将选中的所有文书类型汇总成一个字符串
      const selectedTypes = Object.values(data?.basis?.docType || {}).flat().filter(Boolean).join('、');
      return selectedTypes ? `申请执行的法律文书为：${selectedTypes}。` : '';
    },
  },
  {
    type: 'optimizationContext',
    path: 'basis.issuingAuthority',
    title: '执行依据作出机构',
    placeholder: '例如：贵州省高级人民法院',
    optimizationContext: "强制执行申请书中的执行依据作出机构名称"
  },
  {
    type: 'optimizationContext',
    path: 'basis.caseCause',
    title: '案由',
    placeholder: '例如：借款合同纠纷',
    optimizationContext: "作为执行依据的法律文书所涉案件的案由"
  },
  {
    type: 'text',
    path: 'basis.docNumber',
    title: '文书号',
    placeholder: '例如：(2015)黔高民终字第XX号',
  },
  {
    type: 'date',
    path: 'basis.effectiveDate',
    title: '生效日期',
  },
  {
    type: 'optimizationContext',
    path: 'basis.mainJudgment',
    title: '执行依据判项主文',
    placeholder: '请准确、完整地复制判决书/裁定书/调解书中的判项主文...',
    optimizationContext: '强制执行申请书中的执行依据判项主文，需要清晰表述被执行人的义务。'
  }
];

// 3. 定义 "申请执行事项" 的配置
const itemsConfig: QuestionConfig[] = [
    {
        type: 'custom',
        path: 'items.payment',
        title: '金钱给付',
        children: (path) => (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2 border rounded-md">
                <FormField path={`${path}.principal`} type="money" frontLabel="本金" />
                <FormField path={`${path}.interest`} type="money" frontLabel="一般债务利息" />
                <FormField path={`${path}.lateFee`} type="optimizable-textarea" label="迟延履行利息" placeholder="例如：按照同期银行贷款利率的四倍支付" optimizationContext="关于迟延履行期间债务利息的计算方式表述" />
                <FormField path={`${path}.otherCosts`} type="optimizable-textarea" label="其他费用" placeholder="例如：被执行人承担申请执行费用" optimizationContext="关于执行费、律师费等其他费用的承担表述" />
            </div>
        ),
        formatter: (data) => {
            const p = data?.items?.payment;
            if (!p) return '';
            const parts = [
                p.principal && `请求被执行人支付款项本金 ${p.principal} 元。`,
                p.interest && `支付一般债务利息 ${p.interest} 元。`,
                p.lateFee && `支付迟延履行期间的债务利息（计算方式：${p.lateFee}）。`,
                p.otherCosts && `承担相关费用（${p.otherCosts}）。`
            ].filter(Boolean);
            return parts.join('\n');
        }
    },
    {
        type: 'optimizationContext',
        path: 'items.action',
        title: '行为执行',
        placeholder: '如要求被执行人履行某个特定行为，请在此说明。',
        optimizationContext: '要求被执行人履行特定行为的法律文书表述'
    },
    {
        type: 'optimizationContext',
        path: 'items.specificObject',
        title: '交付特定物',
        placeholder: '如要求被执行人交付某个特定物品，请在此说明。',
        optimizationContext: '要求被执行人交付特定物的法律文书表述'
    },
    {
        type: 'optimizationContext',
        path: 'items.other',
        title: '其他',
        placeholder: '例如：拍卖被执行人名下的XX资产（含采矿权证）',
        optimizationContext: '关于拍卖、变卖被执行人特定资产的申请事项'
    }
];

// 4. 定义 "其他" 部分的配置
const miscConfig: QuestionConfig[] = [
    {
        type: 'radio',
        path: 'misc.preservation.exists',
        title: '是否有诉前/诉讼保全',
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '无' }],
        enableDetails: true,
        detailsLabel: '保全信息',
        detailsPlaceholderTemplate: () => '请填写保全案号和保全措施到期日',
        customDetails: (path) => (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField path={`${path}.caseNumber`} type="text" label="保全案号" placeholder="(2015)筑保字第XX号" />
                <FormField path={`${path}.expiryDate`} type="date" label="保全措施最早到期时间" />
            </div>
        )
    },
    {
        type: 'optimizationContext',
        path: 'misc.propertyClues',
        title: '其他财产线索',
        placeholder: '请提供您所知的被执行人其他可供执行的财产线索，例如：被执行人XX在XX市新购有商铺一间。',
        optimizationContext: '为法院提供被执行人明确、可供执行的财产线索'
    }
];


// 5. 创建数据预览处理器
const processFormDataForPreview = createEnforcementFormatter(basisConfig, itemsConfig, miscConfig);

// 6. 定义表单主组件
export const CompulsoryEnforcementFormPage: React.FC = () => {
  const title = DOC_TYPE;

  return (
    <FormPageLayout
      title={title}
      formId={`enforcement_${CASE_TYPE}`} // 唯一的表单ID
      docType={DOC_TYPE}
      onPreviewData={processFormDataForPreview}
      fixedFormValues={{ basicInfo: { caseCause: CASE_TYPE } }}
    >
      {/* 当事人信息 */}
      <FormSectionCard title="申请执行人">
        <PartyList path="applicants_natural" title="自然人" partyType="natural" />
        <div className="divider my-4"></div>
        <PartyList path="applicants_legal" title="法人/非法人组织" partyType="legal" />
      </FormSectionCard>

      <AgentList path="agents" />

      <FormSectionCard title="被执行人">
        <PartyList path="respondents_natural" title="自然人" partyType="natural" />
        <div className="divider my-4"></div>
        <PartyList path="respondents_legal" title="法人/非法人组织" partyType="legal" />
      </FormSectionCard>

      {/* 执行依据信息 */}
      <FormSectionCard title="执行依据信息">
        <QuestionTable config={basisConfig} />
      </FormSectionCard>

      {/* 申请执行事项 */}
      <FormSectionCard title="申请执行事项">
        <QuestionTable config={itemsConfig} />
      </FormSectionCard>
      
      {/* 其他信息 */}
      <FormSectionCard title="其他信息">
        <QuestionTable config={miscConfig} />
      </FormSectionCard>

    </FormPageLayout>
  );
};

export default CompulsoryEnforcementFormPage;