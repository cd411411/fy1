import type { PartyListItem, QuestionListItem } from '../interfaces/document.types';
import type { QuestionConfig } from '../components/claim/QuestionTable';
import nzh from 'nzh';

const ENTITY_TYPES = [
  "有限责任公司",
  "股份有限公司",
  "上市公司",
  "其他企业法人",
  "事业单位",
  "社会团体",
  "基金会",
  "社会服务机构",
  "机关法人",
  "农村集体经济组织法人",
  "城镇农村的合作经济组织法人",
  "基层群众性自治组织法人",
  "个人独资企业",
  "合伙企业",
  "不具有法人资格的专业服务机构",
];
const BLANK_CHECKBOX = "□";
const CHECKED_CHECKBOX = "☑";

export const generateSelectionText = (
  options: string[],
  selectedValue: string | undefined,
  separator: string = "\n"
): string => {
  // 值映射表
  const valueMapping: { [key: string]: string[] } = {
    yes: ["是", "有"],
    no: ["否", "无"],
  };

  // 如果没有选中值，默认选中 "no"
  const valueToUse = selectedValue || "no";

  // 获取映射的中文值数组
  const mappedValues = valueMapping[valueToUse] || [valueToUse];

  return options
    .map((opt) => {
      const isSelected = mappedValues.includes(opt);
      return `${opt}${isSelected ? CHECKED_CHECKBOX : BLANK_CHECKBOX}`;
    })
    .join(separator);
};

const getBlankNaturalPersonDetails = (): string =>
  `姓名:\n性别: 男${BLANK_CHECKBOX} 女${BLANK_CHECKBOX}\n出生日期:\n民族:\n工作单位:\n职务:\n联系电话:\n住所地(户籍所在地):\n经常居住地:\n证件类型:\n证件号码:`;
const getBlankLegalEntityDetails = (): string =>
  `名称:\n住所地:\n注册地/登记地:\n法定代表人/负责人:   职务:   联系电话:\n统一社会信用代码:\n类型: ${generateSelectionText(
    ENTITY_TYPES,
    undefined
  )}\n所有制性质: 国有${BLANK_CHECKBOX} ( 控股${BLANK_CHECKBOX} 参股${BLANK_CHECKBOX} )  民营${BLANK_CHECKBOX}  其他${BLANK_CHECKBOX}: __________`;
const getBlankAgentDetails = (): string =>
  `是${BLANK_CHECKBOX}\n姓名:\n单位:\n职务:\n联系电话:\n代理权限: 一般授权${BLANK_CHECKBOX} 特别授权${BLANK_CHECKBOX}\n否${CHECKED_CHECKBOX}`;

const formatPartyDetails = (partyData: any, isNatural: boolean): string => {
  if (!partyData || (Object.keys(partyData).length <= 1 && partyData.type)) {
    return isNatural
      ? getBlankNaturalPersonDetails()
      : getBlankLegalEntityDetails();
  }
  if (isNatural) {
    return [
      `姓名: ${partyData.name || ""}`,
      `性别: ${generateSelectionText(["男", "女"], partyData.gender)}`,
      `出生日期: ${partyData.birthDate || ""}`,
      `民族: ${partyData.nation || ""}`,
      `工作单位: ${partyData.workUnit || ""}`,
      `职务: ${partyData.title || ""}`,
      `联系电话: ${partyData.phone || ""}`,
      `住所地(户籍所在地): ${partyData.address || ""}`,
      `经常居住地: ${partyData.currentAddress || ""}`,
      `证件类型: ${partyData.idType || ""}`,
      `证件号码: ${partyData.idNumber || ""}`,
    ].join("\n");
  } else {
    const ownership = partyData.ownership || {};
    const subType = ownership.stateOwnedSubType || "";
    const ownershipStr = `所有制性质: ${generateSelectionText(
      ["国有"],
      ownership.mainType
    )} ( ${generateSelectionText(["控股"], subType)} ${generateSelectionText(
      ["参股"],
      subType
    )} )  ${generateSelectionText(["民营"], ownership.mainType)}  ${ownership.mainType === "其他"
      ? `其他☑: ${ownership.otherDetails || "__________"}`
      : `其他${BLANK_CHECKBOX}`
      }`;
    return [
      `名称: ${partyData.entityName || ""}`,
      `住所地: ${partyData.entityAddress || ""}`,
      `注册地/登记地: ${partyData.registeredAddress || ""}`,
      `法定代表人/负责人: ${partyData.legalRepName || ""}  职务: ${partyData.legalRepTitle || ""
      }  联系电话: ${partyData.entityPhone || ""}`,
      `统一社会信用代码: ${partyData.entityId || ""}`,
      `类型: ${generateSelectionText(ENTITY_TYPES, partyData.entityType)}`,
      ownershipStr,
    ].join("\n");
  }
};

