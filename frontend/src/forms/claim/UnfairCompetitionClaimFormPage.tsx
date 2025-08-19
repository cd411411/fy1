/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { FormPageLayout } from "../../layouts/FormPageLayout";
import { FormSectionCard } from "../../layouts/FormSectionCard";
import { PartyList } from "../../layouts/PartyList";
import { AgentList } from "../../layouts/AgentList";
import { MediationForm } from "../../components/MediationForm";
import { RelatedCaseInfoForm } from "../../components/RelatedCaseInfoForm";
import { BasicInfoSection } from "../../components/BasicInfoSection";
import {
  formatPartiesForDocx,
  formatAgentsForDocx,
  formatMediationForDocx,
  formatRelatedCaseForDocx,
} from "../../utils/formatter";
import type {
  QuestionListItem
} from "../../interfaces/document.types";
import { AIChatbotPanel } from "../../components/AIChatbotPanel";
import { generateAndDownloadDocx } from "../../api/documentApi";
import { OptimizableTextarea } from '../../components/OptimizableTextarea';


const ClaimsSection: React.FC = () => {
  const { register, watch, control } = useFormContext();

  const claimStopInfringement = watch("claims.c1_check");
  const claimCompensateLoss = watch("claims.c2_check");
  const claimPayExpenses = watch("claims.c3_check");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "claims.c3_expenses_list",
  });

  return (
    <FormSectionCard title="诉讼请求">
      {/* 1. 顶部的完整陈述 Textarea */}
      <OptimizableTextarea 
        path="claims.fullStatement"
        label="完整陈述"
        placeholder="可在此处完整表述您的诉讼请求..."
        rows={3}
        optimizationContext="这是原告关于本不正当竞争纠纷案件的诉讼请求完整陈述。"/>

      <p className="text-sm text-neutral-500 my-2">
        为方便、准确梳理要点，请在下方要素式表格中填写：
      </p>

      <table className="table w-full border">
        <tbody>
          {/* 1. 停止侵害 (保持不变) */}
          <tr className="hover">
            <th className="w-1/4 align-top bg-base-200/50">1. 停止侵害</th>
            <td>
              <div className="flex gap-4">
                <label className="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    value="yes"
                    {...register("claims.c1_check")}
                    className="radio radio-sm"
                  />
                  有
                </label>
                <label className="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    value="no"
                    {...register("claims.c1_check")}
                    className="radio radio-sm"
                  />
                  无
                </label>
              </div>
              {claimStopInfringement === "yes" && (
                <OptimizableTextarea
                  path="claims.c1_details"
                  label=""
                  placeholder="内容：具体陈述侵害对象、侵害行为..."
                  rows={2}
                  optimizationContext="原告关于停止侵害的具体请求和说明"
                />
              )}
            </td>
          </tr>

          {/* 2. 赔偿经济损失 (逻辑重构) */}
          <tr className="hover">
            <th className="w-1/4 align-top bg-base-200/50">2. 赔偿经济损失</th>
            <td>
              <div className="flex gap-4">
                <label className="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    value="yes"
                    {...register("claims.c2_check")}
                    className="radio radio-sm"
                  />
                  有
                </label>
                <label className="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    value="no"
                    {...register("claims.c2_check")}
                    className="radio radio-sm"
                  />
                  无
                </label>
              </div>
              {claimCompensateLoss === "yes" && (
                <div className="space-y-3 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="label-text flex-shrink-0">
                      经济损失共计
                    </span>
                    <input
                      type="number"
                      {...register("claims.c2_total_amount")}
                      className="input input-bordered input-sm w-full"
                      placeholder="元"
                    />
                  </div>
                  <div className="pl-4 border-l-2 space-y-2">
                    <p className="text-sm font-semibold">损失构成 (可多选):</p>
                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-2">
                        <input
                          type="checkbox"
                          {...register("claims.c2_has_plaintiff_loss")}
                          className="checkbox checkbox-sm"
                        />
                        <span className="label-text text-sm">原告损失</span>
                        <input
                          type="text"
                          {...register("claims.c2_plaintiff_loss_amount")}
                          className="input input-bordered input-xs ml-2"
                          placeholder="金额"
                        />
                      </label>
                    </div>
                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-2">
                        <input
                          type="checkbox"
                          {...register("claims.c2_has_defendant_profit")}
                          className="checkbox checkbox-sm"
                        />
                        <span className="label-text text-sm">被告获利</span>
                        <input
                          type="text"
                          {...register("claims.c2_defendant_profit_amount")}
                          className="input input-bordered input-xs ml-2"
                          placeholder="金额"
                        />
                      </label>
                    </div>
                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-2">
                        <input
                          type="checkbox"
                          {...register("claims.c2_has_legal_compensation")}
                          className="checkbox checkbox-sm"
                        />
                        <span className="label-text text-sm">法定赔偿</span>
                        <input
                          type="text"
                          {...register("claims.c2_legal_compensation_amount")}
                          className="input input-bordered input-xs ml-2"
                          placeholder="金额"
                        />
                      </label>
                    </div>
                  </div>
                  <textarea
                    {...register("claims.c2_details")}
                    className="textarea textarea-bordered w-full mt-1"
                    placeholder="计算依据或参考因素..."
                  ></textarea>
                </div>
              )}
            </td>
          </tr>

          {/* 3. 支付合理费用 (保持不变) */}
          <tr className="hover">
            <th className="w-1/4 align-top bg-base-200/50">3. 支付合理费用</th>
            <td>
              <div className="flex gap-4">
                <label className="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    value="yes"
                    {...register("claims.c3_check")}
                    className="radio radio-sm"
                  />
                  有
                </label>
                <label className="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    value="no"
                    {...register("claims.c3_check")}
                    className="radio radio-sm"
                  />
                  无
                </label>
              </div>
              {claimPayExpenses === "yes" && (
                <div className="mt-2 space-y-2">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-12 gap-2 items-center"
                    >
                      <select
                        {...register(`claims.c3_expenses_list.${index}.type`)}
                        className="select select-bordered select-sm col-span-3"
                      >
                        <option>律师费</option>
                        <option>公证费</option>
                        <option>差旅费</option>
                        <option>其他</option>
                      </select>
                      <input
                        type="number"
                        {...register(`claims.c3_expenses_list.${index}.amount`)}
                        className="input input-bordered input-sm col-span-3"
                        placeholder="元"
                      />
                      <div className="col-span-5 flex items-center gap-2">
                        <span className="text-sm">凭证:</span>
                        <label className="label cursor-pointer gap-1">
                          <input
                            type="radio"
                            value="yes"
                            {...register(
                              `claims.c3_expenses_list.${index}.receipt`
                            )}
                            className="radio radio-xs"
                          />
                          有
                        </label>
                        <label className="label cursor-pointer gap-1">
                          <input
                            type="radio"
                            value="no"
                            {...register(
                              `claims.c3_expenses_list.${index}.receipt`
                            )}
                            className="radio radio-xs"
                          />
                          无
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="btn btn-xs btn-ghost col-span-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => append({})}
                    className="btn btn-xs btn-outline mt-2"
                  >
                    增加费用项
                  </button>
                </div>
              )}
            </td>
          </tr>

          {/* 4. 是否主张诉讼费用 (保持不变) */}
          <tr className="hover">
            <th className="w-1/4 align-top bg-base-200/50">
              4. 是否主张诉讼费用
            </th>
            <td>
              <div className="flex gap-4">
                <label className="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    value="yes"
                    {...register("claims.c4_check")}
                    className="radio radio-sm"
                  />
                  是
                </label>
                <label className="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    value="no"
                    {...register("claims.c4_check")}
                    className="radio radio-sm"
                  />
                  否
                </label>
              </div>
            </td>
          </tr>

          {/* 5. 消除影响 (保持不变) */}
          <tr className="hover">
            <th className="w-1/4 align-top bg-base-200/50">5. 消除影响</th>
            <td>
              <div className="flex gap-4">
                <label className="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    value="yes"
                    {...register("claims.c5_check")}
                    className="radio radio-sm"
                  />
                  有
                </label>
                <label className="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    value="no"
                    {...register("claims.c5_check")}
                    className="radio radio-sm"
                  />
                  无
                </label>
              </div>
            </td>
          </tr>

          {/* 6. 其他请求 (改为Textarea) */}
          <tr className="hover">
            <th className="w-1/4 align-top bg-base-200/50">6. 其他请求</th>
            <td>
              <OptimizableTextarea
                path="claims.c6_other_requests"
                label=""
                placeholder="填写其他具体请求..."
                rows={2}
                optimizationContext="原告关于本案中其他请求的具体说明"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </FormSectionCard>
  );
};

