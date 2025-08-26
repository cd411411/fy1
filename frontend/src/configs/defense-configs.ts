import type { DefenseFormConfig } from "../interfaces/defense-form.types";

// 不正当竞争纠纷配置
export const unfairCompetitionDefenseConfig: DefenseFormConfig = {
  caseType: '不正当竞争纠纷',
  title: '民事答辩状 (不正当竞争纠纷)',
  formId: 'unfair_competition',
  defenseItemsConfig: [
    { id: "f1", title: "1. 对停止侵害有无异议", type: "objection", optimizationContext: "被告对原告停止侵害的请求的异议" },
    { id: "f2", title: "2. 对赔偿经济损失有无异议（包括对原告主张的损失、被告获利、赔偿数额等有无异议）", type: "objection", optimizationContext: "被告对原告要求赔偿经济损失的请求的异议" },
    { id: "f3", title: "3. 对支付合理费用有无异议", type: "objection", optimizationContext: "被告对原告要求支付合理费用的请求的异议" },
    { id: "f4", title: "4. 对其他请求有无异议", type: "objection", optimizationContext: "被告对原告其他请求的异议" },
  ],
  factsAndReasonsConfig: [
    { id: "f1", title: "1. 对原告资格是否有异议", type: "objection", optimizationContext: "被告对原告资格的异议" },
    { id: "f2", title: "2. 对原告主张的权益基础或特定行为的损害对象有无异议", type: "objection", optimizationContext: "被告对原告主张的权益基础或特定行为的损害对象的异议" },
    { id: "f3", title: "3. 对被诉行为的具体事实（包括时间、地点、表现形式、具体内容、主观故意程度、损害后果等）有无异议", type: "objection", optimizationContext: "被告对被诉行为的具体事实的异议" },
    { id: "f4", title: "4. 有无正当使用或合法来源等抗辩事由", type: "objection", optimizationContext: "被告正当使用或合法来源等抗辩事由" },
    { id: "f5", title: "5. 其他异议及依据 (可另附页)", type: "objection", optimizationContext: "被告其他异议及依据" },
    { id: "f6", title: "6. 证据清单 (可另附页)", type: "textarea" },
    { id: "f7", title: "7. 质证清单 (可另附页)", type: "textarea" },
  ],
  partyBlueprint: [
    { path: "defendants_natural", roleText: "答辩人\n(自然人)", type: "natural" },
    { path: "defendants_legal", roleText: "答辩人\n(法人/非法人组织)", type: "legal" },
  ],
  showFactsAndReasons: true
};


export const constructionContractDisputeDefenseConfig: DefenseFormConfig = {
  caseType: '建设工程施工合同纠纷',
  title: '民事答辩状 (建设工程施工合同纠纷)',
  formId: 'construction_contract',
  defenseItemsConfig: [
    { id: "f1", title: "1. 对支付工程款的诉请有无异议", type: "objection", optimizationContext: "被告对原告要求支付工程款的请求的异议" },
    { id: "f2", title: "2. 对迟延支付工程款的利息(违约金)的请求有无异议", type: "objection", optimizationContext: "被告对原告要求支付迟延支付工程款的利息（违约金）的请求的异议" },
    { id: "f3", title: "3. 对原告享有建设工程价款优先受偿权的请求有无异议", type: "objection", optimizationContext: "被告对原告享有建设工程价款优先受偿权的请求的异议" },
    { id: "f4", title: "4. 对原告突破合同相对性请求承担支付工程款等责任的请求有无异议", type: "objection", optimizationContext: "被告对原告突破合同相对性请求被告承担支付工程款等责任的请求的异议" },
    { id: "f5", title: "5. 对退还超付的工程款的请求有无异议", type: "objection", optimizationContext: "被告对原告要求退还超付工程款的请求的异议" },
    { id: "f6", title: "6. 对支付超付工程款的利息的请求有无异议", type: "objection", optimizationContext: "被告对原告要求支付超付工程款利息的请求的异议" },
    { id: "f7", title: "7. 对赔偿损失的请求有无异议", type: "objection", optimizationContext: "被告对原告要求赔偿损失的请求的异议" },
    { id: "f8", title: "8. 对建设工程施工合同的效力的请求有无异议", type: "objection", optimizationContext: "被告对原告主张的建设工程施工合同效力的异议" },
    { id: "f9", title: "9. 对继续履行或者解除合同的请求有无异议", type: "objection", optimizationContext: "被告对原告要求继续履行或者解除合同的请求的异议" },
    { id: "f10", title: "10. 对实现债权的费用的请求有无异议", type: "objection", optimizationContext: "被告对原告要求支付实现债权费用的请求的异议" },
    { id: "f11", title: "11. 对诉讼费负担的请求有无异议", type: "objection", optimizationContext: "被告对原告要求承担诉讼费用的请求的异议" },
    { id: "f12", title: "12. 对其他请求有无异议", type: "objection", optimizationContext: "被告对原告其他请求的异议" },
    { id: "f13", title: "13. 对标的总额有无异议", type: "objection", optimizationContext: "被告对原告主张的标的总额的异议" },
  ],
  factsAndReasonsConfig: [
    { id: "f1", title: "1. 对合同签订情况", type: "objection", optimizationContext: "被告对合同签订情况的异议" },
    { id: "f2", title: "2. 对签订主体有无异议", type: "objection", optimizationContext: "被告对签订主体的异议" },
    { id: "f3", title: "3. 对建设工程情况有无异议", type: "objection", optimizationContext: "被告对建设工程情况的异议" },
    { id: "f4", title: "4. 对合同约定的工程款及支付方式有无异议", type: "objection", optimizationContext: "被告对合同约定的工程款及支付方式的异议" },
    { id: "f5", title: "5. 对建设工程的工期有无异议", type: "objection", optimizationContext: "被告对建设工程工期的异议" },
    { id: "f6", title: "6. 对合同约定的工程质量标准及竣工验收程序有无异议", type: "objection", optimizationContext: "被告对合同约定的工程质量标准及竣工验收程序的异议" },
    { id: "f7", title: "7. 对合同约定的违约金(保证金)有无异议", type: "objection", optimizationContext: "被告对合同约定的违约金（保证金）的异议" },
    { id: "f8", title: "8. 对工程款支付情况有无异议", type: "objection", optimizationContext: "被告对工程款支付情况的异议" },
    { id: "f9", title: "9. 对建设工程质量情况有无异议", type: "objection", optimizationContext: "被告对建设工程质量情况的异议" },
    { id: "f10", title: "10. 对建设工程交付情况有无异议", type: "objection", optimizationContext: "被告对建设工程交付情况的异议" },
    { id: "f11", title: "11. 对停窝工损失等情况有无异议", type: "objection", optimizationContext: "被告对停窝工损失等情况的异议" },
    { id: "f12", title: "12. 对原告享有建设工程价款优先受偿权有无异议", type: "objection", optimizationContext: "被告对原告享有建设工程价款优先受偿权的异议" },
    { id: "f13", title: "13. 对是否承担赔偿责任有无异议", type: "objection", optimizationContext: "被告对是否承担赔偿责任的异议" },
    { id: "f14", title: "14. 有无其他免责/减责事由有无异议", type: "objection", optimizationContext: "被告有无其他免责或减责事由" },
    { id: "f15", title: "15. 其他需要说明的内容 (可另附页)", type: "optimizable_textarea", optimizationContext: "被告其他需要说明的内容" },
    { id: "f16", title: "16. 答辩依据", type: "legal_analyze_textarea", placeholder: "详细写出答辩依据" },
    { id: "f17", title: "17. 证据清单 (可另附页)", type: "textarea" },
  ],
  partyBlueprint: [
    { path: "defendants_natural", roleText: "答辩人\n(自然人)", type: "natural" },
    { path: "defendants_legal", roleText: "答辩人\n(法人/非法人组织)", type: "legal" },
  ],
  showFactsAndReasons: true
};


export const laborDisputeDefenseConfig: DefenseFormConfig = {
  caseType: '劳动争议纠纷',
  title: '民事答辩状 (劳动争议纠纷)',
  formId: 'labor_dispute',
  defenseItemsConfig: [
    { id: "f1", title: "1. 对工资支付的诉请的确认或异议", type: "objection", optimizationContext: "被告对原告要求支付工资的请求的确认或异议",optionType: 'confirm_object' },
    { id: "f2", title: "2. 对未签订书面劳动合同双倍工资的诉请的确认或异议", type: "objection", optimizationContext: "被告对原告要求支付未签订书面劳动合同双倍工资的请求的确认或异议" ,optionType: 'confirm_object'},
    { id: "f3", title: "3. 对加班费的诉请的确认或异议", type: "objection", optimizationContext: "被告对原告要求支付加班费的请求的确认或异议" ,optionType: 'confirm_object'},
    { id: "f4", title: "4. 对未休年休假工资的诉请的确认或异议", type: "objection", optimizationContext: "被告对原告要求支付未休年休假工资的请求的确认或异议",optionType: 'confirm_object' },
    { id: "f5", title: "5. 对未依法缴纳社会保险费造成的经济损失的诉请的确认或异议", type: "objection", optimizationContext: "被告对原告要求赔偿未依法缴纳社会保险费造成的经济损失的请求的确认或异议",optionType: 'confirm_object' },
    { id: "f6", title: "6. 对解除劳动合同经济补偿的诉请的确认或异议", type: "objection", optimizationContext: "被告对原告要求支付解除劳动合同经济补偿的请求的确认或异议",optionType: 'confirm_object' },
    { id: "f7", title: "7. 对违法解除劳动合同赔偿金的诉请的确认或异议", type: "objection", optimizationContext: "被告对原告要求支付违法解除劳动合同赔偿金的请求的确认或异议" ,optionType: 'confirm_object'},
    { id: "f8", title: "8. 对劳动仲裁相关情况的确认或异议", type: "objection", optimizationContext: "被告对劳动仲裁相关情况的确认或异议" ,optionType: 'confirm_object'},
    { id: "f9", title: "9. 其他事由", type: "optimizable_textarea", optimizationContext: "被告针对本劳动争议纠纷的其他事由说明" },
    { id: "f10", title: "10. 答辩依据", type: "legal_analyze_textarea", optimizationContext: "被告的答辩依据" , placeholder: "（法律及司法解释的规定，要写明具体条文）"},
    { id: "f11", title: "11. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告证据清单" },
  ],
  factsAndReasonsConfig: [],
  partyBlueprint: [
    { path: "defendants_legal", roleText: "答辩人\n(法人/非法人组织)", type: "legal" },
  ],
};


// 离婚纠纷配置
export const divorceDisputeDefenseConfig: DefenseFormConfig = {
    caseType: '离婚纠纷',
    title: '民事答辩状 (离婚纠纷)',
    formId: 'divorce',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对解除婚姻关系的确认或异议", type: "objection", optimizationContext: "被告对原告解除婚姻关系的异议" },
        { id: "f2", title: "2. 对夫妻共同财产诉请的确认或异议", type: "objection", optimizationContext: "被告对夫妻共同财产诉请的异议" },
        { id: "f3", title: "3. 对夫妻共同债务诉请的确认或异议", type: "objection", optimizationContext: "被告对夫妻共同债务诉请的异议" },
        { id: "f4", title: "4. 对子女直接抚养诉请的确认或异议", type: "objection", optimizationContext: "被告对子女直接抚养诉请的异议" },
        { id: "f5", title: "5. 对子女抚养费诉请的确认或异议", type: "objection", optimizationContext: "被告对子女抚养费诉请的异议" },
        { id: "f6", title: "6. 对子女探望权诉请的确认或异议", type: "objection", optimizationContext: "被告对子女探望权诉请的异议" },
        { id: "f7", title: "7. 对赔偿/ 补偿/ 经济帮助的确认或异议", type: "objection", optimizationContext: "被告对原告赔偿/ 补偿/ 经济帮助的异议" },
        { id: "f8", title: "8. 其他事由", type: "optimizable_textarea", optimizationContext: "被告针对本离婚纠纷的其他事由说明" },
        { id: "f9", title: "9. 答辩依据", type: "legal_analyze_textarea", optimizationContext: "被告的答辩依据",withContractAnalysis:false },
        { id: "f10", title: "10. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告证据清单" },

    ],
    factsAndReasonsConfig: [],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人", type: "natural" },],
};

