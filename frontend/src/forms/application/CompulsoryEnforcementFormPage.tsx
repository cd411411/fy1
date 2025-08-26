// src/forms/enforcement/CompulsoryEnforcementFormPage.tsx

import React from "react";
import { FormPageLayout } from "../../layouts/FormPageLayout";
import { FormSectionCard } from "../../layouts/FormSectionCard";
import { PartyList } from "../../layouts/PartyList";
import { AgentList } from "../../layouts/AgentList";
import { QuestionTable } from "../../components/claim/QuestionTable";
import type { QuestionConfig } from "../../components/claim/QuestionTable";
import FormField from "../../components/claim/FormField"; // (修正) 导入路径
import {
  formatPartiesForDocx,
  formatAgentsForDocx,
  formatDateToChinese,
  getValueFromPath,
  formatMoneyWithCN,
  formatFormData,
} from "../../utils/formatter"; // (新增) 复用当事人和代理人格式化工具
import { Controller, useFormContext } from "react-hook-form";

// 2. "执行依据信息" 配置
const basisConfig: QuestionConfig[] = [
  {
    type: "custom",
    path: "basis.docType", // 基础路径
    title:
      "文书类型\n（注：1. 行政处罚决定、行政处理决定，需先经人民法院裁定准予执行；2. 申请执行债权文书的，需一并提交执行证书）",
    children: () => {
      const { control, watch } = useFormContext();
      const selectedValue = watch("basis.docType.selected");

      const allTypes = {
        civil: {
          label: "民事类",
          types: ["判决书", "裁定书", "调解书", "制裁决定", "支付令"],
        },
        criminal: {
          label: "刑事类",
          types: [
            "刑事附带民事判决书",
            "刑事附带民事裁定书",
            "刑事附带民事调解书",
          ],
        },
        admin: {
          label: "行政类",
          types: ["判决书", "裁定书", "调解书", "行政处罚决定"],
        },
        other_cat: {
          label: "仲裁/公证类",
          types: ["裁决书", "调解书", "赋予强制执行效力的债权文书"],
        },
      };

      return (
        <Controller
          name="basis.docType.selected"
          control={control}
          render={({ field }) => (
            <div className="space-y-3">
              {Object.entries(allTypes).map(([categoryKey, categoryData]) => (
                <div key={categoryKey}>
                  <label className="label py-1">
                    <span className="label-text font-semibold">
                      {categoryData.label}
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {categoryData.types.map((type) => {
                      // === START: 核心修复点 #1 - 创建唯一值 ===
                      const uniqueValue = `${categoryKey}-${type}`;
                      return (
                        <label
                          key={uniqueValue}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            className="radio radio-sm"
                            onChange={() => field.onChange(uniqueValue)} // 存储唯一值
                            checked={field.value === uniqueValue} // 比较唯一值
                          />
                          <span className="label-text">{type}</span>
                        </label>
                      );
                      // === END: 核心修复点 #1 ===
                    })}
                  </div>
                </div>
              ))}
              <div className="mt-4">
                <label className="label py-1">
                  <span className="label-text font-semibold">其他</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    className="radio radio-sm"
                    onChange={() => field.onChange("other")}
                    checked={field.value === "other"}
                    title="其他"
                  />
                  {selectedValue === "other" ? (
                    <FormField
                      path="basis.docType.otherDetail"
                      type="text"
                      placeholder="请填写其他文书类型"
                    />
                  ) : (
                    <span className="text-base-content/50">其他</span>
                  )}
                </div>
              </div>
            </div>
          )}
        />
      );
    },
    formatter: (data: any) => {
      // === START: 核心修复点 #2 - formatter 使用唯一值 ===
      const selected = data?.basis?.docType?.selected; // e.g., "civil-调解书"
      const otherDetail = data?.basis?.docType?.otherDetail || "__________";

      const allTypes = {
        civil: {
          label: "民事类",
          types: ["判决书", "裁定书", "调解书", "制裁决定", "支付令"],
        },
        criminal: {
          label: "刑事类",
          types: [
            "刑事附带民事判决书",
            "刑事附带民事裁定书",
            "刑事附带民事调解书",
          ],
        },
        admin: {
          label: "行政类",
          types: ["判决书", "裁定书", "调解书", "行政处罚决定"],
        },
        other_cat: {
          label: "仲裁/公证类",
          types: ["裁决书", "调解书", "赋予强制执行效力的债权文书"],
        },
      };

      let output = "";
      for (const [categoryKey, categoryData] of Object.entries(allTypes)) {
        output += `${categoryData.label}:\n`;
        output += categoryData.types
          .map((type) => {
            const uniqueValue = `${categoryKey}-${type}`;
            return `  ${type} ${selected === uniqueValue ? "☑" : "☐"}`;
          })
          .join(" ");
        output += "\n";
      }

      output += `其他 ${selected === "other" ? `☑: ${otherDetail}` : "☐"}`;

      return output.trim();
    },
  },
  {
    type: "textarea",
    path: "basis.issuingAuthority",
    title: "执行依据作出机构",
    placeholder: "",
  },
  { type: "textarea", path: "basis.caseCause", title: "案由", placeholder: "" },
  {
    type: "textarea",
    path: "basis.docNumber",
    title: "文书号",
    placeholder: "",
  },
  {
    type: "custom",
    path: "basis.effectiveDate",
    title: "生效日期",
    children: () => (
      <div className="flex items-center">
        <FormField
          type="date"
          path="basis.effectiveDate.detail"
          frontLabel="具体生效日期"
        />
      </div>
    ),
    formatter: (data) => {
      return `${
        formatDateToChinese(
          getValueFromPath(data, "basis.effectiveDate.detail")
        ) || "   年    月    日"
      }`;
    },
  },
  {
    type: "optimizationContext",
    path: "basis.mainJudgment",
    title: "执行依据判项主文",
    placeholder: "",
  },
];