const FactsAndReasonsSection: React.FC = () => {
  const { register, watch } = useFormContext();

  const hasDamageObject = watch("facts.f2_check");

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

      <table className="table w-full border">
        <tbody>
          {/* 1. 原告主体情况 */}
          <tr className="hover">
            <th className="w-1/4 align-top bg-base-200/50">1. 原告主体情况</th>
            <td>
              <OptimizableTextarea path="facts.f1_details" label="" placeholder="具体情形：" rows={3} optimizationContext="关于原告主体情况的描述"/>
            </td>
          </tr>

          {/* 2. 原告主张的权益基础 */}
          <tr className="hover">
            <th className="w-1/4 align-top bg-base-200/50">
              2. 原告主张的权益基础或特定行为的损害对象
            </th>
            <td>
              <div className="flex gap-4">
                <label className="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    value="yes"
                    {...register("facts.f2_check")}
                    className="radio radio-sm"
                  />
                  有
                </label>
                <label className="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    value="no"
                    {...register("facts.f2_check")}
                    className="radio radio-sm"
                  />
                  无
                </label>
              </div>
              {hasDamageObject === "yes" && (
                <OptimizableTextarea path="facts.f2_details" label="" placeholder="内容：" rows={2} />
              )}
            </td>
          </tr>

          {/* 3. 被告实行不正当竞争行为的具体事实 */}
          <tr className="hover">
            <th className="w-1/4 align-top bg-base-200/50">
              3. 被告实行不正当竞争行为的具体事实
            </th>
            <td>
              <OptimizableTextarea
                path="facts.f3_details"
                label=""
                placeholder="包括时间、地点、表现形式、具体内容、主观故意程度和损害后果等"
                rows={3}
                optimizationContext="关于被告不正当竞争行为的具体事实描述"
              />
            </td>
          </tr>

          {/* 4. 其他情况 */}
          <tr className="hover">
            <th className="w-1/4 align-top bg-base-200/50">4. 其他情况</th>
            <td>
              <OptimizableTextarea
                path="facts.f4_details"
                label=""
                placeholder="其他未在上述问题中提及的情况或需要补充的说明"
                rows={3}
                optimizationContext="原告关于本案中其他情况的补充说明"
              />
            </td>
          </tr>

          {/* 5. 证据清单 */}
          <tr className="hover">
            <th className="w-1/4 align-top bg-base-200/50">
              5. 证据清单 (可另附页)
            </th>
            <td>
              <textarea
                {...register("facts.f5_details")}
                className="textarea textarea-bordered w-full"
              ></textarea>
            </td>
          </tr>
        </tbody>
      </table>
    </FormSectionCard>
  );
};