// 民间借贷纠纷配置
export const privateLendingDefenseConfig: DefenseFormConfig = {
    caseType: '民间借贷纠纷',
    title: '民事答辩状 (民间借贷纠纷)',
    formId: 'private_lending',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对本金有无异议", type: "objection", optimizationContext: "被告对原告主张的借款本金的异议" },
        { id: "f2", title: "2. 对利息有无异议", type: "objection", optimizationContext: "被告对原告主张的利息的异议" },
        { id: "f3", title: "3. 对提前还款或解除合同有无异议", type: "objection", optimizationContext: "被告对原告主张的提前还款或解除合同的异议" },
        { id: "f4", title: "4. 对担保权利诉请有无异议", type: "objection", optimizationContext: "被告对原告主张的担保权利的异议" },
        { id: "f5", title: "5. 对实现债权的费用有无异议", type: "objection", optimizationContext: "被告对原告主张的实现债权费用的异议" },
        { id: "f6", title: "6. 对诉讼费负担有无异议", type: "objection", optimizationContext: "被告对原告主张的诉讼费负担方式的异议" },
        { id: "f7", title: "7. 对其他请求有无异议", type: "objection", optimizationContext: "被告对原告提出的其他诉讼请求的异议" },
        { id: "f8", title: "8. 对标的总额有无异议", type: "objection", optimizationContext: "被告对原告诉讼请求总金额的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对合同签订情况 (名称、编号、签订时间、地点等) 有无异议", type: "objection", optimizationContext: "被告对借贷合同签订情况的说明和异议" },
        { id: "f2", title: "2. 对签订主体有无异议", type: "objection", optimizationContext: "被告对借贷合同签订主体的说明和异议" },
        { id: "f3", title: "3. 对借款金额有无异议", type: "objection", optimizationContext: "被告对借款金额的说明和异议" },
        { id: "f4", title: "4. 对借款期限有无异议", type: "objection", optimizationContext: "被告对借款期限的说明和异议" },
        { id: "f5", title: "5. 对借款利率有无异议", type: "objection", optimizationContext: "被告对借款利率的说明和异议" },
        { id: "f6", title: "6. 对借款提供时间有无异议", type: "objection", optimizationContext: "被告对借款提供时间的说明和异议" },
        { id: "f7", title: "7. 对还款方式有无异议", type: "objection", optimizationContext: "被告对还款方式的说明和异议" },
        { id: "f8", title: "8. 对还款情况有无异议", type: "objection", optimizationContext: "被告对还款情况的说明和异议" },
        { id: "f9", title: "9. 对是否逾期还款有无异议", type: "objection", optimizationContext: "被告对是否逾期还款的说明和异议" },
        { id: "f10", title: "10. 对是否签订物的担保合同有无异议", type: "objection", optimizationContext: "被告对是否签订物的担保合同的说明和异议" },
        { id: "f11", title: "11. 对担保人、担保物有无异议", type: "objection", optimizationContext: "被告对担保人、担保物的说明和异议" },
        { id: "f12", title: "12. 对最高额担保 (抵押、质押) 有无异议", type: "objection", optimizationContext: "被告对最高额担保情况的说明和异议" },
        { id: "f13", title: "13. 对是否办理抵押/质押登记有无异议", type: "objection", optimizationContext: "被告对是否办理抵押或质押登记的说明和异议" },
        { id: "f14", title: "14. 对是否签订保证合同有无异议", type: "objection", optimizationContext: "被告对是否签订保证合同的说明和异议" },
        { id: "f15", title: "15. 对保证方式有无异议", type: "objection", optimizationContext: "被告对保证方式（一般保证或连带责任保证）的说明和异议" },
        { id: "f16", title: "16. 对其他担保方式有无异议", type: "objection", optimizationContext: "被告对其他担保方式的说明和异议" },
        { id: "f17", title: "17. 有无其他免责/减责事由", type: "objection", optimizationContext: "被告主张的其他免责或减责事由" },
        { id: "f18", title: "18. 其他需要说明的内容 (可另附页)", type: "optimizable_textarea", optimizationContext: "被告就本民间借贷纠纷需要补充说明的其他内容" },
        { id: "f19", title: "19. 答辩依据", type: "legal_analyze_textarea", placeholder: "合同约定：\n法律规定：", optimizationContext: "被告的答辩依据，包括合同约定和法律规定" },
        { id: "f20", title: "20. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
    ],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人", type: "natural" },
    ],
};

export const guaranteeInsuranceDefenseConfig: DefenseFormConfig = {
    caseType: '保证保险合同纠纷',
    title: '民事答辩状 (保证保险合同纠纷)',
    formId: 'guarantee_insurance',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对理赔款有无异议", type: "objection", optimizationContext: "被告对原告主张的理赔款的异议" },
        { id: "f2", title: "2. 对保险费、违约金等有无异议", type: "objection", optimizationContext: "被告对原告主张的保险费、违约金等的异议" },
        { id: "f3", title: "3. 对实现债权的费用有无异议", type: "objection", optimizationContext: "被告对原告主张的实现债权费用的异议" },
        { id: "f4", title: "4. 对其他请求有无异议", type: "objection", optimizationContext: "被告对原告其他诉讼请求的异议" },
        { id: "f5", title: "5. 对标的总额有无异议", type: "objection", optimizationContext: "被告对原告诉讼请求总金额的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对保证保险合同的签订情况有无异议", type: "objection", optimizationContext: "被告对保证保险合同签订情况的说明和异议" },
        { id: "f2", title: "2. 对保证保险合同的主要约定有无异议", type: "objection", optimizationContext: "被告对保证保险合同主要约定的说明和异议" },
        { id: "f3", title: "3. 对原告对被告就保证保险合同主要条款进行提示注意、说明的情况有无异议", type: "objection", optimizationContext: "被告对原告是否就保证保险合同主要条款进行提示和说明的异议" },
        { id: "f4", title: "4. 对被告借款合同的主要约定有无异议", type: "objection", optimizationContext: "被告对被保险人（借款人）的借款合同主要约定的说明和异议" },
        { id: "f5", title: "5. 对被告逾期未还款情况有无异议", type: "objection", optimizationContext: "被告对被保险人（借款人）逾期未还款情况的说明和异议" },
        { id: "f6", title: "6. 对保证保险合同的履行情况有无异议", type: "objection", optimizationContext: "被告对保证保险合同履行情况的说明和异议" },
        { id: "f7", title: "7. 对追索情况有无异议", type: "objection", optimizationContext: "被告对原告追索情况的说明和异议" },
        { id: "f8", title: "8. 有无其他免责/减责事由", type: "objection", optimizationContext: "被告主张的其他免责或减责事由" },
        { id: "f9", title: "9. 答辩依据", type: "legal_analyze_textarea", placeholder: "合同约定：\n法律规定：", optimizationContext: "被告的答辩依据，包括合同约定和法律规定" },
        { id: "f10", title: "10. 其他需要说明的内容 (可另附页)", type: "optimizable_textarea", optimizationContext: "被告就本保证保险合同纠纷需要补充说明的其他内容" },
        { id: "f11", title: "11. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
    ],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" },
    ],
};

export const propertyInsuranceDefenseConfig: DefenseFormConfig = {
    caseType: '财产损失保险合同纠纷',
    title: '民事答辩状 (财产损失保险合同纠纷)',
    formId: 'property_damage_insurance',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对理赔款有无异议", type: "objection", optimizationContext: "被告对原告主张的理赔款的异议" },
        { id: "f2", title: "2. 对实现债权的费用有无异议", type: "objection", optimizationContext: "被告对原告主张的实现债权费用的异议" },
        { id: "f3", title: "3. 对其他请求有无异议", type: "objection", optimizationContext: "被告对原告其他诉讼请求的异议" },
        { id: "f4", title: "4. 对标的总额有无异议", type: "objection", optimizationContext: "被告对原告诉讼请求总金额的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对财产保险合同的签订情况有无异议", type: "objection", optimizationContext: "被告对财产保险合同签订情况的说明和异议" },
        { id: "f2", title: "2. 对财产保险合同的主要约定有无异议", type: "objection", optimizationContext: "被告对财产保险合同主要约定的说明和异议" },
        { id: "f3", title: "3. 对依法就财产保险合同中与投保人有重大利害关系的条款进行提示、说明有无异议", type: "objection", optimizationContext: "被告对保险人是否履行提示说明义务的异议" },
        { id: "f4", title: "4. 对保险事故发生的情况有无异议", type: "objection", optimizationContext: "被告对保险事故发生情况的说明和异议" },
        { id: "f5", title: "5. 对具体损失项目及其数额有无异议", type: "objection", optimizationContext: "被告对具体损失项目及数额的说明和异议" },
        { id: "f6", title: "6. 对财产保险合同的履行情况有无异议", type: "objection", optimizationContext: "被告对财产保险合同履行情况的说明和异议" },
        { id: "f7", title: "7. 有无其他免责/减责事由", type: "objection", optimizationContext: "被告主张的其他免责或减责事由" },
        { id: "f8", title: "8. 答辩依据", type: "legal_analyze_textarea", placeholder: "合同约定：\n法律规定：", optimizationContext: "被告的答辩依据，包括合同约定和法律规定" },
        { id: "f9", title: "9. 其他需要说明的内容 (可另附页)", type: "optimizable_textarea", optimizationContext: "被告就本财产损失保险合同纠纷需要补充说明的其他内容" },
        { id: "f10", title: "10. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
    ],
    partyBlueprint: [
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" },
    ],
};

export const shipCollisionDefenseConfig: DefenseFormConfig = {
    caseType: '船舶碰撞损害责任纠纷',
    title: '民事答辩状 (船舶碰撞损害责任纠纷)',
    formId: 'ship_collision_damage',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对碰撞船舶情况有无异议", type: "objection", optimizationContext: "被告对碰撞船舶基本情况的异议" },
        { id: "f2", title: "2. 对责任认定情况有无异议", type: "objection", optimizationContext: "被告对碰撞事故责任认定情况的异议" },
        { id: "f3", title: "3. 有无提交《海事事故调查表》", type: "objection", optimizationContext: "被告对是否提交《海事事故调查表》的说明" },
        { id: "f4", title: "4. 对船舶价值损失及利息有无异议", type: "objection", optimizationContext: "被告对船舶价值损失及利息的异议" },
        { id: "f5", title: "5. 对船舶修理损失及利息有无异议", type: "objection", optimizationContext: "被告对船舶修理损失及利息的异议" },
        { id: "f6", title: "6. 对船载货物损失及利息有无异议", type: "objection", optimizationContext: "被告对船载货物损失及利息的异议" },
        { id: "f7", title: "7. 对船上财物损失及利息有无异议", type: "objection", optimizationContext: "被告对船上财物损失及利息的异议" },
        { id: "f8", title: "8. 对救助费损失及利息有无异议", type: "objection", optimizationContext: "被告对救助费损失及利息的异议" },
        { id: "f9", title: "9. 对沉船勘查、打捞、清除及设置沉船标志费用损失及利息有无异议", type: "objection", optimizationContext: "被告对沉船处理相关费用的异议" },
        { id: "f10", title: "10. 对拖航费用损失及利息有无异议", type: "objection", optimizationContext: "被告对拖航费用损失及利息的异议" },
        { id: "f11", title: "11. 对本航次租金或运费损失及利息有无异议", type: "objection", optimizationContext: "被告对租金或运费损失及利息的异议" },
        { id: "f12", title: "12. 对船期损失及利息有无异议", type: "objection", optimizationContext: "被告对船期损失及利息的异议" },
        { id: "f13", title: "13. 对共同海损分摊损失有无异议", type: "objection", optimizationContext: "被告对共同海损分摊损失的异议" },
        { id: "f14", title: "14. 对其他合理费用的损失有无异议", type: "objection", optimizationContext: "被告对其他合理费用损失的异议" },
        { id: "f15", title: "15. 对人身伤亡损失有无异议", type: "objection", optimizationContext: "被告对人身伤亡损失的异议" },
        { id: "f16", title: "16. 有无设立海事赔偿责任限制基金", type: "objection", optimizationContext: "被告对是否设立海事赔偿责任限制基金的说明" },
        { id: "f17", title: "17. 答辩依据", type: "legal_analyze_textarea", placeholder: "(法律规定)", optimizationContext: "被告的答辩法律依据" },
        { id: "f18", title: "18. 其他需要说明的内容 (可另附页)", type: "optimizable_textarea", optimizationContext: "被告就本船舶碰撞纠纷需补充说明的其他内容" },
        { id: "f19", title: "19. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
    ],
    factsAndReasonsConfig: [],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" }
    ],
};