// 3. "申请执行事项" 配置
const executionConfig: QuestionConfig[] = [
  {
    type: "optimizationContext",
    path: "execution.summary",
    title: "申请执行的请求、事实与理由",
    placeholder:
      "(可在此处概括描述申请执行的请求、事实与理由，具体项目请在下方要素中勾选和填写。)",
  },
  {
    type: "custom",
    path: "execution.items",
    title: "具体执行项目",
    children: () => {
      const { watch } = useFormContext();
      const paymentChecked = watch("execution.items.payment.checked");
      const actionChecked = watch("execution.items.action.checked");
      const specificObjectChecked = watch(
        "execution.items.specificObject.checked"
      );
      const otherChecked = watch("execution.items.other.checked");

      return (
        <div className="space-y-3">
          {/* 金钱给付 */}
          <FormField
            path="execution.items.payment.checked"
            type="checkbox"
            label="金钱给付"
          />
          {paymentChecked && (
            <div className="space-y-2">
              <FormField
                path="execution.items.payment.principal"
                type="money"
                frontLabel="本金"
              />
              <FormField
                path="execution.items.payment.interest"
                type="money"
                frontLabel="一般债务利息"
              />
              <FormField
                path="execution.items.payment.lateFee"
                type="money"
                frontLabel="迟延履行利息"
              />
              <FormField
                path="execution.items.payment.otherCosts"
                type="money"
                frontLabel="其他费用"
              />
            </div>
          )}
          {/* 行为执行 */}
          <FormField
            path="execution.items.action.checked"
            type="checkbox"
            label="行为执行"
          />
          {actionChecked && (
            <div className="">
              <FormField
                path="execution.items.action.detail"
                type="textarea"
                placeholder="请详细描述需要执行的具体行为内容"
              />
            </div>
          )}
          {/* 交付特定物 */}
          <FormField
            path="execution.items.specificObject.checked"
            type="checkbox"
            label="交付特定物"
          />
          {specificObjectChecked && (
            <div className="">
              <FormField
                path="execution.items.specificObject.detail"
                type="textarea"
                placeholder="请详细描述需要交付的特定物"
              />
            </div>
          )}
          {/* 其他 */}
          <FormField
            path="execution.items.other.checked"
            type="checkbox"
            label="其他"
          />
          {otherChecked && (
            <div className="">
              <FormField
                path="execution.items.other.detail"
                type="textarea"
                placeholder="请详细描述其他执行事项的具体内容"
              />
            </div>
          )}
        </div>
      );
    },
    formatter: (data) => {
      const items = data?.execution?.items || {};
      const payment = items.payment || {};
      const action = items.action || {};
      const specificObject = items.specificObject || {};
      const other = items.other || {};
      const parts = [
        `金钱给付: ${payment.checked ? "☑" : "☐"}`,
        payment.checked
          ? `  本金: ${formatMoneyWithCN(payment.principal)} `
          : "",
        payment.checked
          ? `  一般债务利息: ${formatMoneyWithCN(payment.interest)}`
          : "",
        payment.checked
          ? `  迟延履行利息: ${formatMoneyWithCN(payment.lateFee)}`
          : "",
        payment.checked
          ? `  其他费用: ${formatMoneyWithCN(payment.otherCosts)}`
          : "",
        `行为执行: ${action.checked ? "☑" : "☐"}`,
        action.checked ? `  具体内容: ${action.detail || ""}` : "",
        `交付特定物: ${specificObject.checked ? "☑" : "☐"}`,
        specificObject.checked
          ? `  具体内容: ${specificObject.detail || ""}`
          : "",
        `其他: ${other.checked ? "☑" : "☐"}`,
        other.checked ? `  具体内容: ${other.detail || ""}` : "",
      ];
      return parts.filter((part) => part !== "").join("\n");
    },
  },
  {
    type: "custom",
    path: "execution.preservation",
    title: "是否有诉前/诉讼保全",
    children: () => {
      const { watch } = useFormContext();
      const existsChecked = watch("execution.preservation.exists");

      return (
        <div className="space-y-2">
          <FormField
            path="execution.preservation.exists"
            type="radio"
            options={[
              { value: "yes", label: "有" },
              { value: "no", label: "无" },
            ]}
          />
          {existsChecked == "yes" && (
            <div className="space-y-2">
              <FormField
                path="execution.preservation.caseNumber"
                type="text"
                frontLabel="保全案号"
              />
              <FormField
                path="execution.preservation.expiryDate"
                type="date"
                frontLabel="保全措施最早到期时间"
              />
            </div>
          )}
        </div>
      );
    },
    formatter: (data) => {
      const pres = data?.execution?.preservation;
      if (pres?.exists === "yes") {
        return `有☑\n  保全案号: ${
          pres.caseNumber || ""
        }\n  保全措施最早到期时间: ${
          formatDateToChinese(pres.expiryDate) || ""
        }\n无☐`;
      }
      return `有☐\n  保全案号: \n  保全措施最早到期时间: \n无☑`;
    },
  },
  {
    type: "optimizationContext",
    path: "execution.propertyClues",
    title: "其他财产线索",
  },
];