export const formatPartiesForDocx = (
  formData: any,
  partyBlueprint: { path: string; roleText: string; type: "natural" | "legal"; }[] = []
): PartyListItem[] => {
  const allPartyItems: PartyListItem[] = [];
  for (const blueprint of partyBlueprint) {
    const partiesData = formData[blueprint.path];
    if (!partiesData || partiesData.length === 0) {
      allPartyItems.push({
        role: blueprint.roleText,
        details:
          blueprint.type === "natural"
            ? getBlankNaturalPersonDetails()
            : getBlankLegalEntityDetails(),
      });
    } else {
      partiesData.forEach((p_data: any) => {
        allPartyItems.push({
          role: blueprint.roleText,
          details: formatPartyDetails(p_data, blueprint.type === "natural"),
        });
      });
    }
  }
  return allPartyItems;
};

export const formatAgentsForDocx = (formData: any): PartyListItem[] => {
  const agentsData = formData.agents;
  if (!agentsData || agentsData.length === 0) {
    return [{ role: "委托诉讼代理人", details: getBlankAgentDetails() }];
  }
  const agentDetails = agentsData.map((a: any) => {
    if (!a || Object.keys(a).length === 0) return getBlankAgentDetails();
    const authorityType = a.agentAuthorityType || "";
    const authorityDetails = a.agentAuthorityDetails || "";
    const authorityStr = `代理权限: ${generateSelectionText(
      ["一般授权"],
      authorityType
    )} ${authorityType === "特别授权"
      ? `特别授权☑: ${authorityDetails}`
      : `特别授权${BLANK_CHECKBOX}`
      }`;
    return [
      `姓名: ${a.agentName || ""}`,
      `单位: ${a.agentUnit || ""}`,
      `职务: ${a.agentTitle || ""}`,
      `联系电话: ${a.agentPhone || ""}`,
      authorityStr,
    ].join("\n");
  });
  return [{ role: "委托诉讼代理人", details: agentDetails.join("\n\n") }];
};

const getBlankMediationDetails = (): QuestionListItem[] => {
  const blankRadio = `了解${BLANK_CHECKBOX} 不了解${BLANK_CHECKBOX}`;
  const blankDecision = `是${BLANK_CHECKBOX}\n否${BLANK_CHECKBOX}\n暂不确定，想要了解更多内容${BLANK_CHECKBOX}`;

  // 将多行文本拆分成独立的details
  const benefitsDetails = [
    `1. 立案后选择先行调解的，可以很快启动调解程序。如不同意调解，法院将依程序开庭审理案件，但可能需要经过较长一段时间的排期等待，且审理、执行周期相对较长。\n${blankRadio}`,
    `2. 选择先行调解，调解成功且自动履行的免交诉讼费用，申请司法确认的不交纳诉讼费用，要求出具调解书的减半交纳诉讼费用。\n${blankRadio}`,
    `3. 首次调解不成功，但仍有继续调解意愿的，可以选择更换调解组织和调解员再进行调解。调解无法达成一致意见的，法院将依程序排期开庭。\n${blankRadio}`,
    `4. 依照法律规定，调解具有保密性要求，调解过程不公开，调解协议未经当事人同意不得公开。\n${blankRadio}`,
    `5. 调解达成的协议具有法律效力，可以依照法律规定申请司法确认，具有强制执行效力。\n${blankRadio}`,
  ].join('\n');

  return [
    { question: '是否了解调解作为非诉讼纠纷解决方式， 能及时、高效、低成本、不伤和气地解决纠纷', answers: blankRadio },
    { question: '是否了解先行调解解决纠纷的好处', answers: benefitsDetails },
    { question: '是否考虑先行调解', answers: blankDecision },
  ];
};