export const seafarerLaborDefenseConfig: DefenseFormConfig = {
    caseType: '船员劳务合同纠纷',
    title: '民事答辩状 (船员劳务合同纠纷)',
    formId: 'seafarer_labor_contract',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对工资支付诉请的确认和异议", type: "objection", optionType: 'confirm_object', optimizationContext: "被告对原告工资支付诉请的确认或异议" },
        { id: "f2", title: "2. 对遣返费用诉请的确认和异议", type: "objection", optionType: 'confirm_object', optimizationContext: "被告对原告遣返费用诉请的确认或异议" },
        { id: "f3", title: "3. 对其他报酬或费用诉请的确认和异议", type: "objection", optionType: 'confirm_object', optimizationContext: "被告对原告其他报酬或费用诉请的确认或异议" },
        { id: "f4", title: "4. 对费用总额的确认和异议", type: "objection", optionType: 'confirm_object', optimizationContext: "被告对原告诉请总金额的确认或异议" },
        { id: "f5", title: "5. 对船舶优先权诉请的确认和异议", type: "objection", optionType: 'confirm_object', optimizationContext: "被告对原告主张船舶优先权的确认或异议" },
        { id: "f6", title: "6. 对仲裁相关情况的确认和异议", type: "objection", optionType: 'confirm_object', optimizationContext: "被告对案件仲裁相关情况的确认或异议" },
        { id: "f7", title: "7. 其他事由", type: "optimizable_textarea", optimizationContext: "被告就本船员劳务合同纠纷的其他事由说明" },
        { id: "f8", title: "8. 答辩依据", type: "legal_analyze_textarea", placeholder: "合同约定：\n法律规定：(法律及司法解释的规定，要写明具体条文)", optimizationContext: "被告的答辩依据，包括合同约定和法律规定" },
        { id: "f9", title: "9. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
    ],
    factsAndReasonsConfig: [],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" }
    ],
};

export const housingSalesDefenseConfig: DefenseFormConfig = {
    caseType: '房屋买卖合同纠纷',
    title: '民事答辩状 (房屋买卖合同纠纷)',
    formId: 'housing_sales_contract',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对房屋买卖合同关系诉请的确认或异议", type: "objection", optimizationContext: "被告对房屋买卖合同关系的异议" },
        { id: "f2", title: "2. 对购房款诉请的确认或异议", type: "objection", optimizationContext: "被告对购房款诉请的异议" },
        { id: "f3", title: "3. 对交付房屋诉请的确认或异议", type: "objection", optimizationContext: "被告对交付房屋诉请的异议" },
        { id: "f4", title: "4. 对办理房屋登记手续诉请的确认或异议", type: "objection", optimizationContext: "被告对办理房屋登记手续诉请的异议" },
        { id: "f5", title: "5. 对中介服务费诉请的确认或异议", type: "objection", optimizationContext: "被告对中介服务费诉请的异议" },
        { id: "f6", title: "6. 对质量损害赔偿诉请的确认或异议", type: "objection", optimizationContext: "被告对质量损害赔偿诉请的异议" },
        { id: "f7", title: "7. 对解除担保贷款（按揭）合同诉请的确认或异议", type: "objection", optimizationContext: "被告对解除按揭合同诉请的异议" },
        { id: "f8", title: "8. 对鉴定费及其他实现债权费用诉请的确认或异议", type: "objection", optimizationContext: "被告对鉴定费等其他费用的异议" },
        { id: "f9", title: "9. 对诉讼费负担有无异议", type: "objection", optimizationContext: "被告对诉讼费负担方式的异议" },
        { id: "f10", title: "10. 对其他请求有无异议", type: "objection", optimizationContext: "被告对其他诉讼请求的异议" },
        { id: "f11", title: "11. 对标的总额有无异议", type: "objection", optimizationContext: "被告对诉讼请求总金额的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对房屋买卖合同订立情况（预约还是本约、签订时间、是否有格式条款等）有无异议", type: "objection", optimizationContext: "被告对房屋买卖合同订立情况的说明和异议" },
        { id: "f2", title: "2. 对购房款支付情况有无异议", type: "objection", optimizationContext: "被告对购房款支付情况的说明和异议" },
        { id: "f3", title: "3. 对房屋交付情况（交付时间、交付标准）有无异议", type: "objection", optimizationContext: "被告对房屋交付情况的说明和异议" },
        { id: "f4", title: "4. 对房屋登记手续办理情况（预告登记、首次登记、转移登记）有无异议", type: "objection", optimizationContext: "被告对房屋登记手续办理情况的说明和异议" },
        { id: "f5", title: "5. 对中介服务费承担等情况有无异议", type: "objection", optimizationContext: "被告对中介服务费承担情况的说明和异议" },
        { id: "f6", title: "6. 对房屋质量有无异议", type: "objection", optimizationContext: "被告对房屋质量的说明和异议" },
        { id: "f7", title: "7. 对担保（按揭）解除有无异议", type: "objection", optimizationContext: "被告对按揭贷款解除情况的说明和异议" },
        { id: "f8", title: "8. 有无其他免责/减责事由", type: "objection", optimizationContext: "被告主张的其他免责或减责事由" },
        { id: "f9", title: "9. 其他需要说明的内容 (可另附页)", type: "optimizable_textarea", optimizationContext: "被告就本房屋买卖纠纷需要补充说明的其他内容" },
        { id: "f10", title: "10. 答辩依据", type: "legal_analyze_textarea", placeholder: "合同约定：\n法律规定：", optimizationContext: "被告的答辩依据，包括合同约定和法律规定" },
        { id: "f11", title: "11. 证据清单 (可另附页)", type: "textarea", placeholder: "(买卖合同、转账凭证、房屋交付签收单等)", optimizationContext: "被告方的证据清单" },
    ],
    partyBlueprint: [
                {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" }
    ],
};

export const housingLeaseDefenseConfig: DefenseFormConfig = {
    caseType: '房屋租赁合同纠纷',
    title: '民事答辩状 (房屋租赁合同纠纷)',
    formId: 'housing_lease',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对支付租金的诉请有无异议", type: "objection", optimizationContext: "被告对原告支付租金诉请的异议" },
        { id: "f2", title: "2. 对迟延支付租金的利息（违约金）有无异议", type: "objection", optimizationContext: "被告对迟延支付租金利息或违约金的异议" },
        { id: "f3", title: "3. 对交付标的物有无异议", type: "objection", optimizationContext: "被告对交付租赁物的异议" },
        { id: "f4", title: "4. 对解除合同有无异议", type: "objection", optimizationContext: "被告对解除租赁合同的异议" },
        { id: "f5", title: "5. 对返还租赁物/押金并赔偿损失有无异议", type: "objection", optimizationContext: "被告对返还租赁物/押金及赔偿损失的异议" },
        { id: "f6", title: "6. 对实现债权的费用有无异议", type: "objection", optimizationContext: "被告对实现债权费用的异议" },
        { id: "f7", title: "7. 对诉讼费负担有无异议", type: "objection", optimizationContext: "被告对诉讼费负担方式的异议" },
        { id: "f8", title: "8. 对其他请求有无异议", type: "objection", optimizationContext: "被告对其他诉讼请求的异议" },
        { id: "f9", title: "9. 对标的总额有无异议", type: "objection", optimizationContext: "被告对诉讼请求总金额的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对合同签订情况（名称、编号、签订时间、地点等）有无异议", type: "objection", optimizationContext: "被告对租赁合同签订情况的说明和异议" },
        { id: "f2", title: "2. 对签订主体有无异议", type: "objection", optimizationContext: "被告对租赁合同签订主体的说明和异议" },
        { id: "f3", title: "3. 对租赁标的物情况（坐落位置、面积、产权情况等）有无异议", type: "objection", optimizationContext: "被告对租赁物情况的说明和异议" },
        { id: "f4", title: "4. 对合同约定租赁期限有无异议", type: "objection", optimizationContext: "被告对租赁期限的说明和异议" },
        { id: "f5", title: "5. 对合同约定的租金及支付方式有无异议", type: "objection", optimizationContext: "被告对租金及支付方式的说明和异议" },
        { id: "f6", title: "6. 对其他费用的约定有无异议", type: "objection", optimizationContext: "被告对其他费用约定的说明和异议" },
        { id: "f7", title: "7. 对合同约定的违约责任有无异议", type: "objection", optimizationContext: "被告对违约责任约定的说明和异议" },
        { id: "f8", title: "8. 对是否约定合同解除条件有无异议", type: "objection", optimizationContext: "被告对合同解除条件的说明和异议" },
        { id: "f9", title: "9. 对租赁物交付时间有无异议", type: "objection", optimizationContext: "被告对租赁物交付时间的说明和异议" },
        { id: "f10", title: "10. 对押金约定情况有无异议", type: "objection", optimizationContext: "被告对押金约定的说明和异议" },
        { id: "f11", title: "11. 对租金支付情况有无异议", type: "objection", optimizationContext: "被告对租金支付情况的说明和异议" },
        { id: "f12", title: "12. 对逾期未付租金情况有无异议", type: "objection", optimizationContext: "被告对逾期未付租金情况的说明和异议" },
        { id: "f13", title: "13. 有无其他免责/减责事由", type: "objection", optimizationContext: "被告主张的其他免责或减责事由" },
        { id: "f14", title: "14. 其他需要说明的内容 (可另附页)", type: "optimizable_textarea", optimizationContext: "被告就本房屋租赁纠纷需要补充说明的其他内容" },
        { id: "f15", title: "15. 答辩依据", type: "legal_analyze_textarea", placeholder: "合同约定：\n法律规定：", optimizationContext: "被告的答辩依据，包括合同约定和法律规定" },
        { id: "f16", title: "16. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
    ],
    partyBlueprint: [
                {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" }
    ],
};

export const maritimeFreightForwardingDefenseConfig: DefenseFormConfig = {
    caseType: '海上、通海水域货运代理合同纠纷',
    title: '民事答辩状 (海上、通海水域货运代理合同纠纷)',
    formId: 'maritime_freight_forwarding',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对有关费用有无异议", type: "objection", optimizationContext: "被告对原告主张的相关费用的异议" },
        { id: "f2", title: "2. 对逾期付款利息损失有无异议", type: "objection", optimizationContext: "被告对逾期付款利息损失的异议" },
        { id: "f3", title: "3. 对实现债权的费用有无异议", type: "objection", optimizationContext: "被告对实现债权费用的异议" },
        { id: "f4", title: "4. 对其他请求有无异议", type: "objection", optimizationContext: "被告对其他诉讼请求的异议" },
        { id: "f5", title: "5. 对标的总额有无异议", type: "objection", optimizationContext: "被告对诉讼请求总金额的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对合同签订情况有无异议", type: "objection", optimizationContext: "被告对货运代理合同签订情况的说明和异议" },
        { id: "f2", title: "2. 对合同主体有无异议", type: "objection", optimizationContext: "被告对货运代理合同主体的说明和异议" },
        { id: "f3", title: "3. 对约定金额有无异议", type: "objection", optimizationContext: "被告对合同约定金额的说明和异议" },
        { id: "f4", title: "4. 对实际支付金额有无异议", type: "objection", optimizationContext: "被告对实际支付金额的说明和异议" },
        { id: "f5", title: "5. 对付款期限有无异议", type: "objection", optimizationContext: "被告对付款期限的说明和异议" },
        { id: "f6", title: "6. 对委托事项内容有无异议", type: "objection", optimizationContext: "被告对委托事项内容的说明和异议" },
        { id: "f7", title: "7. 对委托事项完成情况有无异议", type: "objection", optimizationContext: "被告对委托事项完成情况的说明和异议" },
        { id: "f8", title: "8. 对费用对账有无异议", type: "objection", optimizationContext: "被告对费用对账情况的说明和异议" },
        { id: "f9", title: "9. 对开具发票情况有无异议", type: "objection", optimizationContext: "被告对开具发票情况的说明和异议" },
        { id: "f10", title: "10. 答辩依据", type: "legal_analyze_textarea", placeholder: "合同约定：\n法律规定：", optimizationContext: "被告的答辩依据，包括合同约定和法律规定" },
        { id: "f11", title: "11. 其他需要说明的内容 (可另附页)", type: "optimizable_textarea", optimizationContext: "被告就本货运代理合同纠纷需要补充说明的其他内容" },
        { id: "f12", title: "12. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
    ],
    partyBlueprint: [
                {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" }
        
    ],
};

export const maritimePersonalInjuryDefenseConfig: DefenseFormConfig = {
    caseType: '海上、通海水域人身损害责任纠纷',
    title: '民事答辩状 (海上、通海水域人身损害责任纠纷)',
    formId: 'maritime_personal_injury',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对船员因劳务发生伤亡事故有无异议", type: "objection", optimizationContext: "被告对船员伤亡事故事实的异议" },
        { id: "f2", title: "2. 对事故调查报告有无异议", type: "objection", optimizationContext: "被告对事故调查报告的异议" },
        { id: "f3", title: "3. 对各项费用有无异议", type: "objection", optimizationContext: "被告对原告主张的各项费用的异议" },
        { id: "f4", title: "4. 对鉴定意见有无异议", type: "objection", optimizationContext: "被告对鉴定意见的异议" },
        { id: "f5", title: "5. 对船舶优先权有无异议", type: "objection", optimizationContext: "被告对原告主张船舶优先权的异议" },
        { id: "f6", title: "6. 答辩依据", type: "legal_analyze_textarea", placeholder: "合同约定：\n法律规定：", optimizationContext: "被告的答辩依据，包括合同约定和法律规定" },
        { id: "f7", title: "7. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
    ],
    factsAndReasonsConfig: [],
    partyBlueprint: [
                {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" }
    ],
};


export const trafficAccidentDefenseConfig: DefenseFormConfig = {
    caseType: '机动车交通事故责任纠纷',
    title: '民事答辩状 (机动车交通事故责任纠纷)',
    formId: 'traffic_accident',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对交通事故事实有无异议", type: "objection", optimizationContext: "被告对交通事故事实的异议" },
        { id: "f2", title: "2. 对交通事故责任认定有无异议", type: "objection", optimizationContext: "被告对交通事故责任认定的异议" },
        { id: "f3", title: "3. 对各项费用有无异议", type: "objection", optimizationContext: "被告对原告主张的各项赔偿费用的异议" },
        { id: "f4", title: "4. 对鉴定意见有无异议", type: "objection", optimizationContext: "被告对鉴定意见的异议" },
        { id: "f5", title: "5. 对原告诉讼请求有无异议", type: "objection", optimizationContext: "被告对原告全部诉讼请求的综合异议" },
        { id: "f6", title: "6. 车辆投保情况", type: "optimizable_textarea", optimizationContext: "被告对事故车辆的投保情况说明" },
        { id: "f7", title: "7. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
    ],
    factsAndReasonsConfig: [],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" }
    ],
};

export const environmentalPollutionDefenseConfig: DefenseFormConfig = {
    caseType: '环境污染民事公益诉讼',
    title: '民事答辩状 (环境污染民事公益诉讼)',
    formId: 'environmental_pollution_public_interest',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对停止侵害诉讼请求有无异议", type: "objection", optimizationContext: "被告对停止侵害诉讼请求的异议" },
        { id: "f2", title: "2. 对排除妨碍诉讼请求有无异议", type: "objection", optimizationContext: "被告对排除妨碍诉讼请求的异议" },
        { id: "f3", title: "3. 对消除环境危险诉讼请求有无异议", type: "objection", optimizationContext: "被告对消除环境危险诉讼请求的异议" },
        { id: "f4", title: "4. 对修复生态环境诉讼请求（或具体方式）有无异议", type: "objection", optimizationContext: "被告对修复生态环境诉讼请求的异议" },
        { id: "f5", title: "5. 对赔偿损失诉讼请求（总数，包括利息）有无异议", type: "objection", optimizationContext: "被告对赔偿损失诉讼请求的异议" },
        { id: "f6", title: "6. 对赔礼道歉诉讼请求有无异议", type: "objection", optimizationContext: "被告对赔礼道歉诉讼请求的异议" },
        { id: "f7", title: "7. 对其他诉讼请求有无异议", type: "objection", optimizationContext: "被告对其他诉讼请求的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对原告主体资格有无异议", type: "objection", optimizationContext: "被告对原告主体资格的异议" },
        { id: "f2", title: "2. 对环境污染行为有无异议", type: "objection", optimizationContext: "被告对被指控的环境污染行为的异议" },
        { id: "f3", title: "3. 对造成损害事实或损害重大风险有无异议", type: "objection", optimizationContext: "被告对损害事实或重大风险的异议" },
        { id: "f4", title: "4. 对污染行为与损害结果之间的因果关系有无异议", type: "objection", optimizationContext: "被告对污染行为与损害结果之间因果关系的异议" },
        { id: "f5", title: "5. 有无其他免责/减轻责任的事由", type: "objection", optimizationContext: "被告主张的其他免责或减轻责任事由" },
        { id: "f6", title: "6. 答辩依据的法律、行政法规等规定 (可另附页)", type: "legal_analyze_textarea", optimizationContext: "被告的答辩法律依据" },
        { id: "f7", title: "7. 其他需要说明的内容 (可另附页)", type: "objection", optimizationContext: "被告就本环境污染公益诉讼需要补充说明的其他内容" },
        { id: "f8", title: "8. 证据清单 (可另附页)", type: "textarea", placeholder: "1. 合法开展生产经营，未污染环境、破坏生态的证据材料\n2. 对原告证据的质证意见\n3. 已经开展生态环境修复的证据材料\n……", optimizationContext: "被告方的证据清单" },
    ],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" }
    ],
};