// =======================================================================
//                    数据处理与格式化 (Formatter)
// =======================================================================
const processFormDataForPreview = (data: any) => {
  // --- 1. 格式化当事人信息 (复用已有工具) ---
  const applicantBlueprints = [
    {
      path: "applicants_natural",
      roleText: "申请执行人\n(自然人)",
      type: "natural" as const,
    },
    {
      path: "applicants_legal",
      roleText: "申请执行人\n(法人、非法人组织)",
      type: "legal" as const,
    },
  ];
  const respondentBlueprints = [
    {
      path: "respondents_natural",
      roleText: "被执行人\n(自然人)",
      type: "natural" as const,
    },
    {
      path: "respondents_legal",
      roleText: "被执行人\n(法人、非法人组织)",
      type: "legal" as const,
    },
  ];
  const partyInfo = [
    ...formatPartiesForDocx(data, applicantBlueprints),
    ...formatAgentsForDocx(data),
    ...formatPartiesForDocx(data, respondentBlueprints),
  ];

  const formexecutionBasis_formatted = formatFormData(
    "formexecutionBasis",
    data,
    basisConfig
  );
  const executionRequest_formatted = formatFormData(
    "executionRequest",
    data,
    executionConfig
  );

  console.log(
    "formexecutionBasis_formatted: ",
    formexecutionBasis_formatted,
    "executionRequest_formatted: ",
    executionRequest_formatted
  );
  // --- 5. 组合成最终的 context 对象，用于Word模板渲染 ---
  return {
    partyInfo: partyInfo,
    sections: [
      { title: "执行依据信息", items: formexecutionBasis_formatted },
      { title: "申请执行事项", items: executionRequest_formatted },
    ],
    formexecutionBasis: formexecutionBasis_formatted,
    executionRequest: executionRequest_formatted,
  };
};

