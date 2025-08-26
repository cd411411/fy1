// src/components/defense/GenericDefenseItemsSection.tsx (已更新为接收全文)

import React from "react";
import { useFormContext } from "react-hook-form";
import { FormSectionCard } from "../../layouts/FormSectionCard";
import { ObjectionField } from "../ObjectionField";
import { LegalAnalysisField } from "../LegalAnalysisField";
import { OptimizableTextarea } from "../../components/OptimizableTextarea.tsx";
import type { GenericDefenseItemsSectionProps } from "../../interfaces/defense-form.types";
import type { QuestionListItem } from "../../interfaces/document.types";

interface ExtendedProps extends GenericDefenseItemsSectionProps {
  formConfig: any;
  getAnalysisContext: (data: any) => any;
  plaintiffClaims: QuestionListItem[];
  plaintiffFullText: string; // (新增) 接收原告起诉状全文
}

const cleanTitleForMatching = (title: string): string => {
    return title.replace(/^\d+\.\s*/, '').replace(/是否主张/, '').replace(/[（(].*?[)）]/, '').trim();
};

export const GenericDefenseItemsSection: React.FC<ExtendedProps> = ({
  config,
  formConfig,
  getAnalysisContext,
  plaintiffClaims, // 保持，用于找到对应的诉请原文
  plaintiffFullText, // (新增)
  sectionTitle = "答辩事项",
  fullStatementPath = "defenses.fullStatement",
  fullStatementPlaceholder = "可在此处完整表述您的答辩事项...",
  tableDescription = "对原告诉讼请求的确认或者异议："
}) => {
    const { register } = useFormContext();

    return (
      <FormSectionCard title={sectionTitle}>
        <OptimizableTextarea
          path={fullStatementPath}
          label="完整陈述"
          placeholder={fullStatementPlaceholder}
          rows={3}
          optimizationContext={`这是一段关于${formConfig.title}的案件被告对原告诉讼请求的确认或者异议陈述。`}
        />

        <p className="text-sm text-neutral-500 my-2">
          {tableDescription}
        </p>
        <table className="table w-full border">
          <tbody>
            {config.map((item) => (
              <tr key={item.id} className="hover">
                <th className="w-1/3 align-top bg-base-200/50">
                  {item.title}
                </th>
                <td>
                  {(() => {
                    switch (item.type) {
                      case 'objection':
                        // (修改) 这里的匹配逻辑现在只为了找到原始诉请文本
                        const cleanedDefenseTitle = cleanTitleForMatching(item.title);
                        const relatedClaim = plaintiffClaims.find(claim =>
                           cleanTitleForMatching(claim.question).includes(cleanedDefenseTitle)
                        );
                        
                        return (
                          <ObjectionField
                            path={`defenses.${item.id}`}
                            title={item.title}
                            plaintiffClaim={relatedClaim ? `${relatedClaim.question}\n${relatedClaim.answers}` : ''}
                            plaintiffFullText={plaintiffFullText} // (新增) 传入全文
                            placeholder={item.placeholder}
                            optimizationContext={item.optimizationContext}
                            optionType={item.optionType}
                          />
                        );
                      case 'legal_analyze_textarea':
                        return (
                          <LegalAnalysisField
                            path={`defenses.${item.id}`}
                            contractPath={`defenses.${item.id}.contract`}
                            legalPath={`defenses.${item.id}.legal`}
                            placeholder={item.placeholder}
                            formDataProcessor={getAnalysisContext ?? ((data: any) => data)}
                            withContractAnalysis={item.withContractAnalysis}
                          />
                        );
                      case "optimizable_textarea":
                        return (
                          <OptimizableTextarea
                            path={`defenses.${item.id}.content`}
                            label={item.label ?? ""}
                            placeholder={item.placeholder}
                            optimizationContext={item.optimizationContext}
                            rows={4}
                          />
                        );
                      case 'textarea':
                      default:
                        return (
                          <textarea
                            {...register(`defenses.${item.id}.content`)}
                            className="textarea textarea-bordered w-full"
                            placeholder={item.placeholder}
                          />
                        );
                    }
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </FormSectionCard>
    );
  };