export const financialLoanDefenseConfig: DefenseFormConfig = {
    caseType: '金融借款合同纠纷',
    title: '民事答辩状 (金融借款合同纠纷)',
    formId: 'financial_loan_contract',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对本金有无异议", type: "objection", optimizationContext: "被告对原告主张的借款本金的异议" },
        { id: "f2", title: "2. 对利息（期内利息、复利、罚息）有无异议", type: "objection", optimizationContext: "被告对原告主张的利息、复利、罚息的异议" },
        { id: "f3", title: "3. 对提前还款或解除合同有无异议", type: "objection", optimizationContext: "被告对提前还款或解除合同的异议" },
        { id: "f4", title: "4. 对担保权利诉请有无异议", type: "objection", optimizationContext: "被告对原告主张的担保权利的异议" },
        { id: "f5", title: "5. 对实现债权的费用有无异议", type: "objection", optimizationContext: "被告对原告主张的实现债权费用的异议" },
        { id: "f6", title: "6. 对其他请求有无异议", type: "objection", optimizationContext: "被告对原告其他诉讼请求的异议" },
        { id: "f7", title: "7. 对标的总额有无异议", type: "objection", optimizationContext: "被告对原告诉讼请求总金额的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对合同签订情况（名称、编号、签订时间、地点等）有无异议", type: "objection", optimizationContext: "被告对借款合同签订情况的说明和异议" },
        { id: "f2", title: "2. 对合同主体有无异议", type: "objection", optimizationContext: "被告对借款合同主体的说明和异议" },
        { id: "f3", title: "3. 对借款金额有无异议", type: "objection", optimizationContext: "被告对借款金额的说明和异议" },
        { id: "f4", title: "4. 对借款期限有无异议", type: "objection", optimizationContext: "被告对借款期限的说明和异议" },
        { id: "f5", title: "5. 对借款利率有无异议", type: "objection", optimizationContext: "被告对借款利率的说明和异议" },
        { id: "f6", title: "6. 对借款发放时间有无异议", type: "objection", optimizationContext: "被告对借款发放时间的说明和异议" },
        { id: "f7", title: "7. 对还款方式有无异议", type: "objection", optimizationContext: "被告对还款方式的说明和异议" },
        { id: "f8", title: "8. 对还款情况有无异议", type: "objection", optimizationContext: "被告对还款情况的说明和异议" },
        { id: "f9", title: "9. 对是否逾期还款有无异议", type: "objection", optimizationContext: "被告对是否逾期还款的说明和异议" },
        { id: "f10", title: "10. 对是否签订物的担保合同有无异议", type: "objection", optimizationContext: "被告对是否签订物的担保合同的说明和异议" },
        { id: "f11", title: "11. 对担保人、担保物有无异议", type: "objection", optimizationContext: "被告对担保人、担保物的说明和异议" },
        { id: "f12", title: "12. 对最高额抵押担保有无异议", type: "objection", optimizationContext: "被告对最高额抵押担保的说明和异议" },
        { id: "f13", title: "13. 对是否办理抵押/质押登记有无异议", type: "objection", optimizationContext: "被告对是否办理抵押或质押登记的说明和异议" },
        { id: "f14", title: "14. 对是否签订保证合同/保函有无异议", type: "objection", optimizationContext: "被告对是否签订保证合同或保函的说明和异议" },
        { id: "f15", title: "15. 对保证方式有无异议", type: "objection", optimizationContext: "被告对保证方式（一般保证或连带责任保证）的说明和异议" },
        { id: "f16", title: "16. 对其他担保方式有无异议", type: "objection", optimizationContext: "被告对其他担保方式的说明和异议" },
        { id: "f17", title: "17. 有无其他免责/减责事由", type: "objection", optimizationContext: "被告主张的其他免责或减责事由" },
        { id: "f18", title: "18. 答辩依据", type: "legal_analyze_textarea", placeholder: "合同约定：\n法律规定：", optimizationContext: "被告的答辩依据，包括合同约定和法律规定" },
        { id: "f19", title: "19. 其他需要说明的内容 (可另附页)", type: "optimizable_textarea", optimizationContext: "被告就本金融借款纠纷需要补充说明的其他内容" },
        { id: "f20", title: "20. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
    ],
    partyBlueprint: [
                {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" }
    ],
};

export const technologyContractDefenseConfig: DefenseFormConfig = {
    caseType: '技术合同纠纷',
    title: '民事答辩状 (技术合同纠纷)',
    formId: 'technology_contract',
    defenseItemsConfig: [
        { id: "f1", title: "1. 继续履行或是解除合同", type: "optimizable_textarea", placeholder: "请勾选并填写：\n☐ 继续履行，于____日内履行完毕\n☐ 解除合同\n☐ 确认合同已于____年__月__日解除", optimizationContext: "被告对继续履行或解除合同诉请的意见" },
        { id: "f2", title: "2. 对给付价款有无异议", type: "objection", optimizationContext: "被告对给付价款诉请的异议" },
        { id: "f3", title: "3. 对迟延给付价款的利息（违约金）有无异议", type: "objection", optimizationContext: "被告对迟延给付价款利息或违约金的异议" },
        { id: "f4", title: "4. 对赔偿违约所受的损失有无异议", type: "objection", optimizationContext: "被告对赔偿违约损失的异议" },
        { id: "f5", title: "5. 对诉讼费用有无异议", type: "objection", optimizationContext: "被告对诉讼费用承担的异议" },
        { id: "f6", title: "6. 对其他请求有无异议", type: "objection", optimizationContext: "被告对其他诉讼请求的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对技术合同的签订情况（技术领域，项目的名称，标的的内容、范围和要求，履行的计划、地点和方式，技术成果的归属和收益的分配办法，验收标准和方法等）有无异议", type: "objection", optimizationContext: "被告对技术合同签订情况及主要条款的说明和异议" },
        { id: "f2", title: "2. 对合同签订主体有无异议", type: "objection", optimizationContext: "被告对合同签订主体的说明和异议" },
        { id: "f3", title: "3. 对约定的合同期限有无异议", type: "objection", optimizationContext: "被告对合同期限的说明和异议" },
        { id: "f4", title: "4. 对约定的给付价款、报酬、使用费及支付方式有无异议", type: "objection", optimizationContext: "被告对合同价款及支付方式的说明和异议" },
        { id: "f5", title: "5. 对约定的给付价款利息（违约金）及计算方式有无异议", type: "objection", optimizationContext: "被告对违约金约定的说明和异议" },
        { id: "f6", title: "6. 对技术合同履约情况有无异议", type: "objection", optimizationContext: "被告对技术合同履约情况的说明和异议" },
        { id: "f7", title: "7. 其他异议及依据 (可另附页)", type: "objection", optimizationContext: "被告提出的其他异议及其依据" },
        { id: "f8", title: "8. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
        { id: "f9", title: "9. 质证清单 (可另附页)", type: "textarea", optimizationContext: "被告对原告证据的质证意见清单" },
    ],
    partyBlueprint: [
                {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" }
    ],
};

export const monopolyDefenseConfig: DefenseFormConfig = {
    caseType: '垄断纠纷',
    title: '民事答辩状 (垄断纠纷)',
    formId: 'monopoly_dispute',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对停止垄断行为有无异议", type: "objection", optimizationContext: "被告对停止垄断行为诉请的异议" },
        { id: "f2", title: "2. 对赔偿经济损失有无异议", type: "objection", optimizationContext: "被告对赔偿经济损失诉请的异议" },
        { id: "f3", title: "3. 对赔偿维权合理开支有无异议", type: "objection", optimizationContext: "被告对赔偿维权合理开支诉请的异议" },
        { id: "f4", title: "4. 对承担连带赔偿责任有无异议", type: "objection", optimizationContext: "被告对承担连带赔偿责任诉请的异议" },
        { id: "f5", title: "5. 对非金钱给付义务迟延履行金有无异议", type: "objection", optimizationContext: "被告对迟延履行金诉请的异议" },
        { id: "f6", title: "6. 对诉讼费用有无异议", type: "objection", optimizationContext: "被告对诉讼费用承担方式的异议" },
        { id: "f7", title: "7. 对其他请求有无异议", type: "objection", optimizationContext: "被告对其他诉讼请求的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对原告资格是否有异议", type: "objection", optimizationContext: "被告对原告主体资格的说明和异议" },
        { id: "f2", title: "2. 对相关市场界定是否有异议", type: "objection", optimizationContext: "被告对相关市场界定（包括具体时间范围内的商品市场、地域市场）的说明和异议" },
        { id: "f3", title: "3. 对被诉垄断行为具体情况有无异议", type: "objection", placeholder: "请根据案件情况选择填写：\n(适用于垄断协议纠纷)\n被诉垄断行为不能成立，主要理由为：\n被告未达成/实施垄断协议。具体分析：\n涉案协议不具有排除、限制竞争效果。具体分析：\n\n(适用于滥用市场支配地位纠纷)\n被诉垄断行为不能成立，主要理由为：\n被告不具有市场支配地位。具体分析：\n被告未实施垄断定价/掠夺定价/拒绝交易/限定交易/捆绑交易/差别待遇的行为。具体分析：\n涉案行为不具有排除、限制竞争效果。具体分析：", optimizationContext: "被告对被诉垄断行为具体情况的说明和异议" },
        { id: "f4", title: "4. 对被诉共同侵权有无异议", type: "objection", optimizationContext: "被告对被诉共同侵权的说明和异议" },
        { id: "f5", title: "5. 对赔偿数额和具体赔偿项目有无异议", type: "objection", optimizationContext: "被告对赔偿数额和具体赔偿项目的说明和异议" },
        { id: "f6", title: "6. 其他抗辩事由", type: "objection", optimizationContext: "被告提出的其他抗辩事由" },
        { id: "f7", title: "7. 法律依据", type: "legal_analyze_textarea", optimizationContext: "被告的答辩法律依据" },
    ],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" },
    ],
};

export const salesContractDefenseConfig: DefenseFormConfig = {
    caseType: '买卖合同纠纷',
    title: '民事答辩状 (买卖合同纠纷)',
    formId: 'sales_contract',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对给付价款的诉请有无异议", type: "objection", optimizationContext: "被告对给付价款诉请的异议" },
        { id: "f2", title: "2. 对迟延给付价款的利息（违约金）有无异议", type: "objection", optimizationContext: "被告对迟延给付价款利息或违约金的异议" },
        { id: "f3", title: "3. 对要求继续履行或是解除合同有无异议", type: "objection", optimizationContext: "被告对继续履行或解除合同的异议" },
        { id: "f4", title: "4. 对赔偿因违约所受的损失有无异议", type: "objection", optimizationContext: "被告对赔偿违约损失的异议" },
        { id: "f5", title: "5. 对就标的物的瑕疵承担责任有无异议", type: "objection", optimizationContext: "被告对标的物瑕疵责任的异议" },
        { id: "f6", title: "6. 对担保权利的诉请有无异议", type: "objection", optimizationContext: "被告对担保权利诉请的异议" },
        { id: "f7", title: "7. 对实现债权的费用有无异议", type: "objection", optimizationContext: "被告对实现债权费用的异议" },
        { id: "f8", title: "8. 对其他请求有无异议", type: "objection", optimizationContext: "被告对其他诉讼请求的异议" },
        { id: "f9", title: "9. 对标的总额有无异议", type: "objection", optimizationContext: "被告对诉讼请求总金额的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对合同签订情况（名称、编号、签订时间、地点）有无异议", type: "objection", optimizationContext: "被告对买卖合同签订情况的说明和异议" },
        { id: "f2", title: "2. 对合同主体有无异议", type: "objection", optimizationContext: "被告对买卖合同主体的说明和异议" },
        { id: "f3", title: "3. 对标的物情况有无异议", type: "objection", optimizationContext: "被告对标的物情况的说明和异议" },
        { id: "f4", title: "4. 对合同约定的价格及支付方式有无异议", type: "objection", optimizationContext: "被告对价格及支付方式的说明和异议" },
        { id: "f5", title: "5. 对合同约定的交货时间、地点、方式、风险承担、安装、调试、验收有无异议", type: "objection", optimizationContext: "被告对交货及验收相关约定的说明和异议" },
        { id: "f6", title: "6. 对合同约定的质量标准及检验方式、质量异议期限有无异议", type: "objection", optimizationContext: "被告对质量及检验相关约定的说明和异议" },
        { id: "f7", title: "7. 对合同约定的违约金（定金）有无异议", type: "objection", optimizationContext: "被告对违约金或定金约定的说明和异议" },
        { id: "f8", title: "8. 对价款支付及标的物交付情况有无异议", type: "objection", optimizationContext: "被告对价款支付及标的物交付情况的说明和异议" },
        { id: "f9", title: "9. 对是否存在迟延履行有无异议", type: "objection", optimizationContext: "被告对是否存在迟延履行的说明和异议" },
        { id: "f10", title: "10. 对是否催促过履行有无异议", type: "objection", optimizationContext: "被告对是否催促过履行的说明和异议" },
        { id: "f11", title: "11. 对买卖合同标的物有无质量争议有无异议", type: "objection", optimizationContext: "被告对标的物是否存在质量争议的说明和异议" },
        { id: "f12", title: "12. 对标的物质量规格或履行方式是否存在不符合约定的情况有无异议", type: "objection", optimizationContext: "被告对标的物质量规格或履行方式是否符合约定的说明和异议" },
        { id: "f13", title: "13. 对是否曾就标的物质量问题进行协商有无异议", type: "objection", optimizationContext: "被告对是否曾协商质量问题的说明和异议" },
        { id: "f14", title: "14. 对是否通知解除合同有无异议", type: "objection", optimizationContext: "被告对是否曾通知解除合同的说明和异议" },
        { id: "f15", title: "15. 对应当支付的利息、违约金、赔偿金有无异议", type: "objection", optimizationContext: "被告对应付利息、违约金、赔偿金的说明和异议" },
        { id: "f16", title: "16. 对是否签订物的担保合同有无异议", type: "objection", optimizationContext: "被告对是否签订物的担保合同的说明和异议" },
        { id: "f17", title: "17. 对担保人、担保物有无异议", type: "objection", optimizationContext: "被告对担保人、担保物的说明和异议" },
        { id: "f18", title: "18. 对最高额抵押担保有无异议", type: "objection", optimizationContext: "被告对最高额抵押担保的说明和异议" },
        { id: "f19", title: "19. 对是否办理抵押/质押登记有无异议", type: "objection", optimizationContext: "被告对是否办理抵押或质押登记的说明和异议" },
        { id: "f20", title: "20. 对是否签订保证合同有无异议", type: "objection", optimizationContext: "被告对是否签订保证合同的说明和异议" },
        { id: "f21", title: "21. 对保证方式有无异议", type: "objection", optimizationContext: "被告对保证方式的说明和异议" },
        { id: "f22", title: "22. 对其他担保方式有无异议", type: "objection", optimizationContext: "被告对其他担保方式的说明和异议" },
        { id: "f23", title: "23. 有无其他免责/减责事由", type: "objection", optimizationContext: "被告主张的其他免责或减责事由" },
        { id: "f24", title: "24. 答辩依据", type: "legal_analyze_textarea", placeholder: "合同约定：\n法律规定：", optimizationContext: "被告的答辩依据，包括合同约定和法律规定" },
        { id: "f25", title: "25. 其他需要说明的内容 (可另附页)", type: "optimizable_textarea", optimizationContext: "被告就本买卖合同纠纷需要补充说明的其他内容" },
        { id: "f26", title: "26. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
    ],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" },
    ],
};