export const formatMediationForDocx = (formData: any): QuestionListItem[] => {
  const mediationData = formData.mediation;

  if (!mediationData || Object.keys(mediationData).length === 0) {
    return getBlankMediationDetails();
  }

  // 格式化“好处”部分的details
  const benefitsDetails = [
    `1. 立案后选择先行调解的，可以很快启动调解程序。如不同意调解，法院将依程序开庭审理案件，但可能需要经过较长一段时间的排期等待，且审理、执行周期相对较长。\n${generateSelectionText(['了解', '不了解'], mediationData.q2_1_understand_efficiency)}`,
    `2. 选择先行调解，调解成功且自动履行的免交诉讼费用，申请司法确认的不交纳诉讼费用，要求出具调解书的减半交纳诉讼费用。\n${generateSelectionText(['了解', '不了解'], mediationData.q2_2_understand_cost)}`,
    `3. 首次调解不成功，但仍有继续调解意愿的，可以选择更换调解组织和调解员再进行调解。调解无法达成一致意见的，法院将依程序排期开庭。\n${generateSelectionText(['了解', '不了解'], mediationData.q2_3_understand_flexibility)}`,
    `4. 依照法律规定，调解具有保密性要求，调解过程不公开，调解协议未经当事人同意不得公开。\n${generateSelectionText(['了解', '不了解'], mediationData.q2_4_understand_confidentiality)}`,
    `5. 调解达成的协议具有法律效力，可以依照法律规定申请司法确认，具有强制执行效力。\n${generateSelectionText(['了解', '不了解'], mediationData.q2_5_understand_legality)}`,
  ].join('\n');

  // 格式化最终决定的details
  const finalDecisionDetails = generateSelectionText(['是', '否', '暂不确定，想要了解更多内容'], mediationData.q3_final_decision, "\n");

  return [
    {
      question: '是否了解调解作为非诉讼纠纷解决方式，能及时、高效、低成本、不伤和气地解决纠纷',
      answers: generateSelectionText(['了解', '不了解'], mediationData.q1_understand_mediation_as_method)
    },
    {
      question: '是否了解先行调解解决纠纷的好处',
      answers: benefitsDetails
    },
    {
      question: '是否考虑先行调解',
      answers: finalDecisionDetails
    }
  ];
};


export const formatRelatedCaseForDocx = (formData: any): QuestionListItem[] => {
  const relatedCaseData = formData.relatedCaseInfo || {};

  const hasInfo = relatedCaseData.hasInfo === '有';
  const detailsText = relatedCaseData.details || '';

  // 根据用户选择，构建最终的 details 字符串
  const finalDetails = `${generateSelectionText(['有', '无'], relatedCaseData.hasInfo)}` +
    `${hasInfo ? `\n内容：${detailsText}` : '\n内容：'}`;

  return [
    {
      question: '关联案件信息',
      answers: finalDetails
    }
  ];
};

export const formatPretrialPreservationForDocx = (formData: any): QuestionListItem[] => {
    const data = formData.pretrialPreservation;
    let answers = "";

    // 默认情况或选择“否”
    let yesChecked = BLANK_CHECKBOX;
    let noChecked = CHECKED_CHECKBOX;

    if (data?.hasPreservation === 'yes') {
        yesChecked = CHECKED_CHECKBOX;
        noChecked = BLANK_CHECKBOX;
        // 拼接详细信息
        const court = data.court || '__________';
        const date = data.date || '__________';
        const caseNumber = data.caseNumber || '__________';
        answers = `  保全法院: ${court}    保全时间: ${date}\n` +
                  `  保全案号: ${caseNumber}`;
    }

    const finalDetails = `是${yesChecked}\n` +
                         `${answers}\n` +
                         `否${noChecked}\n` +
                         `( 如申请诉讼保全，请另行提交诉讼保全申请及相关材料 )`;

    return [{
        question: '是否已经诉前保全',
        answers: finalDetails
    }];
};

