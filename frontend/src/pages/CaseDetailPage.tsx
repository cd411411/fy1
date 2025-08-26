import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchDocumentsForCase, analyzeCase } from '../api/caseApi';
import type { AnalysisResult, FullDocumentData } from '../api/caseApi';
import toast from 'react-hot-toast';

// --- UI 子组件 ---

const DocumentSelector: React.FC<{
  documents: FullDocumentData[],
  onSelect: (doc: FullDocumentData | null) => void,
  selectedValue: FullDocumentData | null,
  title: string
}> = ({ documents, onSelect, selectedValue, title }) => {
  const selectedIndex = selectedValue ? documents.findIndex(d => d.id === selectedValue.id) : -1;
  return (
    <div>
      <h3 className="font-bold mb-2">{title}</h3>
      {documents.length > 0 ? (
        <select
          title='请选择一个版本'
          className="select select-bordered w-full"
          value={selectedIndex === -1 ? '' : selectedIndex}
          onChange={(e) => onSelect(e.target.value ? documents[parseInt(e.target.value)] : null)}
        >
          <option value="">请选择一个版本</option>
          {documents.map((doc, index) => (
            <option key={doc.id} value={index}>
              版本 {doc.version} - {new Date(doc.created_at).toLocaleString()}
            </option>
          ))}
        </select>
      ) : <p className="text-sm opacity-60">暂无{title}</p>}
    </div>
  );
};

// 定义数据项的类型
interface DocumentItem {
  question?: string;
  answers: string;
}

const ContentDisplay: React.FC<{ items?: DocumentItem[] }> = ({ items }) => {
  if (!items || items.length === 0) return <span className="opacity-60">暂无数据</span>;
  // 只显示核心内容，忽略第一个"完整陈述"
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx}>
          {item.question && <div className="font-semibold">{item.question}</div>}
          <div className="whitespace-pre-wrap font-sans text-sm">{item.answers}</div>
        </div>
      ))}
    </div>
  );
};

const AnalysisResultCard: React.FC<{ title: string, content?: string | string[] }> = ({ title, content }) => (
  <div className="card shadow-md">
    <div className="card-body p-4">
      <h3 className="card-title text-base">{title}</h3>
      {Array.isArray(content) ? (
        <ul className="list-disc list-inside text-sm space-y-1">
          {content.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      ) : (
        <p className="text-sm whitespace-pre-wrap">{content}</p>
      )}
    </div>
  </div>
);

// --- 主页面组件 ---
export const CaseDetailPage: React.FC = () => {
  const { caseNumber } = useParams<{ caseNumber: string }>();

  const [selectedClaim, setSelectedClaim] = useState<FullDocumentData | null>(null);
  const [selectedDefense, setSelectedDefense] = useState<FullDocumentData | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['caseDocuments', caseNumber],
    queryFn: () => fetchDocumentsForCase(caseNumber!),
    enabled: !!caseNumber,
  });

  const {
    mutate: performAnalysis,
    isPending: isAnalyzing,
    data: analysisResult
  } = useMutation<AnalysisResult, Error, { claimData: FullDocumentData['final_data']; defenseData: FullDocumentData['final_data'] }>({
    mutationFn: ({ claimData, defenseData }) => analyzeCase(claimData, defenseData),
    onSuccess: () => { toast.success("AI判案分析完成！"); },
    onError: (error) => { toast.error(`AI分析失败: ${error.message}`); },
  });

  const claimDocuments = useMemo(() =>
    documents?.filter((d) => d.document_type === '起诉状') || [],
    [documents]
  );
  const defenseDocuments = useMemo(() =>
    documents?.filter((d) => d.document_type === '答辩状') || [],
    [documents]
  );

  // --- 自动选择最新版本 ---
  useEffect(() => {
    if (claimDocuments.length > 0 && !selectedClaim) {
      setSelectedClaim(claimDocuments[0]); // 假设API返回时已按版本倒序
    }
    if (defenseDocuments.length > 0 && !selectedDefense) {
      setSelectedDefense(defenseDocuments[0]);
    }
  }, [claimDocuments, defenseDocuments, selectedClaim, selectedDefense]);

  const canAnalyze = selectedClaim && selectedDefense;

  const handleAnalyze = () => {
    if (canAnalyze) {
      performAnalysis({
        claimData: selectedClaim.final_data,
        defenseData: selectedDefense.final_data,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">案件详情与AI分析</h1>
          <p className="opacity-70 mb-6">案号: {caseNumber}</p>
        </div>
        <Link to="/cases" className="btn btn-ghost">返回案件列表</Link>
      </div>

      <div className="card shadow-lg border mb-8">
        <div className="card-body">
          <h2 className="text-xl font-bold mb-4">文书版本选择</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DocumentSelector
              documents={claimDocuments}
              onSelect={setSelectedClaim}
              selectedValue={selectedClaim}
              title="选择起诉状版本"
            />
            <DocumentSelector
              documents={defenseDocuments}
              onSelect={setSelectedDefense}
              selectedValue={selectedDefense}
              title="选择答辩状版本"
            />
          </div>

          {selectedClaim && selectedDefense ? (
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-2">核心内容对比</h3>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <colgroup>
                    <col className="w-[20%]" />
                    <col className="w-[40%]" />
                    <col className="w-[40%]" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>事项</th>
                      <th>原告诉请</th>
                      <th>被告答辩</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th>诉讼/答辩事项</th>
                      <td>
                        <ContentDisplay items={selectedClaim.final_data.claimItems} />
                      </td>
                      <td>
                        <ContentDisplay items={selectedDefense.final_data.defenseItems} />
                      </td>
                    </tr>
                    <tr>
                      <th>事实与理由</th>
                      <td>
                        <ContentDisplay items={selectedClaim.final_data.factItems} />
                      </td>
                      <td>
                        <ContentDisplay items={selectedDefense.final_data.factsAndReasons} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mt-6 text-center">
              <p className="text-sm opacity-60">请选择起诉状和答辩状的版本以进行对比和分析。</p>
            </div>
          )}
        </div>
      </div>

      <div className="card shadow-lg border">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">AI案件研判分析</h2>
            <button
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={!canAnalyze || isAnalyzing}
            >
              {isAnalyzing && <span className="loading loading-spinner"></span>}
              开始AI研判
            </button>
          </div>

          {isAnalyzing && !analysisResult && (
            <div className="text-center p-4">
              <p>AI正在深度分析案情，请稍候...</p>
            </div>
          )}

          {analysisResult && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <AnalysisResultCard
                  title="初步判责意见"
                  content={analysisResult.preliminary_judgment}
                />
              </div>
              <AnalysisResultCard
                title="核心争议焦点"
                content={analysisResult.key_disputes}
              />
              <AnalysisResultCard
                title="证据链薄弱环节"
                content={analysisResult.evidence_weaknesses}
              />
              <AnalysisResultCard
                title="需向原告核实的问题"
                content={analysisResult.questions_for_plaintiff}
              />
              <AnalysisResultCard
                title="需向被告核实的问题"
                content={analysisResult.questions_for_defendant}
              />
              <div className="md:col-span-2">
                <AnalysisResultCard
                  title="法律适用难点分析"
                  content={analysisResult.legal_difficulties}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseDetailPage;