/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from "react";
import { useFormContext, useFieldArray } from "react-hook-form"; // 引入 useFieldArray
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
import { formatPretrialPreservationForDocx } from "../../utils/formatter";
import { OptimizableTextarea } from "../../components/OptimizableTextarea";
import { PretrialPreservationForm } from "../../components/claim/PretrialPreservationForm";

// --- 在主文件顶部定义类型 ---
interface Item {
  detail: string;
  owner: "plaintiff" | "defendant" | "other";
  otherOwner?: string;
  // 为财产和债务添加一个通用的 type 字段
  type?: string;
  // 新增属性用于处理其他类型的财产明细
  otherTypeDetail?: string;
}

interface ChildCustodyItem {
  name: string;
  custodian: "plaintiff" | "defendant";
}

// 定义完整的表单数据类型以确保类型安全
interface DivorceDisputeFormData {
  claims: {
    c2_community_property: { items: Item[] };
    c3_community_debt: { items: Item[] };
    c4_child_custody: { items: ChildCustodyItem[] };
    [key: string]: any;
  };
  [key: string]: any;
}

// 定义案件类型
const CASE_TYPE = "离婚纠纷";

const processFormDataForPreview = (data: any) => {
  const partyBlueprint_plaintiff = [
    { path: "plaintiffs_natural", roleText: "原告", type: "natural" as const },
  ];
  const partyBlueprint_defendant = [
    { path: "defendants_natural", roleText: "被告", type: "natural" as const },
  ];
  return {
    case_type: data.basicInfo?.caseCause,
    case_number: data.basicInfo?.caseNumber || `起诉状-${Date.now()}`,
    partyInfo: [
      ...formatPartiesForDocx(data, partyBlueprint_plaintiff),
      ...formatAgentsForDocx(data),
      ...formatPartiesForDocx(data, partyBlueprint_defendant),
    ],
    claimItems: formatFormData("claim", data, claimsConfig),
    pretrialPreservation: formatPretrialPreservationForDocx(data),
    factItems: formatFormData("facts", data, factsConfig),
    mediationInfo: formatMediationForDocx(data),
  };
};

