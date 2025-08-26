import React from "react";
import { FormPageLayout } from "../../layouts/FormPageLayout";
import { FormSectionCard } from "../../layouts/FormSectionCard";
import { PartyList } from "../../layouts/PartyList";
import { AgentList } from "../../layouts/AgentList";
import { QuestionTable } from "../../components/claim/QuestionTable";
import type { QuestionConfig } from "../../components/claim/QuestionTable";
import FormField from "../../components/claim/FormField";
import {
  formatFormData,
  formatPartiesForDocx,
  formatAgentsForDocx,
  formatDateToChinese,
  getValueFromPath,
} from "../../utils/formatter";
import { useFormContext } from "react-hook-form";

// =======================================================================
//                       Constants & Helper Data
// =======================================================================

const DOC_TYPE = "不予执行申请书";

// 仲裁类不予执行理由
const ARBITRATION_REASONS = [
  "当事人在合同中没有订有仲裁条款或者事后没有达成书面仲裁协议",
  "裁决的事项不属于仲裁协议的范围或者仲裁机构无权仲裁的",
  "仲裁庭的组成或者仲裁的程序违反法定程序的",
  "裁决所根据的证据是伪造的",
  "对方当事人向仲裁机构隐瞒了足以影响公正裁决的证据的",
  "仲裁员在仲裁该案时有贪污受贿，徇私舞弊，枉法裁决行为的",
  "仲裁案件当事人之间存在虚构法律关系，捏造案件事实的情形的",
  "其他"
];

// 公证债权文书类不予执行理由
const NOTARY_REASONS = [
  "被执行人未到场且未委托代理人到场办理公证的",
  "无民事行为能力人或者限制民事行为能力人没有监护人代为办理公证的",
  "公证员为本人、近亲属办理公证，或者办理与本人、近亲属有利害关系的公证的",
  "公证员办理该公证有贪污受贿、徇私舞弊行为，已经由生效刑事法律文书等确认的",
  "其他严重违反法定公证程序的情形"
];

// =======================================================================
//                       Configuration Arrays
// =======================================================================