export const inventionPatentDefenseConfig: DefenseFormConfig = {
    caseType: '侵害发明专利权纠纷',
    title: '民事答辩状 (侵害发明专利权纠纷)',
    formId: 'invention_patent_infringement',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对停止侵害有无异议", type: "objection", optimizationContext: "被告对停止侵害诉请的异议" },
        { id: "f2", title: "2. 对赔偿经济损失有无异议", type: "objection", optimizationContext: "被告对赔偿经济损失诉请的异议" },
        { id: "f3", title: "3. 对赔偿维权合理开支有无异议", type: "objection", optimizationContext: "被告对赔偿维权合理开支诉请的异议" },
        { id: "f4", title: "4. 对承担连带赔偿责任有无异议", type: "objection", optimizationContext: "被告对承担连带赔偿责任诉请的异议" },
        { id: "f5", title: "5. 对非金钱给付义务迟延履行金有无异议", type: "objection", optimizationContext: "被告对迟延履行金诉请的异议" },
        { id: "f6", title: "6. 对诉讼费用有无异议", type: "objection", optimizationContext: "被告对诉讼费用承担方式的异议" },
        { id: "f7", title: "7. 对其他请求有无异议", type: "objection", optimizationContext: "被告对其他诉讼请求的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对原告资格是否有异议", type: "objection", optimizationContext: "被告对原告主体资格的说明和异议" },
        { id: "f2", title: "2. 对原告主张的发明专利权权利状态是否有异议", type: "objection", optimizationContext: "被告对涉案专利权利状态的说明和异议（简述专利权利状态）" },
        { id: "f3", title: "3. 对被诉侵权行为具体情况有无异议", type: "objection", optimizationContext: "被告对被诉侵权行为具体情况的说明和异议" },
        { id: "f4", title: "4. 对被诉共同侵权有无异议", type: "objection", optimizationContext: "被告对被诉共同侵权的说明和异议" },
        { id: "f5", title: "5. 对技术对比是否有异议 (详见附件3技术特征对比分析表)", type: "objection", optimizationContext: "被告对技术对比的说明和异议（概述涉案专利权利要求以及被诉侵权产品所涉技术方案的对比分析结果）" },
        { id: "f6", title: "6. 是否主张现有技术抗辩 (详见附件4现有技术对比分析表)", type: "objection", optimizationContext: "被告是否主张现有技术抗辩（概述被诉侵权产品与现有技术的对比分析结果）" },
        { id: "f7", title: "7. 是否主张合法来源抗辩", type: "objection", optimizationContext: "被告是否主张合法来源抗辩" },
        { id: "f8", title: "8. 对赔偿数额和具体赔偿项目有无异议", type: "objection", optimizationContext: "被告对赔偿数额和具体赔偿项目的说明和异议" },
        { id: "f9", title: "9. 其他抗辩事由", type: "objection", optimizationContext: "被告提出的其他抗辩事由" },
        { id: "f10", title: "10. 法律依据", type: "legal_analyze_textarea", optimizationContext: "被告的答辩法律依据" },
    ],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" },
    ],
};