export const getValueFromPath = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};
// 工具函数：从路径获取字段名（取 . 后的部分）
export const getFieldName = (path: string): string => {
  const parts = path.split('.');
  return parts[parts.length - 1]; // 取最后一部分
};

// 工具函数：从路径获取详情字段的值
export const getDetailsValue = (obj: any, path: string): string => {
  // 获取字段名并将 _check 替换为 _details
  const fieldName = getFieldName(path);
  const detailsFieldName = fieldName.replace('_check', '_details');
  return obj[detailsFieldName] || '';
};




export const formatFormData = (dataType: string, formData: any, config: QuestionConfig[]): QuestionListItem[] => {
  const results: QuestionListItem[] = [];

  if (dataType === 'claim') {
    results.push({
      question: "诉讼请求 (完整陈述)",
      answers: formData.claims?.fullStatement ||
        "（可完整表述诉讼请求；为方便、准确梳理要点，相关内容请在下方要素式表格中填写）\n"
    });
  } else if (dataType === 'facts') {
    results.push({
      question: "事实与理由 (完整陈述)",
      answers: formData.facts?.fullStatement ||
        "（可完整表述纠纷涉及的事实与理由；为方便、准确梳理要点，相关内容请在下方要素式表格中填写）\n"
    });
  }

  config.forEach((item) => {
    const { title, path } = item;
    let answerText = "";

    // 使用 item.type 来安全地收窄类型
    switch (item.type) {
      // 案例1：自定义渲染的组件，它有自己的 formatter
      case 'custom':
        // 在这里，TypeScript 知道 item 有一个 formatter 属性
        if (item.formatter) {
            answerText = item.formatter(formData, item);
        } else if (item.type === 'custom') {
            // 如果 custom 类型没有 formatter，可以给一个默认值或留空
            answerText = "";
        }
        break;
      
      case 'LegalAnalysisField': {
        const data = getValueFromPath(formData, path) || {};
        // 从 item 配置中获取 withContractAnalysis 标志，默认为 true
        const showContract = item.withContractAnalysis !== false;

        const legalBasis = `法律依据：\n${data.legal || ''}`;
        
        if (showContract) {
            const contractBasis = `合同依据：\n${data.contract || ''}`;
            answerText = `${contractBasis}\n\n${legalBasis}`;
        } else {
            answerText = legalBasis;
        }
        break;
      }

      // 案例2：单选框
      case 'radio': {
        const { options, enableDetails } = item;
        const value = getValueFromPath(formData, path);
        const optionLabels = options.map(option => option.label);
        answerText = generateSelectionText(optionLabels, value) || "未选择";

        if (enableDetails && value === 'yes') {
          // 现在可以安全地访问 item.detailsPath
          const detailsPath = item.detailsPath || path.replace('_check', '_details');
          const detailsValue = getValueFromPath(formData, detailsPath);
          answerText += `\n${item.detailsLabel}：${detailsValue || ''}`;
        }
        break;
      }

      // 默认案例：处理所有其他简单的文本输入类型
      case 'textarea':
      case 'optimizationContext':
      default: {
        const value = getValueFromPath(formData, path);
        // 对于 optimizationContext，可能需要特殊处理，但简单取值是基础
        answerText = value || item.placeholder || "";
        break;
      }
    }

    results.push({
      question: title,
      answers: answerText,
    });
  });

  return results;
};

export const formatDateToChinese = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // 如果日期无效，返回原字符串
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
};

export const formatNumberToCN = (number:string) => {
   return `（${nzh.cn.toMoney(number, {
              outSymbol: false,
            })}）`
}

// 辅助函数，用于格式化金额并添加中文大写
export const formatMoneyWithCN = (amount:string) => {
    if (!amount ) return '____元';
    return `${amount}元 ${formatNumberToCN(amount)}`;
};