export const UnfairCompetitionClaimFormPage: React.FC = () => {
  
  
  const title = "民事起诉状 (不正当竞争纠纷)";
  const processFormDataForPreview = (data: any) => {
    const BLANK_CHECKBOX = "□";
    const CHECKED_CHECKBOX = "☑";
    const generateSelectionText = (
      options: string[],
      selectedValue: string | undefined,
      separator: string = " "
    ): string => {
      // 值映射表
      const valueMapping: { [key: string]: string[] } = {
        "yes": ["是", "有"],
        "no": ["否", "无"]
      };

      if (!selectedValue) {
        return options.map((opt) => `${opt}${BLANK_CHECKBOX}`).join(separator);
      }

      // 获取映射的中文值数组
      const mappedValues = valueMapping[selectedValue] || [selectedValue];

      return options
        .map((opt) => {
          const isSelected = mappedValues.includes(opt);
          return `${opt}${isSelected ? CHECKED_CHECKBOX : BLANK_CHECKBOX}`;
        })
        .join(separator);
    };

    const formatCustomClaims = (claimsData: any = {}): QuestionListItem[] => {
      const results: QuestionListItem[] = [];

      const formatExpenseItem = (exp: any): string =>
        `  - ${exp.type || "未指定"}: ${exp.amount || "0"
        } 元 (凭证: ${generateSelectionText(["有", "无"], exp.receipt)})`;

      // 1. 完整陈述 (放在单独的条目中)
      results.push({
        question: "诉讼请求 (完整陈述)",
        answers: claimsData.fullStatement || "（可完整表述诉讼请求；为方便、准确梳理要点，相关内容请在下方要素式表格中填写）\n",
      });

      // 2. 停止侵害
      results.push({
        question: "1. 停止侵害",
        answers:
          `${generateSelectionText(["有", "无"], claimsData.c1_check)}` +
          (claimsData.c1_check === "yes"
            ? `\n内容: ${claimsData.c1_details || ""}`
            : ""),
      });

      // 3. 赔偿经济损失
      let compensateDetails = generateSelectionText(
        ["有", "无"],
        claimsData.c2_check
      );
      if (claimsData.c2_check === "yes") {
        const lossParts = [
          `经济损失共计: ${claimsData.c2_total_amount || "0"} 元`,
          // 使用 checkbox 的逻辑来判断是否打勾
          `  ${"原告损失"}${claimsData.c2_has_plaintiff_loss ? CHECKED_CHECKBOX : BLANK_CHECKBOX
          }: ${claimsData.c2_plaintiff_loss_amount || "0"} 元`,
          `  ${"被告获利"}${claimsData.c2_has_defendant_profit
            ? CHECKED_CHECKBOX
            : BLANK_CHECKBOX
          }: ${claimsData.c2_defendant_profit_amount || "0"} 元`,
          `  ${"法定赔偿"}${claimsData.c2_has_legal_compensation
            ? CHECKED_CHECKBOX
            : BLANK_CHECKBOX
          }: ${claimsData.c2_legal_compensation_amount || "0"} 元`,
          `计算依据或参考因素: ${claimsData.c2_details || ""}`,
        ];
        compensateDetails += "\n" + lossParts.join("\n");
      }
      results.push({ question: "2. 赔偿经济损失", answers: compensateDetails });

      // 4. 支付合理费用
      let expensesDetails = generateSelectionText(
        ["有", "无"],
        claimsData.c3_check
      );
      if (claimsData.c3_check === "yes") {
        const expenseItems = (claimsData.c3_expenses_list || [])
          .map(formatExpenseItem)
          .join("\n");
        expensesDetails += "\n" + (expenseItems || "未填写具体费用明细");
      }
      results.push({ question: "3. 支付合理费用", answers: expensesDetails });

      // 5. 是否主张诉讼费用
      results.push({
        question: "4. 是否主张诉讼费用",
        answers: generateSelectionText(["是", "否"], claimsData.c4_check),
      });

      // 6. 消除影响
      results.push({
        question: "5. 消除影响",
        answers: generateSelectionText(["有", "无"], claimsData.c5_check),
      });

      // 7. 其他请求
      results.push({
        question: "6. 其他请求",
        answers: claimsData.c6_other_requests || "无",
      });

      return results;
    };

    const formatCustomFacts = (factsData: any = {}): QuestionListItem[] => {
      const results: QuestionListItem[] = [];

      // 完整陈述
      results.push({
        question: "事实与理由 (完整陈述)",
        answers: factsData.fullStatement || "（可完整表述纠纷涉及的事实与理由；为方便、准确梳理要点，相关内容请在下方要素式表格中填写）\n",
      });

      // 1. 原告主体情况
      results.push({
        question: "1. 原告主体情况",
        answers: `具体情形: ${factsData.f1_details || ""}`,
      });

      // 2. 原告主张的权益基础
      results.push({
        question: "2. 原告主张的权益基础或特定行为的损害对象",
        answers:
          `${generateSelectionText(["有", "无"], factsData.f2_check)}` +
          (factsData.f2_check === "yes"
            ? `\n内容: ${factsData.f2_details || ""}`
            : ""),
      });

      // 3. 被告实行不正当竞争行为的具体事实
      results.push({
        question: "3. 被告实行不正当竞争行为的具体事实",
        answers: factsData.f3_details || "",
      });

      // 4. 其他情况
      results.push({
        question: "4. 其他情况",
        answers: factsData.f4_details || "",
      });

      // 5. 证据清单
      results.push({
        question: "5. 证据清单 (可另附页)",
        answers: factsData.f5_details || "",
      });

      return results;
    };

    // 1. 定义当事人蓝图，仅供 formatPartiesForDocx 使用
    const partyBlueprint_plaintiffs = [
      { path: 'plaintiffs_natural', roleText: '原告\n(自然人)', type: 'natural' as const },
      { path: 'plaintiffs_legal', roleText: '原告\n(法人/非法人组织)', type: 'legal' as const },

    ];

    const partyBlueprint_others = [
      { path: 'defendants_natural', roleText: '被告\n(自然人)', type: 'natural' as const },
      { path: 'defendants_legal', roleText: '被告\n(法人/非法人组织)', type: 'legal' as const },
      { path: 'third_parties_natural', roleText: '第三人\n(自然人)', type: 'natural' as const },
      { path: 'third_parties_legal', roleText: '第三人\n(法人/非法人组织)', type: 'legal' as const },
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

      claimItems: formatCustomClaims(data.claims),
      factItems: formatCustomFacts(data.facts),
      relatedCaseInfo: formatRelatedCaseForDocx(data),
      mediationInfo: formatMediationForDocx(data),
    };
  };

    const handleFormSubmit = async (data: any) => {
      const final = processFormDataForPreview(data);
      const title = "民事起诉状 (不正当竞争纠纷)";
      const payload = { formData: data, final };
      
      console.log("最终提交的起诉状Payload:", JSON.stringify(payload, null, 2));
      await generateAndDownloadDocx("起诉状", payload, title);
    };

  const rightSide = <AIChatbotPanel />;

  return (
    <FormPageLayout
      title={title}
      formId="claim_unfair_competition"
      onSubmit={handleFormSubmit}
      onPreviewData={processFormDataForPreview}
      rightPanel={rightSide}
      docType="起诉状"
      fixedFormValues={{basicInfo: {caseCause: '不正当竞争纠纷'}}}
    >

      <BasicInfoSection case_type="不正当竞争纠纷"/>
      <FormSectionCard title="原告">
        <PartyList
          path="plaintiffs_natural"
          title="自然人"
          partyType="natural"
        />
        <div className="divider my-4"></div> {/* 使用 my-4 增加垂直间距 */}
        <PartyList
          path="plaintiffs_legal"
          title="法人/非法人组织"
          partyType="legal"
        />
      </FormSectionCard>
      <AgentList path="agents" />
      <FormSectionCard title="被告">
        <PartyList
          path="defendants_natural"
          title="自然人"
          partyType="natural"
        />
        <div className="divider my-4"></div>
        <PartyList
          path="defendants_legal"
          title="法人/非法人组织"
          partyType="legal"
        />
      </FormSectionCard>

      <FormSectionCard title="第三人">
        <PartyList
          path="third_parties_natural"
          title="自然人"
          partyType="natural"
        />
        <div className="divider my-4"></div>
        <PartyList
          path="third_parties_legal"
          title="法人/非法人组织"
          partyType="legal"
        />
      </FormSectionCard>


      <ClaimsSection />
      <FactsAndReasonsSection />
      <RelatedCaseInfoForm path="relatedCaseInfo" />
      <FormSectionCard title="对纠纷解决方式的意愿">
        <MediationForm path="mediation" />
      </FormSectionCard>
    </FormPageLayout>
  );
};

export default UnfairCompetitionClaimFormPage;