export const trademarkInfringementDefenseConfig: DefenseFormConfig = {
    caseType: '侵害商标权纠纷',
    title: '民事答辩状 (侵害商标权纠纷)',
    formId: 'trademark_infringement',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对停止侵权有无异议", type: "objection", optimizationContext: "被告对停止侵权诉请的异议" },
        { id: "f2", title: "2. 对赔偿经济损失有无异议 (包括对原告主张的损失、被告获利、惩罚性赔偿、赔偿数额等有无异议)", type: "objection", optimizationContext: "被告对赔偿经济损失诉请的异议" },
        { id: "f3", title: "3. 对支付合理费用有无异议", type: "objection", optimizationContext: "被告对支付合理费用诉请的异议" },
        { id: "f4", title: "4. 对负担诉讼费用有无异议", type: "objection", optimizationContext: "被告对诉讼费用承担方式的异议" },
        { id: "f5", title: "5. 对其他请求有无异议", type: "objection", optimizationContext: "被告对其他诉讼请求的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对原告主体情况有无异议", type: "objection", optimizationContext: "被告对原告主体情况的说明和异议（包括对原告系商标注册人或利害关系人等的异议及理由）" },
        { id: "f2", title: "2. 对原告商标权属有无异议", type: "objection", optimizationContext: "被告对原告商标权权属的说明和异议（包括对原告商标权权利状态等的异议及理由）" },
        { id: "f3", title: "3. 对原告商标权知名度有无异议", type: "objection", optimizationContext: "被告对原告商标权知名度的说明和异议" },
        { id: "f4", title: "4. 对商标侵权事实有无异议", type: "objection", optimizationContext: "被告对商标侵权事实的说明和异议（包括对是否系被诉行为的实施主体、被诉行为表现形式、是否构成侵权、侵权情节的异议及理由）" },
        { id: "f5", title: "5. 其他事项", type: "objection", optimizationContext: "被告的其他说明和异议（包括是否存在合法来源抗辩事由）" },
        { id: "f6", title: "6. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
        { id: "f7", title: "7. 质证清单 (可另附页)", type: "textarea", optimizationContext: "被告对原告证据的质证意见清单" },
    ],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" },
    ],
};

export const tradeSecretInfringementDefenseConfig: DefenseFormConfig = {
    caseType: '侵害商业秘密纠纷',
    title: '民事答辩状 (侵害商业秘密纠纷)',
    formId: 'trade_secret_infringement',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对停止侵权有无异议", type: "objection", optimizationContext: "被告对停止侵权诉请的异议" },
        { id: "f2", title: "2. 对赔偿经济损失有无异议 (包括损失、获利、惩罚性赔偿、赔偿数额等)", type: "objection", optimizationContext: "被告对赔偿经济损失诉请的异议" },
        { id: "f3", title: "3. 对支付合理费用有无异议", type: "objection", optimizationContext: "被告对支付合理费用诉请的异议" },
        { id: "f4", title: "4. 对其他请求有无异议", type: "objection", optimizationContext: "被告对其他诉讼请求的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对原告资格是否有异议", type: "objection", optimizationContext: "被告对原告主体资格的说明和异议" },
        { id: "f2", title: "2. 对原告主张的商业秘密符合法定条件是否有异议", type: "objection", optimizationContext: "被告对原告主张的商业秘密是否符合法定条件的说明和异议" },
        { id: "f3", title: "3. 对被诉行为具体情况有无异议", type: "objection", optimizationContext: "被告对被诉侵权行为具体情况的说明和异议" },
        { id: "f4", title: "4. 其他异议及依据 (可另附页)", type: "objection", optimizationContext: "被告提出的其他异议及其依据" },
        { id: "f5", title: "5. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
        { id: "f6", title: "6. 质证清单 (可另附页)", type: "textarea", optimizationContext: "被告对原告证据的质证意见清单" },
    ],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" },
    ],
};

export const designPatentDefenseConfig: DefenseFormConfig = {
    caseType: '侵害外观设计专利权纠纷',
    title: '民事答辩状 (侵害外观设计专利权纠纷)',
    formId: 'design_patent_infringement',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对停止侵权有无异议", type: "objection", optimizationContext: "被告对停止侵权诉请的异议" },
        { id: "f2", title: "2. 对赔偿经济损失有无异议 (包括对原告主张的损失、被告获利、惩罚性赔偿、赔偿数额等有无意见)", type: "objection", optimizationContext: "被告对赔偿经济损失诉请的异议" },
        { id: "f3", title: "3. 对支付合理费用有无异议", type: "objection", optimizationContext: "被告对支付合理费用诉请的异议" },
        { id: "f4", title: "4. 对其他请求有无异议", type: "objection", optimizationContext: "被告对其他诉讼请求的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对原告资格是否有异议", type: "objection", optimizationContext: "被告对原告主体资格的说明和异议" },
        { id: "f2", title: "2. 对原告主张的外观设计专利权权利状态是否有异议", type: "objection", optimizationContext: "被告对涉案外观设计专利权利状态的说明和异议" },
        { id: "f3", title: "3. 对被诉行为的具体事实（包括时间、地点、表现形式、具体内容、主观故意程度、损害后果等）有无异议", type: "objection", optimizationContext: "被告对被诉侵权行为具体事实的说明和异议" },
        { id: "f4", title: "4. 对侵权比对是否有异议", type: "objection", optimizationContext: "被告对侵权比对的说明和异议" },
        { id: "f5", title: "5. 是否主张现有设计抗辩", type: "objection", optimizationContext: "被告是否主张现有设计抗辩" },
        { id: "f6", title: "6. 是否主张合法来源抗辩", type: "objection", optimizationContext: "被告是否主张合法来源抗辩" },
        { id: "f7", title: "7. 其他抗辩事由", type: "objection", optimizationContext: "被告提出的其他抗辩事由" },
        { id: "f8", title: "8. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
        { id: "f9", title: "9. 质证清单 (可另附页)", type: "textarea", optimizationContext: "被告对原告证据的质证意见清单" },
    ],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" },
    ],
};

export const copyrightInfringementDefenseConfig: DefenseFormConfig = {
    caseType: '侵害著作权及邻接权纠纷',
    title: '民事答辩状 (侵害著作权及邻接权纠纷)',
    formId: 'copyright_infringement',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对停止侵权有无异议", type: "objection", optimizationContext: "被告对停止侵权诉请的异议" },
        { id: "f2", title: "2. 对赔偿经济损失有无异议（包括损失、获利、法定赔偿、惩罚性赔偿的计算及依据）", type: "objection", optimizationContext: "被告对赔偿经济损失诉请的异议" },
        { id: "f3", title: "3. 对支付合理费用有无异议", type: "objection", optimizationContext: "被告对支付合理费用诉请的异议" },
        { id: "f4", title: "4. 对其他请求有无异议", type: "objection", optimizationContext: "被告对其他诉讼请求的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对原告著作权主体有无异议", type: "objection", optimizationContext: "被告对原告著作权主体的说明和异议" },
        { id: "f2", title: "2. 对著作权客体有无异议", type: "objection", optimizationContext: "被告对著作权客体的说明和异议" },
        { id: "f3", title: "3. 对涉嫌侵害著作权人身权或财产权的种类有无异议", type: "objection", optimizationContext: "被告对被诉侵权的权利种类的说明和异议" },
        { id: "f4", title: "4. 对被诉侵权行为方式有无异议", type: "objection", optimizationContext: "被告对被诉侵权行为方式的说明和异议" },
        { id: "f5", title: "5. 对被诉侵权行为发生的时间、地点有无异议", type: "objection", optimizationContext: "被告对被诉侵权行为发生时空的说明和异议" },
        { id: "f6", title: "6. 对其他请求有无异议", type: "objection", optimizationContext: "被告对其他诉讼请求的说明和异议" },
        { id: "f7", title: "7. 有无合法来源抗辩等免责/减责事由", type: "objection", optimizationContext: "被告主张的合法来源抗辩等免责或减责事由" },
        { id: "f8", title: "8. 其他需要说明的内容（可另附页）", type: "objection", optimizationContext: "被告就本著作权纠纷需要补充说明的其他内容" },
        { id: "f9", title: "9. 证据清单或质证清单（可另附页）", type: "textarea", optimizationContext: "被告方的证据清单或质证清单" },
    ],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" },
    ],
};

export const plantVarietyDefenseConfig: DefenseFormConfig = {
    caseType: '侵害植物新品种权纠纷',
    title: '民事答辩状 (侵害植物新品种权纠纷)',
    formId: 'plant_variety_rights_infringement',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对停止侵害有无异议", type: "objection", optimizationContext: "被告对停止侵害诉请的异议" },
        { id: "f2", title: "2. 对赔偿经济损失有无异议", type: "objection", optimizationContext: "被告对赔偿经济损失诉请的异议" },
        { id: "f3", title: "3. 对赔偿维权合理开支有无异议", type: "objection", optimizationContext: "被告对赔偿维权合理开支诉请的异议" },
        { id: "f4", title: "4. 对承担连带赔偿责任有无异议", type: "objection", optimizationContext: "被告对承担连带赔偿责任诉请的异议" },
        { id: "f5", title: "5. 对非金钱给付义务迟延履行金有无异议", type: "objection", optimizationContext: "被告对迟延履行金诉请的异议" },
        { id: "f6", title: "6. 对诉讼费用有无异议", type: "objection", optimizationContext: "被告对诉讼费用承担方式的异议" },
        { id: "f7", title: "7. 对其他请求有无异议", type: "objection", optimizationContext: "被告对其他诉讼请求的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对原告资格是否有异议", type: "objection", optimizationContext: "被告对原告主体资格的说明和异议" },
        { id: "f2", title: "2. 对原告主张的植物新品种权权利状态是否有异议", type: "objection", placeholder: "（简述植物新品种权利状态）", optimizationContext: "被告对涉案植物新品种权权利状态的说明和异议" },
        { id: "f3", title: "3. 对被诉侵权行为具体情况有无异议", type: "objection", optimizationContext: "被告对被诉侵权行为具体情况的说明和异议" },
        { id: "f4", title: "4. 对被诉共同侵权有无异议", type: "objection", optimizationContext: "被告对被诉共同侵权的说明和异议" },
        { id: "f5", title: "5. 是否主张合法来源抗辩", type: "objection", optimizationContext: "被告是否主张合法来源抗辩" },
        { id: "f6", title: "6. 对赔偿数额和具体赔偿项目有无异议", type: "objection", optimizationContext: "被告对赔偿数额和具体赔偿项目的说明和异议" },
        { id: "f7", title: "7. 其他抗辩事由", type: "objection", optimizationContext: "被告提出的其他抗辩事由" },
    ],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" },
    ],
};

export const personalInsuranceDefenseConfig: DefenseFormConfig = {
    caseType: '人身保险合同纠纷',
    title: '民事答辩状 (人身保险合同纠纷)',
    formId: 'personal_insurance',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对保险金有无异议", type: "objection", optimizationContext: "被告对原告主张的保险金的异议" },
        { id: "f2", title: "2. 对保单现金价值有无异议", type: "objection", optimizationContext: "被告对原告主张的保单现金价值的异议" },
        { id: "f3", title: "3. 对保险费有无异议", type: "objection", optimizationContext: "被告对原告主张的保险费的异议" },
        { id: "f4", title: "4. 对是否主张实现债权的费用有无异议", type: "objection", optimizationContext: "被告对原告主张的实现债权费用的异议" },
        { id: "f5", title: "5. 对其他请求有无异议", type: "objection", optimizationContext: "被告对原告其他诉讼请求的异议" },
        { id: "f6", title: "6. 对标的总额有无异议", type: "objection", optimizationContext: "被告对原告诉讼请求总金额的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对人身保险合同的签订情况有无异议", type: "objection", optimizationContext: "被告对人身保险合同签订情况的说明和异议" },
        { id: "f2", title: "2. 对人身保险合同的主要约定有无异议", type: "objection", optimizationContext: "被告对人身保险合同主要约定的说明和异议" },
        { id: "f3", title: "3. 对是否依法就人身保险合同中与投保人有重大利害关系的条款进行提示、说明有无异议", type: "objection", optimizationContext: "被告对保险人是否履行提示说明义务的异议" },
        { id: "f4", title: "4. 对保险事故发生的情况有无异议", type: "objection", optimizationContext: "被告对保险事故发生情况的说明和异议" },
        { id: "f5", title: "5. 对具体损失项目及其数额有无异议", type: "objection", optimizationContext: "被告对具体损失项目及数额的说明和异议" },
        { id: "f6", title: "6. 对人身保险合同的履行情况有无异议", type: "objection", optimizationContext: "被告对人身保险合同履行情况的说明和异议" },
        { id: "f7", title: "7. 有无其他免责/减责事由", type: "objection", optimizationContext: "被告主张的其他免责或减责事由" },
        { id: "f8", title: "8. 答辩依据", type: "legal_analyze_textarea", placeholder: "合同约定：\n法律规定：", optimizationContext: "被告的答辩依据，包括合同约定和法律规定" },
        { id: "f9", title: "9. 其他需要说明的内容 (可另附页)", type: "optimizable_textarea", optimizationContext: "被告就本人身保险合同纠纷需要补充说明的其他内容" },
        { id: "f10", title: "10. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
    ],
    partyBlueprint: [
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" },
    ],
};

