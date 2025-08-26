// src/pages/admin/CaseJudgementPage.tsx (新文件)

import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { fetchDocumentsForCase } from "../../api/caseApi";
import { analyzeForJudge } from "../../api/adminApi";
import type { JudgeAnalysisResult } from "../../api/adminApi";
import type {
  QuestionListItem,
  DocxListItem,
  FinalDataObject,
} from "../../interfaces/document.types";
import { MaskableCode } from "../../components/MaskableCode";
import type { CaseDetails } from "../../api/caseApi";

const DocumentContentDisplay: React.FC<{
  items?: (QuestionListItem | DocxListItem)[];
}> = ({ items }) => {
  if (!items || items.length === 0)
    return <p className="text-base-content/60">无内容</p>;

  const formattedItems = items.map((item) => {
    if ("question" in item) {
      return { title: item.question, content: item.answers };
    } else {
      return { title: item.role, content: item.details };
    }
  });

  return (
    <div className="space-y-4 text-sm">
      {formattedItems.map((item, index) => (
        <div key={index}>
          <p className="font-semibold">{item.title}</p>
          <p className="whitespace-pre-wrap opacity-80">{item.content}</p>
        </div>
      ))}
    </div>
  );
};
const AIJudgeReport: React.FC<{ data: JudgeAnalysisResult }> = ({ data }) => (
  <div className="p-4 bg-base-200 rounded-lg space-y-3 prose prose-sm max-w-none">
    <h4 className="font-bold">法官助理深度分析报告</h4>
    <p>
      <b>案情摘要:</b> {data.case_summary}
    </p>
    <div>
      <b>核心争议焦点:</b>
      <ul className="list-disc list-inside">
        {data.dispute_focus.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
    <div>
      <b>关键事实时间线:</b>
      <ul className="list-disc list-inside">
        {data.fact_timeline.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
    <div>
      <b>调解切入点:</b>
      <ul className="list-disc list-inside">
        {data.mediation_points.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  </div>
);

const getPartyNameFromFormData = (
  formData: any, // 在这个受控的函数里，使用 any 是可接受的
  partyType: "plaintiff" | "defendant"
): string[] => {
  if (!formData) return [];
  const keyNatural =
    partyType === "plaintiff" ? "plaintiffs_natural" : "defendants_natural";
  const keyLegal =
    partyType === "plaintiff" ? "plaintiffs_legal" : "defendants_legal";
  const naturalParties = formData[keyNatural] || [];
  const legalParties = formData[keyLegal] || [];
  const names = [
    ...naturalParties.map((p: any) => p.name).filter(Boolean),
    ...legalParties.map((p: any) => p.entityName).filter(Boolean),
  ];
  return names;
};

// =======================================================================
//                    CaseJudgementPage Component
// =======================================================================

export const CaseJudgementPage: React.FC = () => {
  const { caseNumber } = useParams<{ caseNumber: string }>();
  const [aiResult, setAiResult] = useState<React.ReactNode | null>(null);
  const [activeDefendantIndex, setActiveDefendantIndex] = useState(0);

  const {
    data: caseDetails,
    isLoading,
    error,
  } = useQuery<CaseDetails>({
    queryKey: ["adminCaseDetails", caseNumber],
    queryFn: () => fetchDocumentsForCase(caseNumber!),
    enabled: !!caseNumber,
  });

  const documents = caseDetails?.documents;
  const claimDoc = useMemo(
    () => documents?.find((d) => d.document_type === "起诉状" && d.is_latest),
    [documents]
  );
  const defenseDocs = useMemo(
    () =>
      documents?.filter((d) => d.document_type === "答辩状" && d.is_latest) ||
      [],
    [documents]
  );

  const { plaintiffNames, pendingDefendantNames, defendantsWithDocs } =
    useMemo(() => {
      if (!claimDoc?.form_data)
        return {
          plaintiffNames: [],
          pendingDefendantNames: [],
          defendantsWithDocs: [],
        };
      const plaintiffs = getPartyNameFromFormData(
        claimDoc.form_data,
        "plaintiff"
      );
      const allDefs = getPartyNameFromFormData(claimDoc.form_data, "defendant");
      const submittedDefs = defenseDocs.map((doc) => ({
        name:
          getPartyNameFromFormData(doc.form_data, "defendant")[0] ||
          "未知答辩人",
        doc: doc,
      }));
      const submittedNames = new Set(submittedDefs.map((d) => d.name));
      const pendingDefs = allDefs.filter((name) => !submittedNames.has(name));
      return {
        plaintiffNames: plaintiffs,
        pendingDefendantNames: pendingDefs,
        defendantsWithDocs: submittedDefs,
      };
    }, [claimDoc, defenseDocs]);

  // === START: 核心修复点 - 将Hook和处理函数移入组件内部 ===
  const judgeMutation = useMutation({
    mutationFn: (data: {
      claimData: FinalDataObject;
      defenseDataList: FinalDataObject[];
    }) => analyzeForJudge(data.claimData, data.defenseDataList),
    onSuccess: (data) => {
      setAiResult(<AIJudgeReport data={data} />);
      toast.success("深度案情分析完成！");
    },
    onError: (e) => toast.error(`AI分析失败: ${e.message}`),
  });

  const handleJudgeAnalysis = () => {
    if (claimDoc?.final_data) {
      const defenseDataList = defenseDocs
        .map((d) => d.final_data)
        .filter((d): d is FinalDataObject => !!d);

      judgeMutation.mutate({
        claimData: claimDoc.final_data,
        defenseDataList,
      });
    } else {
      toast.error("缺少起诉状数据，无法分析。");
    }
  };
  // === END: 核心修复点 ===

  if (isLoading)
    return (
      <div className="text-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  if (error)
    return (
      <div className="alert alert-error">加载案件文书失败: {error.message}</div>
    );
  if (!caseDetails || !claimDoc)
    return (
      <div className="alert alert-warning">案件数据不完整或未找到起诉状。</div>
    );

  const activeDefenseDoc = defendantsWithDocs[activeDefendantIndex]?.doc;
  const isAnalyzing = judgeMutation.isPending;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">案件详情与研判</h1>
          <p className="font-mono text-base-content/70 mt-1">
            案号: {caseNumber} | 案由: {caseDetails.case_info.case_cause}
          </p>
        </div>
        <Link to="/admin/all-cases" className="btn btn-ghost btn-sm">
          返回列表
        </Link>
      </div>
      <div className="card bg-base-100 shadow-xl border">
        <div className="card-body">
          <h2 className="card-title">案件凭证信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label text-sm font-semibold">原告验证码</label>
              <MaskableCode code={caseDetails.case_info.plaintiff_code} />
            </div>
            <div>
              <label className="label text-sm font-semibold">被告验证码</label>
              <div className="space-y-2">
                {caseDetails.defendants.map((def) => (
                  <div key={def.id} className="flex items-center gap-2">
                    <span
                      className="font-semibold w-24 truncate"
                      title={def.name}
                    >
                      {def.name}:
                    </span>
                    <div className="flex-grow">
                      <MaskableCode code={def.verification_code} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl border">
        <div className="card-body">
          <h2 className="card-title">AI 法官助理</h2>
          <button
            onClick={handleJudgeAnalysis}
            className="btn btn-accent btn-sm"
            disabled={isAnalyzing}
          >
            {isAnalyzing && (
              <span className="loading loading-spinner loading-xs"></span>
            )}
            AI 深度案情分析 (综合所有诉辩状)
          </button>
          {isAnalyzing && (
            <div className="text-center mt-4">
              <div className="p-4 bg-base-200 rounded-lg">
                <span className="loading loading-dots"></span>
              </div>
            </div>
          )}
          <div className="mt-4">{aiResult}</div>
        </div>
      </div>

      {pendingDefendantNames.length > 0 && (
        <div className="alert alert-info">
          <span>
            以下被告尚未提交答辩状:{" "}
            <strong>{pendingDefendantNames.join("、")}</strong>
          </span>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl border">
        <div className="card-body">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
            <div className="space-y-4">
              <h2 className="text-xl font-bold">
                原告：
                <span className="font-normal">{plaintiffNames.join("、")}</span>
              </h2>
              <div className="p-4 bg-base-200 rounded-lg space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">诉讼请求</h3>
                  <DocumentContentDisplay
                    items={claimDoc.final_data.claimItems}
                  />
                </div>
                <div className="divider"></div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">事实与理由</h3>
                  <DocumentContentDisplay
                    items={claimDoc.final_data.factItems}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold">
                被告：
                <span className="font-normal">
                  {defendantsWithDocs[activeDefendantIndex]?.name || "..."}
                </span>
              </h2>
              {defendantsWithDocs.length > 1 && (
                <div role="tablist" className="tabs tabs-bordered">
                  {defendantsWithDocs.map((def, index) => (
                    <a
                      key={index}
                      role="tab"
                      className={`tab ${
                        activeDefendantIndex === index ? "tab-active" : ""
                      }`}
                      onClick={() => setActiveDefendantIndex(index)}
                    >
                      {def.name}
                    </a>
                  ))}
                </div>
              )}
              <div className="p-4 bg-base-200 rounded-lg space-y-4">
                {activeDefenseDoc ? (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        答辩事项 (v{activeDefenseDoc.version})
                      </h3>
                      <DocumentContentDisplay
                        items={activeDefenseDoc.final_data.defenseItems}
                      />
                    </div>
                    <div className="divider"></div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">事实与理由</h3>
                      <DocumentContentDisplay
                        items={activeDefenseDoc.final_data.factsAndReasons}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-center p-8 text-base-content/60">
                    {defendantsWithDocs.length > 0
                      ? "请选择一个被告查看其答辩状"
                      : "无被告信息"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
