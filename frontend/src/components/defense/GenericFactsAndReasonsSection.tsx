// src/components/defense/GenericFactsAndReasonsSection.tsx (最终更新版)

import React from "react";
import { useFormContext } from "react-hook-form";
import { FormSectionCard } from "../../layouts/FormSectionCard";
import { ObjectionField } from "../ObjectionField";
import { LegalAnalysisField } from "../LegalAnalysisField";
import { OptimizableTextarea } from "../../components/OptimizableTextarea.tsx";
import type { GenericFactsAndReasonsSectionProps } from "../../interfaces/defense-form.types";
import type { QuestionListItem } from "../../interfaces/document.types"; // (新增)

// (新增) 扩展 Props 接口
interface ExtendedProps extends GenericFactsAndReasonsSectionProps {
  formConfig: any;
  plaintiffFacts: QuestionListItem[];
  plaintiffFullText: string;
}

// (新增) 提取为公共函数，用于匹配
const cleanTitleForMatching = (title: string): string => {
    return title.replace(/^\d+\.\s*/, '').replace(/对.*(的)?/, '').replace(/是否有异议/, '').trim();
};

export const GenericFactsAndReasonsSection: React.FC<ExtendedProps> = ({
    config,
    getAnalysisContext,
    formConfig,
    plaintiffFacts, // (新增)
    plaintiffFullText, // (新增)
    sectionTitle = "事实与理由",
    fullStatementPath = "facts.fullStatement",
    fullStatementPlaceholder = "可在此处完整陈述事实与理由...",
    tableDescription = "对案件事实的确认或者异议：",
  }) => {
    const { register } = useFormContext();

    return (
      <FormSectionCard title={sectionTitle}>
        <OptimizableTextarea
          path={fullStatementPath}
          label="完整陈述"
          placeholder={fullStatementPlaceholder}
          rows={3}
          optimizationContext={`这是一段关于${formConfig.title}的案件事实与理由陈述。`}
        />
        <p className="text-sm text-neutral-500 my-2">{tableDescription}</p>
        <table className="table w-full border">
          <tbody>
            {config.map((item) => (
              <tr key={item.id} className="hover">
                <th className="w-1/3 align-top bg-base-200/50">{item.title}</th>
                <td>
                  {(() => {
                    switch (item.type) {
                      case "objection":
                        // (新增) 为事实部分的异议添加AI分析能力
                        const cleanedFactTitle = cleanTitleForMatching(item.title);
                        const relatedFact = plaintiffFacts.find(fact => 
                            cleanTitleForMatching(fact.question).includes(cleanedFactTitle)
                        );

                        return (
                          <ObjectionField
                            path={`facts.${item.id}`}
                            title={item.title}
                            plaintiffClaim={relatedFact ? `${relatedFact.question}\n${relatedFact.answers}` : ''}
                            plaintiffFullText={plaintiffFullText}
                            placeholder={item.placeholder}
                            optimizationContext={item.optimizationContext}
                            optionType={item.optionType}
                          />
                        );
                      case 'legal_analyze_textarea':
                        return (
                          <LegalAnalysisField
                            // (修正) 路径应该是 "facts" 开头
                            path={`facts.${item.id}`} 
                            contractPath={`facts.${item.id}.contract`}
                            legalPath={`facts.${item.id}.legal`}
                            placeholder={item.placeholder}
                            formDataProcessor={getAnalysisContext ?? ((data: any) => data)}
                            withContractAnalysis={item.withContractAnalysis}
                          />
                        );
                      case "optimizable_textarea":
                        return (
                          <OptimizableTextarea
                            path={`facts.${item.id}.content`}
                            label={item.title}
                            placeholder={item.placeholder}
                            optimizationContext={item.optimizationContext}
                            rows={4}
                          />
                        );
                      case "textarea":
                      default:
                        return (
                          <textarea
                            {...register(`facts.${item.id}.content`)}
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