export const environmentalDamageDefenseConfig: DefenseFormConfig = {
    caseType: '生态环境损害赔偿诉讼',
    title: '民事答辩状 (生态环境损害赔偿诉讼)',
    formId: 'environmental_damage_compensation',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对停止侵害诉讼请求有无异议", type: "objection", optimizationContext: "被告对停止侵害诉讼请求的异议" },
        { id: "f2", title: "2. 对排除妨碍诉讼请求有无异议", type: "objection", optimizationContext: "被告对排除妨碍诉讼请求的异议" },
        { id: "f3", title: "3. 对消除危险诉讼请求有无异议", type: "objection", optimizationContext: "被告对消除危险诉讼请求的异议" },
        { id: "f4", title: "4. 对修复生态环境诉讼请求（或具体方式）有无异议", type: "objection", optimizationContext: "被告对修复生态环境诉讼请求的异议" },
        { id: "f5", title: "5. 对赔偿损失诉讼请求（总数，包括利息）有无异议", type: "objection", optimizationContext: "被告对赔偿损失诉讼请求的异议" },
        { id: "f6", title: "6. 对赔礼道歉诉讼请求有无异议", type: "objection", optimizationContext: "被告对赔礼道歉诉讼请求的异议" },
        { id: "f7", title: "7. 对其他诉讼请求有无异议", type: "objection", optimizationContext: "被告对其他诉讼请求的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对原告主体资格有无异议", type: "objection", optimizationContext: "被告对原告主体资格的异议" },
        { id: "f2", title: "2. 对污染环境、破坏生态行为有无异议", type: "objection", optimizationContext: "被告对被指控的污染环境、破坏生态行为的异议" },
        { id: "f3", title: "3. 对造成损害事实有无异议", type: "objection", optimizationContext: "被告对造成损害事实的异议" },
        { id: "f4", title: "4. 对行为与损害结果之间的因果关系有无异议", type: "objection", optimizationContext: "被告对行为与损害结果之间因果关系的异议" },
        { id: "f5", title: "5. 对磋商情况是否有异议", type: "objection", optimizationContext: "被告对磋商情况的异议" },
        { id: "f6", title: "6. 有无其他免责/减轻责任的事由", type: "objection", optimizationContext: "被告主张的其他免责或减轻责任的事由" },
        { id: "f7", title: "7. 答辩依据的法律、行政法规等规定 (可另附页)", type: "legal_analyze_textarea", optimizationContext: "被告的答辩法律依据" },
        { id: "f8", title: "8. 其他需要说明的内容 (可另附页)", type: "objection", optimizationContext: "被告就本生态环境损害赔偿诉讼需要补充说明的其他内容" },
        { id: "f9", title: "9. 证据清单 (可另附页)", type: "textarea", placeholder: "1. 合法开展生产经营，未污染环境、破坏生态的证据材料\n2. 对原告证据的质证意见\n3. 已经开展生态环境修复的证据材料\n……", optimizationContext: "被告方的证据清单" },
    ],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" },
    ],
};

export const securitiesMisrepresentationDefenseConfig: DefenseFormConfig = {
    caseType: '证券虚假陈述责任纠纷',
    title: '民事答辩状 (证券虚假陈述责任纠纷)',
    formId: 'securities_misrepresentation',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对赔偿因虚假陈述导致的损失有无异议", type: "objection", optimizationContext: "被告对赔偿因虚假陈述导致的损失的异议" },
        { id: "f2", title: "2. 对主张连带责任有无异议", type: "objection", optimizationContext: "被告对主张连带责任的异议" },
        { id: "f3", title: "3. 对实现债权的费用有无异议", type: "objection", optimizationContext: "被告对实现债权费用的异议" },
        { id: "f4", title: "4. 对其他请求有无异议", type: "objection", optimizationContext: "被告对其他诉讼请求的异议" },
        { id: "f5", title: "5. 对标的总额有无异议", type: "objection", optimizationContext: "被告对诉讼请求总金额的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对存在虚假陈述行为的情况有无异议", type: "objection", optimizationContext: "被告对存在虚假陈述行为的说明和异议" },
        { id: "f2", title: "2. 对有无监管部门的认定、处罚有无异议", type: "objection", optimizationContext: "被告对有无监管部门认定、处罚的说明和异议" },
        { id: "f3", title: "3. 对原告交易情况有无异议", type: "objection", optimizationContext: "被告对原告交易情况的说明和异议" },
        { id: "f4", title: "4. 对虚假陈述的重大性有无异议", type: "objection", optimizationContext: "被告对虚假陈述重大性的说明和异议" },
        { id: "f5", title: "5. 对虚假陈述与原告交易行为之间的因果关系有无异议", type: "objection", optimizationContext: "被告对虚假陈述与交易行为之间因果关系的说明和异议" },
        { id: "f6", title: "6. 对虚假陈述与原告损失之间的因果关系有无异议", type: "objection", optimizationContext: "被告对虚假陈述与损失之间因果关系的说明和异议" },
        { id: "f7", title: "7. 对原告损失情况有无异议", type: "objection", optimizationContext: "被告对原告损失情况的说明和异议" },
        { id: "f8", title: "8. 对原告请求发行人的控股股东、实际控制人、董监高、相关责任人员承担连带责任的情况有无异议", type: "objection", optimizationContext: "被告对相关方承担连带责任的说明和异议" },
        { id: "f9", title: "9. 对原告请求保荐机构、承销机构、律师事务所、会计师事务所等其他机构及其相关责任人员承担连带责任的情况有无异议", type: "objection", optimizationContext: "被告对中介机构等承担连带责任的说明和异议" },
        { id: "f10", title: "10. 有无其他免责/减责事由", type: "objection", optimizationContext: "被告主张的其他免责或减责事由" },
        { id: "f11", title: "11. 答辩依据", type: "legal_analyze_textarea", placeholder: "合同约定：\n法律规定：", optimizationContext: "被告的答辩依据，包括合同约定和法律规定" },
        { id: "f12", title: "12. 其他需要说明的内容 (可另附页)", type: "optimizable_textarea", optimizationContext: "被告就本证券虚假陈述纠纷需要补充说明的其他内容" },
        { id: "f13", title: "13. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
    ],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" },
    ],
};

export const financialLeasingDefenseConfig: DefenseFormConfig = {
    caseType: '融资租赁合同纠纷',
    title: '民事答辩状 (融资租赁合同纠纷)',
    formId: 'financial_leasing_contract',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对支付全部未付租金的诉请有无异议", type: "objection", optimizationContext: "被告对支付全部未付租金诉请的异议" },
        { id: "f2", title: "2. 对违约金、滞纳金、损害赔偿金有无异议", type: "objection", optimizationContext: "被告对违约金、滞纳金、损害赔偿金的异议" },
        { id: "f3", title: "3. 对确认租赁物归原告所有有无异议", type: "objection", optimizationContext: "被告对确认租赁物归属的异议" },
        { id: "f4", title: "4. 对解除合同有无异议", type: "objection", optimizationContext: "被告对解除合同的异议" },
        { id: "f5", title: "5. 对返还租赁物，并赔偿因解除合同而受到的损失有无异议", type: "objection", optimizationContext: "被告对返还租赁物及赔偿损失的异议" },
        { id: "f6", title: "6. 对担保权利的诉请有无异议", type: "objection", optimizationContext: "被告对担保权利诉请的异议" },
        { id: "f7", title: "7. 对实现债权的费用有无异议", type: "objection", optimizationContext: "被告对实现债权费用的异议" },
        { id: "f8", title: "8. 对其他请求有无异议", type: "objection", optimizationContext: "被告对其他诉讼请求的异议" },
        { id: "f9", title: "9. 对标的总额有无异议", type: "objection", optimizationContext: "被告对诉讼请求总金额的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对合同签订情况（名称、编号、签订时间、地点）有无异议", type: "objection", optimizationContext: "被告对融资租赁合同签订情况的说明和异议" },
        { id: "f2", title: "2. 对合同主体有无异议", type: "objection", optimizationContext: "被告对融资租赁合同主体的说明和异议" },
        { id: "f3", title: "3. 对租赁物情况有无异议", type: "objection", optimizationContext: "被告对租赁物情况的说明和异议" },
        { id: "f4", title: "4. 对合同约定的租金及支付方式有无异议", type: "objection", optimizationContext: "被告对租金及支付方式的说明和异议" },
        { id: "f5", title: "5. 对合同约定的租赁期限、费用有无异议", type: "objection", optimizationContext: "被告对租赁期限、费用的说明和异议" },
        { id: "f6", title: "6. 对到期后租赁物归属有无异议", type: "objection", optimizationContext: "被告对租赁物归属的说明和异议" },
        { id: "f7", title: "7. 对合同约定的违约责任有无异议", type: "objection", optimizationContext: "被告对违约责任约定的说明和异议" },
        { id: "f8", title: "8. 对是否约定加速到期条款有无异议", type: "objection", optimizationContext: "被告对加速到期条款的说明和异议" },
        { id: "f9", title: "9. 对是否约定回收租赁物条件有无异议", type: "objection", optimizationContext: "被告对回收租赁物条件的说明和异议" },
        { id: "f10", title: "10. 对是否约定解除合同条件有无异议", type: "objection", optimizationContext: "被告对解除合同条件的说明和异议" },
        { id: "f11", title: "11. 对租赁物交付时间有无异议", type: "objection", optimizationContext: "被告对租赁物交付时间的说明和异议" },
        { id: "f12", title: "12. 对租赁物情况有无异议", type: "objection", optimizationContext: "被告对租赁物情况的说明和异议" },
        { id: "f13", title: "13. 对租金支付情况有无异议", type: "objection", optimizationContext: "被告对租金支付情况的说明和异议" },
        { id: "f14", title: "14. 对逾期未付租金情况有无异议", type: "objection", optimizationContext: "被告对逾期未付租金情况的说明和异议" },
        { id: "f15", title: "15. 对是否签订物的担保合同有无异议", type: "objection", optimizationContext: "被告对是否签订物的担保合同的说明和异议" },
        { id: "f16", title: "16. 对担保人、担保物有无异议", type: "objection", optimizationContext: "被告对担保人、担保物的说明和异议" },
        { id: "f17", title: "17. 对最高额抵押担保有无异议", type: "objection", optimizationContext: "被告对最高额抵押担保的说明和异议" },
        { id: "f18", title: "18. 对是否办理抵押/质押登记有无异议", type: "objection", optimizationContext: "被告对是否办理抵押或质押登记的说明和异议" },
        { id: "f19", title: "19. 对是否签订保证合同有无异议", type: "objection", optimizationContext: "被告对是否签订保证合同的说明和异议" },
        { id: "f20", title: "20. 对保证方式有无异议", type: "objection", optimizationContext: "被告对保证方式的说明和异议" },
        { id: "f21", title: "21. 对其他担保方式有无异议", type: "objection", optimizationContext: "被告对其他担保方式的说明和异议" },
        { id: "f22", title: "22. 有无其他免责/减责事由", type: "objection", optimizationContext: "被告主张的其他免责或减责事由" },
        { id: "f23", title: "23. 答辩依据", type: "legal_analyze_textarea", placeholder: "合同约定：\n法律规定：", optimizationContext: "被告的答辩依据，包括合同约定和法律规定" },
        { id: "f24", title: "24. 其他需要说明的内容 (可另附页)", type: "optimizable_textarea", optimizationContext: "被告就本融资租赁合同纠纷需要补充说明的其他内容" },
        { id: "f25", title: "25. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
    ],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" },
    ],
};