// "不予执行文书信息" 配置
const documentInfoConfig: QuestionConfig[] = [
  {
    type: "custom",
    path: "docInfo.type",
    title: "法律文书类型",
    children: () => (
      <FormField
        path="docInfo.type"
        type="radio_detail"
        options={[
          { value: "仲裁裁决", label: "仲裁裁决" },
          { value: "仲裁调解书", label: "仲裁调解书" },
          { value: "公证机关依法赋予强制执行效力的债权文书", label: "公证机关依法赋予强制执行效力的债权文书" },
          { value: "其他法律文书", label: "其他法律文书" },
        ]}
        triggerValue="其他法律文书"
        detailsLabel="类型"
        placeholder="请填写具体文书类型"
      />
    ),
    formatter: (formData) => {
      const data = getValueFromPath(formData, "docInfo.type") || {};
      const choice = data.choice;
      const details = data.details || '';

      // 定义选项列表，与表单中的options保持一致
      const options = [
        { value: "仲裁裁决", label: "仲裁裁决" },
        { value: "仲裁调解书", label: "仲裁调解书" },
        { value: "公证机关依法赋予强制执行效力的债权文书", label: "公证机关依法赋予强制执行效力的债权文书" },
        { value: "其他法律文书", label: "其他法律文书" },
      ];

      // 为每个选项生成带勾选标记的文本
      const formattedOptions = options.map(option => {
        const checked = choice === option.value ? '☑' : '☐';
        let line = `${option.label}${checked}`;
        // 如果是"其他法律文书"且被选中，则添加详细内容
        if (option.value === "其他法律文书" && choice === option.value && details) {
          line += ` ${details}`;
        }
        return line;
      });

      // 返回格式化的文本，每项占一行
      return formattedOptions.join('\n');
    },
  },
  { type: "textarea", path: "docInfo.issuingBody", title: "文书作出机构" },
  { type: "textarea", path: "docInfo.docNumber", title: "文书号" },
  {
    type: "textarea",
    path: "docInfo.enforcementCaseNumber",
    title: "执行案号",
  },
  {
    type: "custom",
    path: "docInfo.serviceDate",
    title: "执行通知书送达日期",
    children: () => (
      <FormField
        path="docInfo.serviceDate.detail"
        type="date"
        frontLabel="具体送达日期"
      />
    ),
    formatter: (data) =>
      `${formatDateToChinese(
        getValueFromPath(data, "docInfo.serviceDate.detail")
      ) || '   年    月    日'}`,
  },
  {
    type: "custom",
    path: "reasons.type",
    title: "申请不予执行类型",
    children: () => {
      const { watch, setValue } = useFormContext();
      const selectedType = watch("reasons.type");
      const arbitrationReason = watch("reasons.arbitration.reason");
      const arbitrationOtherDetails = watch("reasons.arbitration.otherDetails");
      const notaryReason = watch("reasons.notary.reason");
      const notaryOtherDetails = watch("reasons.notary.otherDetails");

      // 处理类型选择变化
      const handleTypeChange = (type: string) => {
        if (selectedType === type) {
          // 取消选择
          setValue("reasons.type", "");
        } else {
          // 选择新类型
          setValue("reasons.type", type);
        }
      };

      // 处理仲裁理由选择变化
      const handleArbitrationReasonChange = (reason: string) => {
        if (arbitrationReason === reason) {
          setValue("reasons.arbitration.reason", "");
        } else {
          setValue("reasons.arbitration.reason", reason);
        }
      };

      // 处理公证债权文书理由选择变化
      const handleNotaryReasonChange = (reason: string) => {
        if (notaryReason === reason) {
          setValue("reasons.notary.reason", "");
        } else {
          setValue("reasons.notary.reason", reason);
        }
      };

      return (
        <div className="space-y-4">
          {/* 仲裁和公证债权文书类型选择（单选） */}
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              className={`btn ${selectedType === "仲裁" ? "btn-primary" : "btn-outline"}`}
              onClick={() => handleTypeChange("仲裁")}
            >
              仲裁{selectedType === "仲裁" ? "☑" : "☐"}
            </button>
            <button
              type="button"
              className={`btn ${selectedType === "公证债权文书" ? "btn-primary" : "btn-outline"}`}
              onClick={() => handleTypeChange("公证债权文书")}
            >
              公证债权文书{selectedType === "公证债权文书" ? "☑" : "☐"}
            </button>
          </div>

          {/* 仲裁理由选择 */}
          {selectedType === "仲裁" && (
            <div className="ml-4 space-y-2">
              <div className="font-medium">仲裁☐：</div>
              {ARBITRATION_REASONS.map((reason, index) => (
                <div key={index} className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={arbitrationReason === reason}
                      onChange={() => handleArbitrationReasonChange(reason)}
                    />
                    <span className="label-text">
                      {index + 1}. {reason}
                      {reason === "其他" && arbitrationReason === reason && (
                        <span className="inline-block ml-2">
                          <input
                            type="text"
                            className="input input-bordered input-sm ml-2"
                            placeholder="请具体说明"
                            value={arbitrationOtherDetails || ""}
                            onChange={(e) => setValue("reasons.arbitration.otherDetails", e.target.value)}
                          />
                        </span>
                      )}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* 公证债权文书理由选择 */}
          {selectedType === "公证债权文书" && (
            <div className="ml-4 space-y-2">
              <div className="font-medium">公证债权文书☐：</div>
              {NOTARY_REASONS.map((reason, index) => (
                <div key={index} className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={notaryReason === reason}
                      onChange={() => handleNotaryReasonChange(reason)}
                    />
                    <span className="label-text">
                      {index + 1}. {reason}
                      {reason === "其他严重违反法定公证程序的情形" && notaryReason === reason && (
                        <span className="inline-block ml-2">
                          <input
                            type="text"
                            className="input input-bordered input-sm ml-2"
                            placeholder="请具体说明"
                            value={notaryOtherDetails || ""}
                            onChange={(e) => setValue("reasons.notary.otherDetails", e.target.value)}
                          />
                        </span>
                      )}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    },
    formatter: (data) => {
      const type = data?.reasons?.type || "";
      const arbitrationReason = data?.reasons?.arbitration?.reason || "";
      const notaryReason = data?.reasons?.notary?.reason || "";
      const arbitrationOtherDetails = data?.reasons?.arbitration?.otherDetails || "";
      const notaryOtherDetails = data?.reasons?.notary?.otherDetails || "";

      let result = "";

      // 显示仲裁大类及其所有选项
      result += `仲裁${type === "仲裁" ? '☑' : '□'}\n`;
      ARBITRATION_REASONS.forEach((reason, index) => {
        const isSelected = type === "仲裁" && arbitrationReason === reason;
        result += `${index + 1}. ${reason}${isSelected ? '☑' : '□'}\n`;

        // 如果是"其他"且被选中，添加详细信息
        if (reason === "其他" && isSelected && arbitrationOtherDetails) {
          result += `${arbitrationOtherDetails}\n`;
        }
      });

      // 添加空行分隔
      result += '\n';

      // 显示公证债权文书大类及其所有选项
      result += `公证债权文书${type === "公证债权文书" ? '☑' : '□'}\n`;
      NOTARY_REASONS.forEach((reason, index) => {
        const isSelected = type === "公证债权文书" && notaryReason === reason;
        result += `${index + 1}. ${reason}${isSelected ? '☑' : '□'}\n`;

        // 如果是"其他严重违反法定公证程序的情形"且被选中，添加详细信息
        if (reason === "其他严重违反法定公证程序的情形" && isSelected && notaryOtherDetails) {
          result += `${notaryOtherDetails}\n`;
        }
      });

      return result.trim(); // 移除末尾的换行符
    },
  }
];

// "申请请求"及其他配置
const requestConfig: QuestionConfig[] = [
  {
    type: "optimizationContext",
    path: "request.main",
    title: "申请请求",
  },
  {
    type: "optimizationContext",
    path: "request.factsAndReasons",
    title: "事实与理由",
  },
  {
    type: "optimizationContext",
    path: "request.evidenceList",
    title: "证据清单",
  },
];

// =======================================================================
//                       数据处理与格式化
// =======================================================================
const processFormDataForPreview = (data: any) => {
  // 格式化当事人信息
  const applicantBlueprints = [
    {
      path: "applicant_natural",
      roleText: `申请人(自然人)`,
      type: "natural" as const,
      specialType: "不予执行申请书"
    },
    {
      path: "applicant_legal",
      roleText: `申请人(法人/非法人组织)`,
      type: "legal" as const,
      specialType: "不予执行申请书"
    },
  ];
  const otherPartyBlueprints = [
    {
      path: "other_parties_natural",
      roleText: "其他当事人(自然人)",
      type: "natural" as const,
    },
    {
      path: "other_parties_legal",
      roleText: "其他当事人(法人/非法人组织)",
      type: "legal" as const,
    },
  ];
  const partyInfo = [
    ...formatPartiesForDocx(data, applicantBlueprints),
    ...formatAgentsForDocx(data),
    ...formatPartiesForDocx(data, otherPartyBlueprints),
  ];

  // 格式化表单要素部分
  const documentInfo_formatted = formatFormData(
    "documentInfo",
    data,
    documentInfoConfig
  );
  const request_main_formatted = formatFormData("request.main", data, [requestConfig[0]]);
  const request_facts_formatted = formatFormData("request.factsAndReasons", data, [requestConfig[1]]);
  const request_evidence_formatted = formatFormData("request.evidenceList", data, [requestConfig[2]]);

  // 组合成最终的 context 对象
  return {
    partyInfo,
    sections: [
      { title: "不予执行文书信息", items: documentInfo_formatted },
      { title: "申请请求", items: request_main_formatted },
      { title: "事实与理由", items: request_facts_formatted },
      { title: "证据清单", items: request_evidence_formatted },
    ],
    documentInfo_formatted:documentInfo_formatted,
    request_main_formatted:request_main_formatted,
    request_facts_formatted:request_facts_formatted,
    request_evidence_formatted:request_evidence_formatted
  };
};

// =======================================================================
//                       表单主组件
// =======================================================================

const instructions = `
      <ol>
        <li>1. 被执行人向人民法院申请不予执行仲裁裁决的，应当在执行通知书送达之日起十五日内提出书面申请；有民事诉讼法第二百四十八条第四、六项规定情形且执行程序尚未终结的，应当自知道或者
应当知道有关事实或案件之日起十五日内提出书面申请。案外人向人民法院申请不予执行仲裁裁决或者仲裁调解书的，应自知道或者应当知道人民法院对该标的采取执行措施之日起三十日内提出。
被执行人申请不予执行公证债权文书，应当在执行通知书送达之日起十五日内提出书面申请；有公证员为本人、近亲属办理公证，或者办理与本人、近亲属有利害关系的公证的，或者公证员办理该项公证有贪污受贿、徇私舞弊行为，已经由生效刑事法律文书等确认的等情形，且执行程序尚未终结的，应当自知道或者应当知道有关事实之日起十五日内提出。</li>
        <li>2. 为了方便您不予执行特定法律文书的申请，保护您的合法权利，请如实填写本表。</li>
        <li>3. 申请不予执行时需向人民法院提交的材料：（1）提交证明您身份的材料，如身份证复印件、营业执照复印件、法定代表人身份证明和负责人身份证明等；（2）生效法律文书副本；（3）相关证据材料。</li>
        <li>4. 本表所涉内容系针对不予执行申请专用，有些内容可能与您的具体申请无关，您认为与申请无关的项目可以填“无”或不填；对于本表中勾选项可以在对应项打“√”；您认为另有重要内容需要列明的，可以另附页填写。</li>
        <li>5. 本表word 电子版填写时, 相关栏目可复制粘贴或扩容, 但不得改变要素内容、格式设置。例如, 多原告、多被告或多委托诉讼代理人等情况, 可根据实际情况复制粘贴; 需填写文字较多时，可根据实际对栏目进行扩容等。</li>
      </ol>
      <div class="alert alert-warning shadow-md mt-4 text-warning-content">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <div>
          <h3 class="font-bold">★特别提示★</h3>
          <ol>
          <li>当事人、利害关系人、案外人应当遵守诚信原则如实认真填写表格。如果当事人、利害关系人、案外人违反民事诉讼法的规定，虚假诉讼、恶意诉讼、滥用诉权，人民法院将视违法情形依法追究责任。</li>
        </ol>
          </div>
      </div>`;


export const NonEnforcementOfArbitrationFormPage: React.FC = () => {
  return (
    <FormPageLayout
      title={DOC_TYPE}
      formId={`application_non_enforcement_arbitration`}
      docType="申请书"
      onPreviewData={processFormDataForPreview}
      fixedFormValues={{}}
      instructions={instructions}
    >
      <FormSectionCard title="申请人">
        <PartyList
          path="applicant_natural"
          title="自然人"
          partyType="natural"
          specialType={DOC_TYPE}
        />
        <div className="divider my-4"></div>
        <PartyList
          path="applicant_legal"
          title="法人/非法人组织"
          partyType="legal"
          specialType={DOC_TYPE}
        />
      </FormSectionCard>
      <AgentList path="agents" />

      <FormSectionCard title="其他当事人">
        <PartyList
          path="other_parties_natural"
          title="自然人"
          partyType="natural"
          specialType={DOC_TYPE}
        />
        <div className="divider my-4"></div>
        <PartyList
          path="other_parties_legal"
          title="法人/非法人组织"
          partyType="legal"
          specialType={DOC_TYPE}
        />
      </FormSectionCard>

      <FormSectionCard title="不予执行文书信息">
        <QuestionTable config={documentInfoConfig} />
      </FormSectionCard>

      <FormSectionCard title="申请请求">
        <QuestionTable config={[requestConfig[0]]} />
      </FormSectionCard>

      <FormSectionCard title="事实与理由">
        <QuestionTable config={[requestConfig[1]]} />
      </FormSectionCard>

      <FormSectionCard title="证据清单">
        <QuestionTable config={[requestConfig[2]]} />
      </FormSectionCard>
    </FormPageLayout>
  );
};

export default NonEnforcementOfArbitrationFormPage;
