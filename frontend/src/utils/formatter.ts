import type { QuestionConfig } from "../components/claim/QuestionTable";
import type {
  PartyListItem,
  QuestionListItem,
} from "../interfaces/document.types";
import nzh from "nzh";

// ==================== 常量定义 ====================
/**
 * 企业类型枚举
 */
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

/**
 * 空白复选框符号
 */
const BLANK_CHECKBOX = "□";

/**
 * 选中复选框符号
 */
const CHECKED_CHECKBOX = "☑";

// ==================== 通用工具函数 ====================
/**
 * 生成选项文本，根据选中状态添加相应的复选框符号
 * @param options 选项列表
 * @param selectedValue 选中的值
 * @param separator 分隔符，默认为换行符
 * @returns 格式化后的选项文本
 */
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

/**
 * 从对象路径获取值
 * @param obj 对象
 * @param path 路径字符串，使用点号分隔
 * @returns 路径指向的值
 */
export const getValueFromPath = (obj: any, path: string): any => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

/**
 * 从路径获取字段名（取 . 后的部分）
 * @param path 完整路径
 * @returns 字段名
 */
export const getFieldName = (path: string): string => {
  const parts = path.split(".");
  return parts[parts.length - 1]; // 取最后一部分
};

/**
 * 从路径获取详情字段的值
 * @param obj 对象
 * @param path 路径
 * @returns 详情字段的值
 */
export const getDetailsValue = (obj: any, path: string): string => {
  // 获取字段名并将 _check 替换为 _details
  const fieldName = getFieldName(path);
  const detailsFieldName = fieldName.replace("_check", "_details");
  return obj[detailsFieldName] || "";
};

/**
 * 格式化日期为中文格式 YYYY年MM月DD日
 * @param dateString 日期字符串
 * @returns 格式化后的中文日期
 */