export const ecologicalDamageDefenseConfig: DefenseFormConfig = {
    caseType: '生态破坏民事公益诉讼',
    title: '民事答辩状 (生态破坏民事公益诉讼)',
    formId: 'ecological_damage_public_interest',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对停止侵害诉讼请求有无异议", type: "objection", optimizationContext: "被告对停止侵害诉讼请求的异议" },
        { id: "f2", title: "2. 对排除妨碍诉讼请求有无异议", type: "objection", optimizationContext: "被告对排除妨碍诉讼请求的异议" },
        { id: "f3", title: "3. 对消除生态破坏危险诉讼请求有无异议", type: "objection", optimizationContext: "被告对消除生态破坏危险诉讼请求的异议" },
        { id: "f4", title: "4. 对修复生态环境诉讼请求（或具体方式）有无异议", type: "objection", optimizationContext: "被告对修复生态环境诉讼请求的异议" },
        { id: "f5", title: "5. 对赔偿损失诉讼请求（总数，包括利息）有无异议", type: "objection", optimizationContext: "被告对赔偿损失诉讼请求的异议" },
        { id: "f6", title: "6. 对赔礼道歉诉讼请求有无异议", type: "objection", optimizationContext: "被告对赔礼道歉诉讼请求的异议" },
        { id: "f7", title: "7. 对其他诉讼请求有无异议", type: "objection", optimizationContext: "被告对其他诉讼请求的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对原告主体资格有无异议", type: "objection", optimizationContext: "被告对原告主体资格的异议" },
        { id: "f2", title: "2. 对生态破坏行为有无异议", type: "objection", optimizationContext: "被告对被指控的生态破坏行为的异议" },
        { id: "f3", title: "3. 对造成损害事实或损害重大风险有无异议", type: "objection", optimizationContext: "被告对造成损害事实或重大风险的异议" },
        { id: "f4", title: "4. 对破坏行为与损害结果之间的因果关系有无异议", type: "objection", optimizationContext: "被告对破坏行为与损害结果之间因果关系的异议" },
        { id: "f5", title: "5. 有无其他免责/减轻责任的事由", type: "objection", optimizationContext: "被告主张的其他免责或减轻责任的事由" },
        { id: "f6", title: "6. 答辩依据的法律、行政法规等规定 (可另附页)", type: "legal_analyze_textarea", optimizationContext: "被告的答辩法律依据" },
        { id: "f7", title: "7. 其他需要说明的内容 (可另附页)", type: "objection", optimizationContext: "被告就本生态破坏公益诉讼需要补充说明的其他内容" },
        { id: "f8", title: "8. 证据清单 (可另附页)", type: "textarea", placeholder: "1. 合法开展生产经营，未污染环境、破坏生态的证据材料\n2. 对原告证据的质证意见\n3. 已经开展生态环境修复的证据材料\n……", optimizationContext: "被告方的证据清单" },
    ],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" },
    ],
};

export const propertyServiceDefenseConfig: DefenseFormConfig = {
    caseType: '物业服务合同纠纷',
    title: '民事答辩状 (物业服务合同纠纷)',
    formId: 'property_management_contract',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对物业费有无异议", type: "objection", optimizationContext: "被告对物业费的异议" },
        { id: "f2", title: "2. 对违约金有无异议", type: "objection", optimizationContext: "被告对违约金的异议" },
        { id: "f3", title: "3. 对诉讼费负担有无异议", type: "objection", optimizationContext: "被告对诉讼费负担方式的异议" },
        { id: "f4", title: "4. 对其他请求有无异议", type: "objection", optimizationContext: "被告对其他诉讼请求的异议" },
        { id: "f5", title: "5. 对标的总额有无异议", type: "objection", optimizationContext: "被告对诉讼请求总金额的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对物业服务合同或前期物业服务合同签订情况（名称、编号、签订时间、地点等）有无异议", type: "objection", optimizationContext: "被告对物业服务合同签订情况的说明和异议" },
        { id: "f2", title: "2. 对签订主体有无异议", type: "objection", optimizationContext: "被告对物业服务合同签订主体的说明和异议" },
        { id: "f3", title: "3. 对物业项目情况有无异议", type: "objection", optimizationContext: "被告对物业项目情况的说明和异议" },
        { id: "f4", title: "4. 对物业费标准有无异议", type: "objection", optimizationContext: "被告对物业费标准的说明和异议" },
        { id: "f5", title: "5. 对物业服务期限有无异议", type: "objection", optimizationContext: "被告对物业服务期限的说明和异议" },
        { id: "f6", title: "6. 对物业费支付方式有无异议", type: "objection", optimizationContext: "被告对物业费支付方式的说明和异议" },
        { id: "f7", title: "7. 对逾期支付物业费违约金标准有无异议", type: "objection", optimizationContext: "被告对逾期支付物业费违约金标准的说明和异议" },
        { id: "f8", title: "8. 对欠付物业费数额及计算方式有无异议", type: "objection", optimizationContext: "被告对欠付物业费数额及计算方式的说明和异议" },
        { id: "f9", title: "9. 对应付违约金数额及计算方式有无异议", type: "objection", optimizationContext: "被告对应付违约金数额及计算方式的说明和异议" },
        { id: "f10", title: "10. 对催缴情况有无异议", type: "objection", optimizationContext: "被告对催缴情况的说明和异议" },
        { id: "f11", title: "11. 其他需要说明的内容（可另附页）", type: "objection", optimizationContext: "被告就本物业服务合同纠纷需要补充说明的其他内容" },
        { id: "f12", title: "12. 答辩依据", type: "legal_analyze_textarea", placeholder: "合同约定：\n法律规定：", optimizationContext: "被告的答辩依据，包括合同约定和法律规定" },
        { id: "f13", title: "13. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
    ],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
    ],
};

export const liabilityInsuranceDefenseConfig: DefenseFormConfig = {
    caseType: '责任保险合同纠纷',
    title: '民事答辩状 (责任保险合同纠纷)',
    formId: 'liability_insurance',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对理赔款有无异议", type: "objection", optimizationContext: "被告对原告主张的理赔款的异议" },
        { id: "f2", title: "2. 对是否主张实现债权的费用有无异议", type: "objection", optimizationContext: "被告对原告主张的实现债权费用的异议" },
        { id: "f3", title: "3. 对其他请求有无异议", type: "objection", optimizationContext: "被告对原告其他诉讼请求的异议" },
        { id: "f4", title: "4. 对标的总额有无异议", type: "objection", optimizationContext: "被告对原告诉讼请求总金额的异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对责任保险合同的签订情况有无异议", type: "objection", optimizationContext: "被告对责任保险合同签订情况的说明和异议" },
        { id: "f2", title: "2. 对责任保险合同的主要约定有无异议", type: "objection", optimizationContext: "被告对责任保险合同主要约定的说明和异议" },
        { id: "f3", title: "3. 对是否依法就责任保险合同中与投保人有重大利害关系的条款进行提示、说明有无异议", type: "objection", optimizationContext: "被告对保险人是否履行提示说明义务的异议" },
        { id: "f4", title: "4. 对保险事故发生的情况有无异议", type: "objection", optimizationContext: "被告对保险事故发生情况的说明和异议" },
        { id: "f5", title: "5. 对具体损失项目及其数额有无异议", type: "objection", optimizationContext: "被告对具体损失项目及数额的说明和异议" },
        { id: "f6", title: "6. 对责任保险合同的履行情况有无异议", type: "objection", optimizationContext: "被告对责任保险合同履行情况的说明和异议" },
        { id: "f7", title: "7. 有无其他免责/减责事由", type: "objection", optimizationContext: "被告主张的其他免责或减责事由" },
        { id: "f8", title: "8. 答辩依据", type: "legal_analyze_textarea", placeholder: "合同约定：\n法律规定：", optimizationContext: "被告的答辩依据，包括合同约定和法律规定" },
        { id: "f9", title: "9. 其他需要说明の内容 (可另附页)", type: "optimizable_textarea", optimizationContext: "被告就本责任保险合同纠纷需要补充说明的其他内容" },
        { id: "f10", title: "10. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
    ],
    partyBlueprint: [
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" },
    ],
};

export const creditCardDefenseConfig: DefenseFormConfig = {
    caseType: '信用卡纠纷',
    title: '民事答辩状 (信用卡纠纷)',
    formId: 'credit_card',
    defenseItemsConfig: [
        { id: "f1", title: "1. 对透支本金有无异议", type: "objection", optionType: 'confirm_object', optimizationContext: "被告对透支本金的确认或异议" },
        { id: "f2", title: "2. 对利息、罚息、复利、滞纳金、违约金、手续费等有无异议", type: "objection", optionType: 'confirm_object', optimizationContext: "被告对利息、罚息、复利、滞纳金、违约金、手续费等的确认或异议" },
        { id: "f3", title: "3. 对担保权利诉请有无异议", type: "objection", optionType: 'confirm_object', optimizationContext: "被告对担保权利诉请的确认或异议" },
        { id: "f4", title: "4. 对实现债权的费用有无异议", type: "objection", optimizationContext: "被告对实现债权费用的确认或异议" },
        { id: "f5", title: "5. 对其他请求有无异议", type: "objection", optimizationContext: "被告对其他诉讼请求的确认或异议" },
        { id: "f6", title: "6. 对标的总额有无异议", type: "objection", optimizationContext: "被告对诉讼请求总金额的确认或异议" },
    ],
    factsAndReasonsConfig: [
        { id: "f1", title: "1. 对信用卡办理情况有无异议", type: "objection", optimizationContext: "被告对信用卡办理情况的说明和异议" },
        { id: "f2", title: "2. 对信用卡合约的主要约定有无异议", type: "objection", optimizationContext: "被告对信用卡合约主要约定的说明和异议" },
        { id: "f3", title: "3. 对原告就信用卡合约主要条款进行提示注意、说明的情况有无异议", type: "objection", optimizationContext: "被告对原告是否履行提示说明义务的说明和异议" },
        { id: "f4", title: "4. 对被告已还款金额有无异议", type: "objection", optimizationContext: "被告对已还款金额的说明和异议" },
        { id: "f5", title: "5. 对被告逾期未还款金额有无异议", type: "objection", optimizationContext: "被告对逾期未还款金额的说明和异议" },
        { id: "f6", title: "6. 对是否向被告进行通知和催收有无异议", type: "objection", optimizationContext: "被告对通知和催收情况的说明和异议" },
        { id: "f7", title: "7. 对是否签订物的担保合同有无异议", type: "objection", optimizationContext: "被告对是否签订物的担保合同的说明和异议" },
        { id: "f8", title: "8. 对担保人、担保物有无异议", type: "objection", optimizationContext: "被告对担保人、担保物的说明和异议" },
        { id: "f9", title: "9. 对最高额抵押担保有无异议", type: "objection", optimizationContext: "被告对最高额抵押担保的说明和异议" },
        { id: "f10", title: "10. 对是否办理抵押/质押登记有无异议", type: "objection", optimizationContext: "被告对是否办理抵押或质押登记的说明和异议" },
        { id: "f11", title: "11. 对是否签订保证合同有无异议", type: "objection", optimizationContext: "被告对是否签订保证合同的说明和异议" },
        { id: "f12", title: "12. 对保证方式有无异议", type: "objection", optimizationContext: "被告对保证方式的说明和异议" },
        { id: "f13", title: "13. 对其他担保方式有无异议", type: "objection", optimizationContext: "被告对其他担保方式的说明和异议" },
        { id: "f14", title: "14. 有无其他免责/减责事由", type: "objection", optimizationContext: "被告主张的其他免责或减责事由" },
        { id: "f15", title: "15. 答辩依据", type: "legal_analyze_textarea", placeholder: "合同约定：\n法律规定：", optimizationContext: "被告的答辩依据，包括合同约定和法律规定" },
        { id: "f16", title: "16. 其他需要说明的内容 (可另附页)", type: "optimizable_textarea", optimizationContext: "被告就本信用卡纠纷需要补充说明的其他内容" },
        { id: "f17", title: "17. 证据清单 (可另附页)", type: "textarea", optimizationContext: "被告方的证据清单" },
    ],
    partyBlueprint: [
        {path: "defendants_natural", roleText: "答辩人\n（自然人）", type: "natural" },
        {path: "defendants_legal", roleText: "答辩人\n（法人、非法人组织）", type: "legal" },
    ],
};