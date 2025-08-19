// src/utils/defense-form.utils.ts
import type {
  DefenseFormConfig,
  DefenseItemConfig,
} from "../interfaces/defense-form.types";
import type { QuestionListItem } from "../interfaces/document.types";

import {
  formatPartiesForDocx,
  formatAgentsForDocx,
  formatMediationForDocx,
} from "./formatter";

const OPTION_SETS = {
    yes_no: { positive: '无', negative: '有' },
    confirm_object: { positive: '确认', negative: '异议' },
};

export const createGenericFormDataProcessor = (config: DefenseFormConfig) => {
  return (data: any) => {
    const BLANK_CHECKBOX = "□";
    const CHECKED_CHECKBOX = "☑";

    const formatObjectionSection = (
      sectionData: any,
      itemConfigs: DefenseItemConfig[],
      sectionType: "defenses" | "facts"
    ): QuestionListItem[] => {
      // 如果 sectionData 不存在，为所有项生成默认的未填写状态
      if (!sectionData) {
        return itemConfigs.map((config) => {
          if (config.type === "objection") {
              const optionType = config.optionType || 'yes_no';
              const currentOptions = OPTION_SETS[optionType];
              // 默认勾选 "positive" 选项
              return {
                  question: config.title,
                  answers: `${currentOptions.positive}${CHECKED_CHECKBOX} ${currentOptions.negative}${BLANK_CHECKBOX}`
              };
          }
          return { question: config.title, answers: "" };
        });
      }

      // 正常处理有数据的场景
      return itemConfigs.map((itemConfig) => {
        const itemData = sectionData[itemConfig.id];
        let detailsText = "";
        
        // 处理 objection 类型的字段
        if (itemConfig.type === "objection") {
            const optionType = itemConfig.optionType || 'yes_no';
            const currentOptions = OPTION_SETS[optionType];
            
            const selectedValue = itemData?.hasObjection;
            const isNegativeSelected = selectedValue === currentOptions.negative;

            const positiveLabel = `${currentOptions.positive}${isNegativeSelected ? BLANK_CHECKBOX : CHECKED_CHECKBOX}`;
            const negativeLabel = `${currentOptions.negative}${isNegativeSelected ? CHECKED_CHECKBOX : BLANK_CHECKBOX}`;

            detailsText = `${positiveLabel} ${negativeLabel}`;

            if (isNegativeSelected) {
                const detailsLabel = sectionType === 'defenses' ? '异议内容:' : '事实与理由:';
                detailsText += `\n${detailsLabel} ${itemData.details || ""}`;
            }
        } 
        // 处理 textarea 类型的字段（保持不变）
        else if (itemConfig.type === "textarea") {
            detailsText = itemData?.content || itemConfig?.placeholder || "";
        }

        else if (itemConfig.type === "optimizable_textarea") {
          detailsText = itemData?.content || itemConfig?.placeholder || "";
        }

        else if (itemConfig.type === "legal_analyze_textarea") {
          detailsText = itemData?.content || itemConfig?.placeholder || "";
        }

        else {
          detailsText = itemData?.content || itemConfig?.placeholder || "";
        }
        
        return { question: itemConfig.title, answers: detailsText };
      });
    };

    // 构建基础数据结构（始终包含所有字段）
    const result = {
      case_type: config.caseType,
      case_number: data.basicInfo?.caseNumber || `答辩状-${Date.now()}`,
      partyInfo: [
        ...formatPartiesForDocx(data, config.partyBlueprint),
        ...formatAgentsForDocx(data),
      ],
      defenseItems: [
        {
          question: "答辩事项",
          answers:
            data.defenses?.fullStatement ||
            "（可完整表述答辩事项；为方便、准确梳理要点，相关内容请在下方要素式表格中填写）\n",
        },
        ...formatObjectionSection(
          data.defenses,
          config.defenseItemsConfig,
          "defenses"
        ),
      ],
      // 始终包含factItems字段，根据配置决定内容
      factItems:
        config.factsAndReasonsConfig && config.factsAndReasonsConfig.length > 0
          ? [
              {
                question: "事实与理由",
                answers:
                  data.facts?.fullStatement ||
                  "（可完整表述纠纷涉及的事实与理由；为方便、准确梳理要点，相关内容请在下方要素式表格中填写）\n",
              },
              ...formatObjectionSection(
                data.facts,
                config.factsAndReasonsConfig,
                "facts"
              ),
            ]
          : [], // 没有配置时返回空数组
      mediationInfo: formatMediationForDocx(data),
    };

    return result;
  };
};