// =======================================================================
//                       表单主组件
// =======================================================================
export const CompulsoryEnforcementFormPage: React.FC = () => {
  const title = `强制执行申请书`;

  const instructions = `      
      <ol>
        <li>1.发生法律效力的民事、行政判决、裁定，刑事判决、裁定中的财产部分，以及法律规定由人民法院执行的其他法律文书，当事人必须履行。一方拒绝履行的，当事人可以向人民法院申请执行。为了方便您申请执行，保护您的合法权利，请如实填写本表。</li>
        <li>2.申请执行时，除本申请书外，还需向人民法院提供以下材料：（1）证明您身份的材料，如身份证复印件、营业执照复印件、法定代表人身份证明或负责人身份证明等；（2）生效法律文书副本及生效证明；（3）继承人或权利承受人继承或承受权利的证明文件；（4）其他应当提交的文件或证件。</li>
        <li>3.本表所涉内容系针对申请执行专用，有些内容可能与您的具体申请无关，您认为与申请无关的项目可以填"无"或不填；对于本表中勾选项可以在对应项打"√"；您认为另有重要内容需要列明的，可以另附页填写。</li>
        <li>4.本表word 电子版填写时, 相关栏目可复制粘贴或扩容, 但不得改变要素内容、格式设置。例如, 多原告、多被告或多委托诉讼代理人等情况, 可根据实际情况复制粘贴; 需填写文字较多时，可根据实际对栏目进行扩容等。</li>
      </ol>
      <div class="alert alert-warning shadow-md mt-4 text-warning-content">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <div>
          <h3 class="font-bold">★ 特别提示 ★</h3>
          <ol>
          <li>● 诉讼参加人应遵守诚信原则如实认真填写表格。如果申请执行人违反民事诉讼法的规定，基于捏造的事实获取的仲裁裁决或者调解书、公证债权文书、支付令等生效法律文书申请执行，或者通过捏造事实等导致人民法院错误执行的，人民法院将依法追究责任。</li>
          <li>● 被执行人可能存在财产不足或无财产可供执行的情形，执行过程中，申请执行人应当向执行法院积极提供被执行人的财产线索。</li>
          <li>● 多份生效法律文书确定的多个债权人分别对同一被执行人申请执行，且该被执行人为法人的，被执行人财产按照执行法院采取执行措施的先后顺序受偿。当作为被执行人的法人财产不足以清偿全部债务时，各债权人可以向人民法院提出被执行人破产、重整等申请</li>
        </ol>
          </div>
      </div>`;

  return (
    <FormPageLayout
      title={title}
      formId={`application_compulsory_enforcement`}
      docType="申请书"
      onPreviewData={processFormDataForPreview}
      fixedFormValues={{}}
      instructions={instructions}
    >
      <FormSectionCard title="申请执行人">
        <PartyList
          path="applicants_natural"
          title="自然人"
          partyType="natural"
        />
        <div className="divider my-4"></div>
        <PartyList
          path="applicants_legal"
          title="法人/非法人组织"
          partyType="legal"
        />
      </FormSectionCard>

      <AgentList path="agents" />

      <FormSectionCard title="被执行人">
        <PartyList
          path="respondents_natural"
          title="自然人"
          partyType="natural"
        />
        <div className="divider my-4"></div>
        <PartyList
          path="respondents_legal"
          title="法人/非法人组织"
          partyType="legal"
        />
      </FormSectionCard>

      <FormSectionCard title="执行依据信息">
        <QuestionTable config={basisConfig} />
      </FormSectionCard>

      <FormSectionCard title="申请执行事项">
        <p className="text-sm text-base-content/70 -mt-4 mb-4">
          可概括描述申请执行的请求、事实与理由，相关具体内容请在下方要素式表格中填写。
        </p>
        <QuestionTable config={executionConfig} />
      </FormSectionCard>
    </FormPageLayout>
  );
};

export default CompulsoryEnforcementFormPage;