// --- 诉讼请求配置 (核心修改在这里) ---
const claimsConfig: QuestionConfig[] = [
  {
    type: "optimizationContext",
    path: "claims.c1_divorce_relation",
    title: "1. 解除婚姻关系",
    detailsLabel: "详细说明为何要解除婚姻关系",
    placeholder: "（具体主张）",
    optimizationContext: "原告对解除婚姻关系的主张描述",
  },
  {
    type: "custom",
    path: "claims.c2_community_property",
    title: "2. 夫妻共同财产",
    children: () => {
      const { watch, control } = useFormContext<DivorceDisputeFormData>();
      const hasProperty = watch("claims.c2_community_property.hasProperty");
      const { fields, append, remove } = useFieldArray({
        name: "claims.c2_community_property.items",
        control,
      });

      return (
        <div>
          <FormField
            path="claims.c2_community_property.hasProperty"
            type="radio"
            options={[
              { value: "yes", label: "有财产" },
              { value: "no", label: "无财产" },
            ]}
          />
          {hasProperty === "yes" && (
            <div className="mt-4 space-y-4">
              {fields.map((field, index) => {
                const basePath = `claims.c2_community_property.items[${index}]`;
                const ownerPath = `${basePath}.owner`;
                const propertyTypePath = `${basePath}.type`;
                const ownerValue = watch(ownerPath as any);
                const propertyType = watch(propertyTypePath as any);

                return (
                  <div
                    key={field.id}
                    className="p-4 border border-base-300 rounded-lg bg-base-100 shadow-sm"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <FormField
                          path={propertyTypePath}
                          label="类型"
                          type="select"
                          options={[
                            { value: "房屋", label: "房屋" },
                            { value: "汽车", label: "汽车" },
                            { value: "存款", label: "存款" },
                            { value: "其他", label: "其他" },
                          ]}
                        />
                        {propertyType === "其他" && (
                          <FormField
                            path={`${basePath}.otherTypeDetail`}
                            label=""
                            type="text"
                            placeholder="请指明财产类型"
                          />
                        )}
                      </div>
                      <FormField
                        path={`${basePath}.detail`}
                        label="明细"
                        type="text"
                        placeholder="请填写具体明细..."
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <span className="text-sm font-medium text-base-content whitespace-nowrap">
                        归属：
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <FormField
                          path={ownerPath}
                          label=""
                          type="radio"
                          options={[
                            { value: "plaintiff", label: "原告" },
                            { value: "defendant", label: "被告" },
                            { value: "other", label: "其他" },
                          ]}
                        />
                      </div>
                      {ownerValue === "other" && (
                        <FormField
                          path={`${basePath}.otherOwner`}
                          label=""
                          type="text"
                          placeholder="请指明其他归属方"
                          className="flex-1 min-w-0"
                        />
                      )}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="btn btn-sm btn-ghost text-error hover:bg-error/10 hover:text-error-content gap-1"
                        title="删除此项"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        删除
                      </button>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  append({
                    type: "房屋",
                    detail: "",
                    owner: "plaintiff",
                    otherOwner: "",
                    otherTypeDetail: "",
                  })
                }
                className="btn btn-sm btn-outline btn-primary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                新增财产
              </button>
            </div>
          )}
        </div>
      );
    },
    formatter: (formData) => {
      const data =
        getValueFromPath(formData, "claims.c2_community_property") || {};
      const radioText = generateSelectionText(
        ["无财产", "有财产"],
        data.hasProperty === "yes" ? "有财产" : "无财产"
      );
      if (data.hasProperty === "yes") {
        const items = data.items || [];
        if (items.length === 0)
          return `${radioText}\n（1）财产明细：   归属：原告□ / 被告□ / 其他□（ ）；`;

        const itemsText = items
          .map((item: any, index: number) => {
            const typeDisplay =
              item.type === "其他"
                ? `其他 (${item.otherTypeDetail || "未填写"})`
                : item.type;
            const ownerText = generateSelectionText(
              ["原告", "被告", "其他"],
              item.owner === "plaintiff"
                ? "原告"
                : item.owner === "defendant"
                ? "被告"
                : "其他",
              " / "
            );
            const otherOwner =
              item.owner === "other" ? `(${item.otherOwner || ""})` : "";
            return `(${index + 1}) ${typeDisplay}明细: ${
              item.detail || ""
            }  归属: ${ownerText} ${otherOwner}`;
          })
          .join("\n");
        return `${radioText}\n${itemsText}`;
      }
      return radioText;
    },
  },

  // --- 3. 夫妻共同债务 (已更新) ---
  {
    type: "custom",
    path: "claims.c3_community_debt",
    title: "3. 夫妻共同债务",
    children: () => {
      const { watch, control } = useFormContext<DivorceDisputeFormData>();
      const hasDebt = watch("claims.c3_community_debt.hasDebt");
      const { fields, append, remove } = useFieldArray({
        name: "claims.c3_community_debt.items",
        control,
      });

      return (
        <div>
          <FormField
            path="claims.c3_community_debt.hasDebt"
            type="radio"
            options={[
              { value: "yes", label: "有债务" },
              { value: "no", label: "无债务" },
            ]}
          />
          {hasDebt === "yes" && (
            <div className="mt-4 space-y-4">
              {fields.map((field, index) => {
                const basePath = `claims.c3_community_debt.items[${index}]`;
                const ownerPath = `${basePath}.owner`;
                const ownerValue = watch(ownerPath as any);

                return (
                  <div
                    key={field.id}
                    className="p-4 border border-base-300 rounded-lg bg-base-100 shadow-sm"
                  >
                    <FormField
                      path={`${basePath}.detail`}
                      label={`债务 ${index + 1} 明细`}
                      type="text"
                      placeholder="请填写具体债务情况..."
                    />

                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <span className="text-sm font-medium text-base-content whitespace-nowrap">
                        承担主体：
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <FormField
                          path={ownerPath}
                          label=""
                          type="radio"
                          options={[
                            { value: "plaintiff", label: "原告" },
                            { value: "defendant", label: "被告" },
                            { value: "other", label: "其他" },
                          ]}
                        />
                      </div>
                      {ownerValue === "other" && (
                        <FormField
                          path={`${basePath}.otherOwner`}
                          label=""
                          type="text"
                          placeholder="请指明其他承担方"
                          className="flex-1 min-w-0"
                        />
                      )}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="btn btn-sm btn-ghost text-error hover:bg-error/10 hover:text-error-content gap-1"
                        title="删除此项"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        删除
                      </button>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  append({ detail: "", owner: "plaintiff", otherOwner: "" })
                }
                className="btn btn-sm btn-outline btn-primary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                新增债务
              </button>
            </div>
          )}
        </div>
      );
    },
    formatter: (formData) => {
      const data = getValueFromPath(formData, "claims.c3_community_debt") || {};
      const radioText = generateSelectionText(
        ["无债务", "有债务"],
        data.hasDebt === "yes" ? "有债务" : "无债务"
      );
      if (data.hasDebt === "yes") {
        const items = data.items || [];
        if (items.length === 0)
          return `${radioText}\n（1）债务1： 承担主体：原告□ / 被告□ / 其他□（ ）；`;

        const itemsText = items
          .map((item: any, index: number) => {
            const ownerText = generateSelectionText(
              ["原告", "被告", "其他"],
              item.owner === "plaintiff"
                ? "原告"
                : item.owner === "defendant"
                ? "被告"
                : "其他",
              " / "
            );
            const otherOwner =
              item.owner === "other" ? `(${item.otherOwner || ""})` : "";
            return `(${index + 1}) 债务${index + 1}: ${
              item.detail || ""
            }  承担主体: ${ownerText} ${otherOwner}`;
          })
          .join("\n");
        return `${radioText}\n${itemsText}`;
      }
      return radioText;
    },
  },

  // --- 4. 子女直接抚养 (已更新) ---
  {
    type: "custom",
    path: "claims.c4_child_custody",
    title: "4. 子女直接抚养",
    children: () => {
      const { watch, control } = useFormContext<DivorceDisputeFormData>();
      const hasIssue = watch("claims.c4_child_custody.hasIssue");
      const { fields, append, remove } = useFieldArray({
        name: "claims.c4_child_custody.items",
        control,
      });

      return (
        <div>
          <FormField
            path="claims.c4_child_custody.hasIssue"
            type="radio"
            options={[
              { value: "yes", label: "有此问题" },
              { value: "no", label: "无此问题" },
            ]}
          />
          {hasIssue === "yes" && (
            <div className="mt-4 space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 border border-base-300 rounded-lg bg-base-100 shadow-sm"
                >
                  <FormField
                    path={`claims.c4_child_custody.items[${index}].name`}
                    label={`子女${index + 1}姓名`}
                    type="text"
                    frontLabel="子女姓名"
                  />

                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <span className="text-sm font-medium text-base-content whitespace-nowrap">
                      归属：
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <FormField
                        path={`claims.c4_child_custody.items[${index}].custodian`}
                        label=""
                        type="radio"
                        options={[
                          { value: "plaintiff", label: "原告" },
                          { value: "defendant", label: "被告" },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="btn btn-sm btn-ghost text-error hover:bg-error/10 hover:text-error-content gap-1"
                      title="删除此项"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      删除
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => append({ name: "", custodian: "plaintiff" })}
                className="btn btn-sm btn-outline btn-primary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                新增子女
              </button>
            </div>
          )}
        </div>
      );
    },
    formatter: (formData) => {
      const data = getValueFromPath(formData, "claims.c4_child_custody") || {};
      const radioText = generateSelectionText(
        ["无此问题", "有此问题"],
        data.hasIssue === "yes" ? "有此问题" : "无此问题"
      );
      if (data.hasIssue === "yes") {
        const items = data.items || [];
        if (items.length === 0)
          return `${radioText}\n 子女1： 归属：原告□ / 被告□`;

        const itemsText = items
          .map((item: any, index: number) => {
            const ownerText = generateSelectionText(
              ["原告", "被告"],
              item.custodian === "plaintiff" ? "原告" : "被告",
              " / "
            );
            return `子女${index + 1} ：${item.name || ""}: 归属: ${ownerText}`;
          })
          .join("\n");
        return `${radioText}\n${itemsText}`;
      }
      return radioText;
    },
  },
  {
    type: "custom",
    path: "claims.c5_child_support",
    title: "5. 子女抚养费",
    children: () => {
      const { watch } = useFormContext();
      const hasIssue = watch("claims.c5_child_support.hasIssue");
      return (
        <div>
          <FormField
            path="claims.c5_child_support.hasIssue"
            type="radio"
            options={[
              { value: "yes", label: "有此问题" },
              { value: "no", label: "无此问题" },
            ]}
          />
          {hasIssue === "yes" && (
            <div className="mt-4 space-y-3">
              <FormField
                path="claims.c5_child_support.payer"
                label="抚养费承担主体"
                type="radio"
                options={[
                  { value: "plaintiff", label: "原告" },
                  { value: "defendant", label: "被告" },
                ]}
              />
              <FormField
                path="claims.c5_child_support.amountDetails"
                label="金额及明细"
                type="optimizable-textarea"
                optimizationContext="关于子女抚养费金额及明细的说明"
              />
              <FormField
                path="claims.c5_child_support.paymentMethod"
                label="支付方式"
                type="optimizable-textarea"
                optimizationContext="关于子女抚养费支付方式的说明"
              />
            </div>
          )}
        </div>
      );
    },
    formatter: (formData) => {
      const data = getValueFromPath(formData, "claims.c5_child_support") || {};
      const radioText = generateSelectionText(
        ["无此问题", "有此问题"],
        data.hasIssue === "yes" ? "有此问题" : "无此问题"
      );
      if (data.hasIssue === "yes") {
        const payerText = `抚养费承担主体: ${generateSelectionText(
          ["原告", "被告"],
          data.payer === "plaintiff" ? "原告" : "被告"
        )}`;
        const amountText = `金额及明细: ${data.amountDetails || ""}`;
        const paymentMethodText = `支付方式: ${data.paymentMethod || ""}`;
        return `${radioText}\n${payerText}\n${amountText}\n${paymentMethodText}`;
      }
      return `${radioText}\n抚养费承担主体：原告□ / 被告□\n金额及明细：\n支付方式：`;
    },
  },
  {
    type: "custom",
    path: "claims.c6_visitation_rights",
    title: "6. 探望权",
    children: () => {
      const { watch } = useFormContext();
      const hasIssue = watch("claims.c6_visitation_rights.hasIssue");
      return (
        <div>
          <FormField
            path="claims.c6_visitation_rights.hasIssue"
            type="radio"
            options={[
              { value: "yes", label: "有此问题" },
              { value: "no", label: "无此问题" },
            ]}
          />
          {hasIssue === "yes" && (
            <div className="mt-4 space-y-3">
              <FormField
                path="claims.c6_visitation_rights.visitor"
                label="探望权行使主体"
                type="radio"
                options={[
                  { value: "plaintiff", label: "原告" },
                  { value: "defendant", label: "被告" },
                ]}
              />
              <FormField
                path="claims.c6_visitation_rights.method"
                label="行使方式"
                type="optimizable-textarea"
                optimizationContext="关于子女探望权行使方式的说明"
              />
            </div>
          )}
        </div>
      );
    },
    formatter: (formData) => {
      const data =
        getValueFromPath(formData, "claims.c6_visitation_rights") || {};
      const radioText = generateSelectionText(
        ["无此问题", "有此问题"],
        data.hasIssue === "yes" ? "有此问题" : "无此问题"
      );
      if (data.hasIssue === "yes") {
        const visitorText = `探望权行使主体: ${generateSelectionText(
          ["原告", "被告"],
          data.visitor === "plaintiff" ? "原告" : "被告"
        )}`;
        const methodText = `行使方式: ${data.method || ""}`;
        return `${radioText}\n${visitorText}\n${methodText}`;
      }
      return `${radioText}\n探望权行使主体：原告□ / 被告□\n行使方式：`;
    },
  },
  {
    type: "custom",
    path: "claims.c7_compensation",
    title: "7. 离婚损害赔偿/经济补偿/经济帮助",
    children: () => {
      const { watch, setValue } = useFormContext<DivorceDisputeFormData>();
      const hasClaim = watch("claims.c7_compensation.hasClaim");

      // 监控三个复选框和对应的金额输入
      const damagesEnabled = watch("claims.c7_compensation.damages.enabled");
      const compensationEnabled = watch(
        "claims.c7_compensation.compensation.enabled"
      );
      const helpEnabled = watch("claims.c7_compensation.help.enabled");

      const damagesAmount =
        watch("claims.c7_compensation.damages.amount" as any) || 0;
      const compensationAmount =
        watch("claims.c7_compensation.compensation.amount" as any) || 0;
      const helpAmount =
        watch("claims.c7_compensation.help.amount" as any) || 0;

      // 自动计算总额
      useEffect(() => {
        const total =
          (damagesEnabled ? Number(damagesAmount) : 0) +
          (compensationEnabled ? Number(compensationAmount) : 0) +
          (helpEnabled ? Number(helpAmount) : 0);
        setValue(
          "claims.c7_compensation.totalAmount" as any,
          total > 0 ? total : ""
        );
      }, [
        damagesEnabled,
        compensationEnabled,
        helpEnabled,
        damagesAmount,
        compensationAmount,
        helpAmount,
        setValue,
      ]);

      return (
        <div>
          <FormField
            path="claims.c7_compensation.hasClaim"
            type="radio"
            options={[
              { value: "yes", label: "有此问题" },
              { value: "no", label: "无此问题" },
            ]}
          />
          {hasClaim === "yes" && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-x-4">
                <FormField
                  path="claims.c7_compensation.damages.enabled"
                  label="离婚损害赔偿"
                  type="checkbox"
                />
                {damagesEnabled && (
                  <FormField
                    path="claims.c7_compensation.damages.amount"
                    label=""
                    type="money"
                    frontLabel="金额"
                  />
                )}
              </div>
              <div className="flex items-center gap-x-4">
                <FormField
                  path="claims.c7_compensation.compensation.enabled"
                  label="离婚经济补偿"
                  type="checkbox"
                />
                {compensationEnabled && (
                  <FormField
                    path="claims.c7_compensation.compensation.amount"
                    label=""
                    type="money"
                    frontLabel="金额"
                  />
                )}
              </div>
              <div className="flex items-center gap-x-4">
                <FormField
                  path="claims.c7_compensation.help.enabled"
                  label="离婚经济帮助"
                  type="checkbox"
                />
                {helpEnabled && (
                  <FormField
                    path="claims.c7_compensation.help.amount"
                    label=""
                    type="money"
                    frontLabel="金额"
                  />
                )}
              </div>
              <FormField
                path="claims.c7_compensation.totalAmount"
                frontLabel="以上总额"
                type="money"
              />
            </div>
          )}
        </div>
      );
    },
    formatter: (formData) => {
      const data = getValueFromPath(formData, "claims.c7_compensation") || {};
      const radioText = generateSelectionText(
        ["无此问题", "有此问题"],
        data.hasClaim === "yes" ? "有此问题" : "无此问题"
      );

      if (data.hasClaim === "yes") {
        const dData = data.damages || {};
        const cData = data.compensation || {};
        const hData = data.help || {};

        const dLine = `离婚损害赔偿${dData.enabled ? "☑" : "☐"}\n金额: ${
          dData.enabled ? formatMoneyWithCN(dData.amount) : ""
        }`;
        const cLine = `离婚经济补偿${cData.enabled ? "☑" : "☐"}\n金额: ${
          cData.enabled ? formatMoneyWithCN(cData.amount) : ""
        }`;
        const hLine = `离婚经济帮助${hData.enabled ? "☑" : "☐"}\n金额: ${
          hData.enabled ? formatMoneyWithCN(hData.amount) : ""
        }`;

        const totalLine = `以上总额: ${formatMoneyWithCN(data.totalAmount)}`;

        return `${radioText}\n${dLine}\n${cLine}\n${hLine}\n${totalLine}`;
      }
      return radioText;
    },
  },
  {
    type: "radio",
    path: "claims.c8_litigation_costs_check",
    title: "8. 是否主张诉讼费用",
    options: [
      { value: "yes", label: "是" },
      { value: "no", label: "否" },
    ],
  },
  {
    type: "optimizationContext",
    path: "claims.c9_other_claims",
    title: "9. 其他请求",
  },
];

// --- 事实与理由配置 ---
const factsConfig: QuestionConfig[] = [
  {
    type: "custom",
    path: "facts.f1_marital_status",
    title: "1. 婚姻关系基本情况",
    children: () => (
      <div className="space-y-3">
        <FormField
          path="facts.f1_marital_status.marriageDate"
          label="结婚时间"
          type="date"
          frontLabel="结婚时间"
        />
        <FormField
          path="facts.f1_marital_status.childrenInfo"
          label="生育子女情况"
          type="optimizable-textarea"
          optimizationContext="原告对生育子女情况的说明"
        />
        <FormField
          path="facts.f1_marital_status.livingSituation"
          label="双方生活情况"
          type="optimizable-textarea"
          optimizationContext="原告对双方生活情况的说明"
        />
        <FormField
          path="facts.f1_marital_status.reasonForDivorce"
          label="离婚事由"
          type="optimizable-textarea"
          optimizationContext="原告对离婚事由的详细说明"
        />
        <FormField
          path="facts.f1_marital_status.previousLitigation"
          label="之前有无提起过离婚诉讼(需说明何时，案号，结果)"
          type="optimizable-textarea"
          optimizationContext="原告对之前提起过离婚诉讼的详细说明"
        />
      </div>
    ),
    formatter: (formData) => {
      const data = getValueFromPath(formData, "facts.f1_marital_status") || {};
      return `结婚时间: ${
        data.marriageDate ? formatDateToChinese(data.marriageDate) : ""
      }\n生育子女情况: ${data.childrenInfo || ""}\n双方生活情况: ${
        data.livingSituation || ""
      }\n离婚事由: ${data.reasonForDivorce || ""}\n之前有无提起过离婚诉讼: ${
        data.previousLitigation || ""
      }`;
    },
  },
  {
    type: "optimizationContext",
    path: "facts.f2_property_status",
    title: "2. 夫妻共同财产情况",
    optimizationContext: "原告对夫妻共同财产情况的详细说明",
  },
  {
    type: "optimizationContext",
    path: "facts.f3_debt_status",
    title: "3. 夫妻共同债务情况",
    optimizationContext: "原告对夫妻共同债务情况的详细说明",
  },
  {
    type: "optimizationContext",
    path: "facts.f4_custody_reasons",
    title: "4. 子女直接抚养情况",
    placeholder: "(子女应归原告或者被告直接抚养的事由)",
    optimizationContext: "原告对子女直接抚养情况的详细说明",
  },
  {
    type: "optimizationContext",
    path: "facts.f5_support_reasons",
    title: "5. 子女抚养费情况",
    placeholder: "(原告或者被告应支付抚养费及相应金额、支付方式的事由)",
    optimizationContext: "原告对子女抚养费情况的详细说明",
  },
  {
    type: "optimizationContext",
    path: "facts.f6_visitation_reasons",
    title: "6. 子女探望权情况",
    placeholder: "(不直接抚养子女一方应否享有探望权以及具体行使方式的事由)",
    optimizationContext: "原告对子女探望权情况的详细说明",
  },
  {
    type: "optimizationContext",
    path: "facts.f7_compensation_reasons",
    title: "7. 赔偿/补偿/经济帮助相关情况",
    placeholder: "(符合离婚损害赔偿、离婚经济补偿或离婚经济帮助的相关事实等)",
    optimizationContext: "原告对赔偿/补偿/经济帮助相关情况的详细说明",
  },
  {
    type: "optimizationContext",
    path: "facts.f8_other",
    title: "8. 其他",
    optimizationContext: "原告对离婚纠纷中其他情况的详细说明",
  },
  {
    type: "LegalAnalysisField",
    path: "facts.f9_claim_basis",
    title: "9. 请求依据",
    placeholder: "（法律及司法解释的规定，要写明具体条文）",
    formDataProcessor: processFormDataForPreview,
    withContractAnalysis: false, // 离婚纠纷无合同依据
  },
  {
    type: "textarea",
    path: "facts.f10_evidence_list",
    title: "10. 证据清单 (可另附页)",
  },
];

// --- Sections and Main Page Component ---
const ClaimsSection: React.FC = () => (
  <FormSectionCard title="诉讼请求">
    <OptimizableTextarea
      path="claims.fullStatement"
      label="完整陈述"
      placeholder="可在此处完整表述您的诉讼请求..."
      rows={3}
      optimizationContext="这是原告关于本离婚纠纷案件的诉讼请求完整陈述。"
    />
    <p className="text-sm my-2">
      为方便、准确梳理要点，相关内容请在下方要素式表格中填写：
    </p>
    <QuestionTable config={claimsConfig} />
  </FormSectionCard>
);

const FactsAndReasonsSection: React.FC = () => (
  <FormSectionCard title="事实与理由">
    <OptimizableTextarea
      path="facts.fullStatement"
      label="完整陈述"
      placeholder="可在此处完整表述纠纷涉及的事实与理由..."
      rows={3}
      optimizationContext="这是一段关于离婚纠纷的案件事实与理由陈述。"
    />
    <p className="text-sm my-2">
      为方便、准确梳理要点，相关内容请在下方要素式表格中填写：
    </p>
    <QuestionTable config={factsConfig} />
  </FormSectionCard>
);

export const DivorceDisputeClaimFormPage: React.FC = () => {
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
      formId="claim_divorce_dispute"
      onSubmit={handleFormSubmit}
      onPreviewData={processFormDataForPreview}
      rightPanel={rightSide}
      docType="起诉状"
      fixedFormValues={{ basicInfo: { caseCause: CASE_TYPE } }}
    >
      <BasicInfoSection case_type={CASE_TYPE} />
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
          path="defendants_natural"
          title="自然人"
          partyType="natural"
        />
      </FormSectionCard>

      <ClaimsSection />
      {/* 离婚案件通常不涉及约定管辖，但可能涉及诉前保全 */}
      <FormSectionCard title="诉前保全">
        <PretrialPreservationForm path="pretrialPreservation" />
      </FormSectionCard>
      <FactsAndReasonsSection />
      <FormSectionCard title="对纠纷解决方式的意愿">
        <MediationForm path="mediation" />
      </FormSectionCard>
    </FormPageLayout>
  );
};

export default DivorceDisputeClaimFormPage;