export const formatDateToChinese = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // 如果日期无效，返回原字符串

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}年${month}月${day}日`;
};

/**
 * 格式化数字为中文大写金额
 * @param number 数字字符串
 * @returns 中文大写金额
 */
export const formatNumberToCN = (number: string) => {
  return `（${nzh.cn.toMoney(number, {
    outSymbol: false,
  })}）`;
};

/**
 * 格式化金额并添加中文大写
 * @param amount 金额字符串
 * @returns 格式化后的金额（含中文大写）
 */
export const formatMoneyWithCN = (amount: string) => {
  if (!amount) return "____元";
  return `${amount}元 ${formatNumberToCN(amount)}`;
};

// ==================== 当事人信息格式化相关函数 ====================

/**
 * 根据 specialType 为当事人信息添加身份行
 * @param details - 详情字符串数组
 * @param specialType - 特殊文书类型
 * @param partyData - 当事人数据（可选，用于填充已有数据）
 */
const addIdentityLineForSpecialType = (
  details: string[],
  specialType?: string,
  partyData?: any
) => {
  if (!specialType) {
    return; // 如果没有 specialType，则不进行任何操作
  }

  // 定义不同 specialType 对应的身份选项
  const identityOptionsMap: { [key: string]: string[] } = {
    不予执行申请书: ["被执行人", "案外人", "其他"],
    执行监督申请书: [
      "申请执行人",
      "被执行人",
      "利害关系人",
      "案外人",
      "其他",
    ],
    执行异议申请书: [
      "申请执行人",
      "被执行人",
      "利害关系人",
      "案外人",
      "其他",
    ],
    执行复议申请书: [
      "申请执行人",
      "被执行人",
      "利害关系人",
      "案外人",
      "其他",
    ],
    执行担保申请书: [
      "被执行人",
      "利害关系人",
      "案外人",
      "其他",
    ],
  };

  const options = identityOptionsMap[specialType];

  // 如果当前 specialType 有对应的身份选项
  if (options) {
    let identityLine = "";
    // 如果有 partyData，则根据数据生成身份行
    if (partyData && partyData.hasOwnProperty("identityType")) {
      const selectedValue = partyData.identityType || "";
      identityLine = `身份: ${generateSelectionText(
        options,
        selectedValue,
        " "
      )}`;
      // 如果选择了"其他"并且有输入内容，则添加该内容
      if (selectedValue === "其他" && partyData.identityTypeOther) {
        identityLine += ` ${partyData.identityTypeOther}`;
      }
    } else {
      // 如果没有 partyData（例如在生成空白模板时），则生成一个全部未选中的身份行
      identityLine = `身份: ${generateSelectionText(options, undefined, " ")}`;
    }
    // 在第一行（姓名/名称）之后插入身份信息
    details.splice(1, 0, identityLine);
  }
};

/**
 * 获取自然人空白详情模板
 * @returns 自然人空白详情字符串
 */
const getBlankNaturalPersonDetails = (specialType?: string): string => {
  const details = [
    `姓名:`,
    `性别: 男${BLANK_CHECKBOX} 女${BLANK_CHECKBOX}`,
    `出生日期:`,
    `民族:`,
    `工作单位:`,
    `职务:`,
    `联系电话:`,
    `住所地(户籍所在地):`,
    `经常居住地:`,
    `证件类型:`,
    `证件号码:`,
  ];

  // 调用通用方法来处理 specialType
  addIdentityLineForSpecialType(details, specialType);

  return details.join("\n");
};

/**
 * 获取法人/非法人组织空白详情模板
 * @returns 法人/非法人组织空白详情字符串
 */
const getBlankLegalEntityDetails = (specialType?: string): string => {
  const details = [
    `名称:`,
    `住所地:`,
    `注册地/登记地:`,
    `法定代表人/负责人:   职务:   联系电话:`,
    `统一社会信用代码:`,
    `类型: ${generateSelectionText(ENTITY_TYPES, undefined, " ")}`,
    `所有制性质: 国有${BLANK_CHECKBOX} ( 控股${BLANK_CHECKBOX} 参股${BLANK_CHECKBOX} )  民营${BLANK_CHECKBOX}  其他${BLANK_CHECKBOX}: __________`,
  ];

  // 调用通用方法来处理 specialType
  addIdentityLineForSpecialType(details, specialType);

  return details.join("\n");
};
/**
 * 格式化当事人详情信息
 * @param partyData 当事人数据
 * @param isNatural 是否为自然人
 * @param specialType 特殊类型（如"不予执行申请书"）
 * @returns 格式化后的当事人详情字符串
 */
const formatPartyDetails = (
  partyData: any,
  isNatural: boolean,
  specialType?: string
): string => {
  // 如果没有有效数据，返回对应的空白模板
  if (!partyData || (Object.keys(partyData).length <= 1 && partyData.type)) {
    return isNatural
      ? getBlankNaturalPersonDetails(specialType)
      : getBlankLegalEntityDetails(specialType);
  }

  let details: string[];

  if (isNatural) {
    // 构建自然人信息字符串数组
    details = [
      `姓名: ${partyData.name || ""}`,
      `性别: ${generateSelectionText(["男", "女"], partyData.gender, " ")}`,
      `出生日期: ${partyData.birthDate || ""}`,
      `民族: ${partyData.nation || ""}`,
      `工作单位: ${partyData.workUnit || ""}`,
      `职务: ${partyData.title || ""}`,
      `联系电话: ${partyData.phone || ""}`,
      `住所地(户籍所在地): ${partyData.address || ""}`,
      `经常居住地: ${partyData.currentAddress || ""}`,
      `证件类型: ${partyData.idType || ""}`,
      `证件号码: ${partyData.idNumber || ""}`,
    ];
  } else {
    // 构建法人/非法人组织信息字符串数组
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

    details = [
      `名称: ${partyData.entityName || ""}`,
      `住所地: ${partyData.entityAddress || ""}`,
      `注册地/登记地: ${partyData.registeredAddress || ""}`,
      `法定代表人/负责人: ${partyData.legalRepName || ""}  职务: ${partyData.legalRepTitle || ""
      }  联系电话: ${partyData.entityPhone || ""}`,
      `统一社会信用代码: ${partyData.entityId || ""}`,
      `类型: ${generateSelectionText(ENTITY_TYPES, partyData.entityType, " ")}`,
      ownershipStr,
    ];
  }

  // 调用通用方法处理 specialType，传入 partyData
  addIdentityLineForSpecialType(details, specialType, partyData);

  return details.join("\n");
}

/**
 * 格式化当事人信息用于文档生成
 * @param formData 表单数据
 * @param partyBlueprint 当事人蓝图配置
 * @returns 格式化后的当事人列表
 */
export const formatPartiesForDocx = (
  formData: any,
  partyBlueprint: {
    path: string;
    roleText: string;
    type: "natural" | "legal";
    specialType?: string;
  }[] = []
): PartyListItem[] => {
  const allPartyItems: PartyListItem[] = [];
  for (const blueprint of partyBlueprint) {
    const partiesData = formData[blueprint.path];
    if (!partiesData || partiesData.length === 0) {
      allPartyItems.push({
        role: blueprint.roleText,
        details:
          blueprint.type === "natural"
            ? getBlankNaturalPersonDetails(blueprint.specialType)
            : getBlankLegalEntityDetails(blueprint.specialType),
      });
    } else {
      partiesData.forEach((p_data: any) => {
        allPartyItems.push({
          role: blueprint.roleText,
          details: formatPartyDetails(
            p_data,
            blueprint.type === "natural",
            blueprint.specialType
          ),
        });
      });
    }
  }
  return allPartyItems;
};

// ==================== 代理人信息格式化相关函数 ====================
/**
 * 获取代理人空白详情模板
 * @returns 代理人空白详情字符串
 */
const getBlankAgentDetails = (): string =>
  `是${BLANK_CHECKBOX}\n姓名:\n单位:\n职务:\n联系电话:\n代理权限: 一般授权${BLANK_CHECKBOX} 特别授权${BLANK_CHECKBOX}\n否${CHECKED_CHECKBOX}`;

/**
 * 格式化代理人信息用于文档生成
 * @param formData 表单数据
 * @returns 格式化后的代理人列表
 */
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

// ==================== 调解信息格式化相关函数 ====================
/**
 * 获取调解信息空白详情模板
 * @returns 调解信息空白详情列表
 */
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
  ].join("\n");

  return [
    {
      question:
        "是否了解调解作为非诉讼纠纷解决方式， 能及时、高效、低成本、不伤和气地解决纠纷",
      answers: blankRadio,
    },
    { question: "是否了解先行调解解决纠纷的好处", answers: benefitsDetails },
    { question: "是否考虑先行调解", answers: blankDecision },
  ];
};

/**
 * 格式化调解信息用于文档生成
 * @param formData 表单数据
 * @returns 格式化后的调解信息列表
 */
export const formatMediationForDocx = (formData: any): QuestionListItem[] => {
  const mediationData = formData.mediation;

  if (!mediationData || Object.keys(mediationData).length === 0) {
    return getBlankMediationDetails();
  }

  // 格式化"好处"部分的details
  const benefitsDetails = [
    `1. 立案后选择先行调解的，可以很快启动调解程序。如不同意调解，法院将依程序开庭审理案件，但可能需要经过较长一段时间的排期等待，且审理、执行周期相对较长。\n${generateSelectionText(
      ["了解", "不了解"],
      mediationData.q2_1_understand_efficiency
    )}`,
    `2. 选择先行调解，调解成功且自动履行的免交诉讼费用，申请司法确认的不交纳诉讼费用，要求出具调解书的减半交纳诉讼费用。\n${generateSelectionText(
      ["了解", "不了解"],
      mediationData.q2_2_understand_cost
    )}`,
    `3. 首次调解不成功，但仍有继续调解意愿的，可以选择更换调解组织和调解员再进行调解。调解无法达成一致意见的，法院将依程序排期开庭。\n${generateSelectionText(
      ["了解", "不了解"],
      mediationData.q2_3_understand_flexibility
    )}`,
    `4. 依照法律规定，调解具有保密性要求，调解过程不公开，调解协议未经当事人同意不得公开。\n${generateSelectionText(
      ["了解", "不了解"],
      mediationData.q2_4_understand_confidentiality
    )}`,
    `5. 调解达成的协议具有法律效力，可以依照法律规定申请司法确认，具有强制执行效力。\n${generateSelectionText(
      ["了解", "不了解"],
      mediationData.q2_5_understand_legality
    )}`,
  ].join("\n");

  // 格式化最终决定的details
  const finalDecisionDetails = generateSelectionText(
    ["是", "否", "暂不确定，想要了解更多内容"],
    mediationData.q3_final_decision,
    "\n"
  );

  return [
    {
      question:
        "是否了解调解作为非诉讼纠纷解决方式，能及时、高效、低成本、不伤和气地解决纠纷",
      answers: generateSelectionText(
        ["了解", "不了解"],
        mediationData.q1_understand_mediation_as_method
      ),
    },
    {
      question: "是否了解先行调解解决纠纷的好处",
      answers: benefitsDetails,
    },
    {
      question: "是否考虑先行调解",
      answers: finalDecisionDetails,
    },
  ];
};

// ==================== 关联案件信息格式化相关函数 ====================
/**
 * 格式化关联案件信息用于文档生成
 * @param formData 表单数据
 * @returns 格式化后的关联案件信息列表
 */
export const formatRelatedCaseForDocx = (formData: any): QuestionListItem[] => {
  const relatedCaseData = formData.relatedCaseInfo || {};

  const hasInfo = relatedCaseData.hasInfo === "有";
  const detailsText = relatedCaseData.details || "";

  // 根据用户选择，构建最终的 details 字符串
  const finalDetails =
    `${generateSelectionText(["有", "无"], relatedCaseData.hasInfo)}` +
    `${hasInfo ? `\n内容：${detailsText}` : "\n内容："}`;

  return [
    {
      question: "关联案件信息",
      answers: finalDetails,
    },
  ];
};

// ==================== 诉前保全信息格式化相关函数 ====================
/**
 * 格式化诉前保全信息用于文档生成
 * @param formData 表单数据
 * @returns 格式化后的诉前保全信息列表
 */
export const formatPretrialPreservationForDocx = (
  formData: any
): QuestionListItem[] => {
  const data = formData.pretrialPreservation;
  let answers = "";

  // 默认情况或选择"否"
  let yesChecked = BLANK_CHECKBOX;
  let noChecked = CHECKED_CHECKBOX;

  if (data?.hasPreservation === "yes") {
    yesChecked = CHECKED_CHECKBOX;
    noChecked = BLANK_CHECKBOX;
    // 拼接详细信息
    const court = data.court || "__________";
    const date = data.date || "__________";
    const caseNumber = data.caseNumber || "__________";
    answers =
      `  保全法院: ${court}    保全时间: ${date}\n` +
      `  保全案号: ${caseNumber}`;
  }

  const finalDetails =
    `是${yesChecked}\n` +
    `${answers}\n` +
    `否${noChecked}\n` +
    `( 如申请诉讼保全，请另行提交诉讼保全申请及相关材料 )`;

  return [
    {
      question: "是否已经诉前保全",
      answers: finalDetails,
    },
  ];
};

// ==================== 表单数据格式化相关函数 ====================
/**
 * 格式化表单数据用于文档生成
 * @param dataType 数据类型 ('claim' | 'facts' | 其他)
 * @param formData 表单数据
 * @param config 问题配置
 * @returns 格式化后的问题列表
 */
export const formatFormData = (
  dataType: string,
  formData: any,
  config: QuestionConfig[]
): QuestionListItem[] => {
  const results: QuestionListItem[] = [];

  if (dataType === "claim") {
    results.push({
      question: "诉讼请求 (完整陈述)",
      answers:
        formData.claims?.fullStatement ||
        "（可完整表述诉讼请求；为方便、准确梳理要点，相关内容请在下方要素式表格中填写）\n",
    });
  } else if (dataType === "facts") {
    results.push({
      question: "事实与理由 (完整陈述)",
      answers:
        formData.facts?.fullStatement ||
        "（可完整表述纠纷涉及的事实与理由；为方便、准确梳理要点，相关内容请在下方要素式表格中填写）\n",
    });
  }

  config.forEach((item) => {
    const { title, path } = item;
    let answerText = "";

    // 使用 item.type 来安全地收窄类型
    switch (item.type) {
      // 案例1：自定义渲染的组件，它有自己的 formatter
      case "custom":
        // 在这里，TypeScript 知道 item 有一个 formatter 属性
        if (item.formatter) {
          answerText = item.formatter(formData, item);
        } else if (item.type === "custom") {
          // 如果 custom 类型没有 formatter，可以给一个默认值或留空
          answerText = "";
        }
        break;

      case "LegalAnalysisField": {
        const data = getValueFromPath(formData, path) || {};
        // 从 item 配置中获取 withContractAnalysis 标志，默认为 true
        const showContract = item.withContractAnalysis !== false;

        const legalBasis = `法律依据：\n${data.legal || ""}`;

        if (showContract) {
          const contractBasis = `合同依据：\n${data.contract || ""}`;
          answerText = `${contractBasis}\n\n${legalBasis}`;
        } else {
          answerText = legalBasis;
        }
        break;
      }

      // 案例2：单选框
      case "radio": {
        const { options, enableDetails } = item;
        const value = getValueFromPath(formData, path);
        const optionLabels = options.map((option) => option.label);
        answerText = generateSelectionText(optionLabels, value) || "未选择";

        if (enableDetails && value === "yes") {
          // 现在可以安全地访问 item.detailsPath
          const detailsPath =
            item.detailsPath || path.replace("_check", "_details");
          const detailsValue = getValueFromPath(formData, detailsPath);
          answerText += `\n${item.detailsLabel}：${detailsValue || ""}`;
        }
        break;
      }

      // 默认案例：处理所有其他简单的文本输入类型
      case "textarea":
      case "optimizationContext":
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

/**
 * 动态地为配置数组中的每个项的标题添加勾选状态 (☑/☐)。
 *
 * @template T - 配置项的类型，必须包含 path 和 title 属性。
 * @param {T[]} config - 原始的配置数组。
 * @param {any} data - 包含所有表单数据的对象。
 * @returns {T[]} - 返回一个新的配置数组，其中每个项的 title 都已更新。
 */
export const createDynamicConfigWithChecks = <T extends { path: string; title: string }>(
  config: T[],
  data: any
): T[] => {
  return config.map(item => {
    // 1. 根据配置项的 path，从总数据 `data` 中获取对应的部分数据
    const sectionData = getValueFromPath(data, item.path);

    // 2. 判断该部分是否有任何有效填写
    let isChecked = false;
    if (sectionData) {
      // 如果数据是一个对象 (例如包含多个 checkbox)，检查其中是否有任何一个值为真
      if (typeof sectionData === 'object' && sectionData !== null) {
        isChecked = Object.values(sectionData).some(value => !!value);
      } else {
        // 如果数据是单个值 (例如 "其他" 字段的字符串)，直接判断其是否为真
        isChecked = !!sectionData;
      }
    }

    // 3. 返回一个新的配置对象，包含更新后的 title
    return {
      ...item,
      // 避免重复添加勾选框
      title: `${item.title.replace(/[☑☐]/g, '').trim()}${isChecked ? '☑' : '☐'}`,
    };
  });
};