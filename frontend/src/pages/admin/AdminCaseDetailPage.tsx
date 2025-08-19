// src/pages/admin/AdminCaseDetailPage.tsx

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchDocumentsForCase  } from '../../api/caseApi';
import type { FullDocumentData } from '../../api/caseApi';
import { analyzeForFiling, analyzeForJudge, updateCaseNumber  } from '../../api/adminApi';
import type {FilingAnalysisResult, JudgeAnalysisResult}  from '../../api/adminApi';
import type { FinalDataObject, DocxListItem, QuestionListItem } from '../../interfaces/document.types';

// 子组件可以放在同文件或单独文件
const AIFilingReport: React.FC<{ data: FilingAnalysisResult }> = ({ data }) => (
    <div className="p-4 bg-base-200 rounded-lg space-y-3 prose prose-sm max-w-none">
        <h4 className="font-bold">立案要素审查报告</h4>
        <p><b>核心诉求:</b> {data.summary}</p>
        <p><b>是否满足立案要素:</b> {data.meets_requirements ? <span className="text-success font-bold">是</span> : <span className="text-error font-bold">否</span>}</p>
        <div><b>缺失或待明确的要素:</b><ul className="list-disc list-inside">{data.missing_elements.map(i => <li key={i}>{i}</li>)}</ul></div>
        <div><b>审查建议:</b><ul className="list-disc list-inside">{data.suggestions.map(i => <li key={i}>{i}</li>)}</ul></div>
    </div>
);

const AIJudgeReport: React.FC<{ data: JudgeAnalysisResult }> = ({ data }) => (
    <div className="p-4 bg-base-200 rounded-lg space-y-3 prose prose-sm max-w-none">
        <h4 className="font-bold">法官助理深度分析报告</h4>
        <p><b>案情摘要:</b> {data.case_summary}</p>
        <div><b>核心争议焦点:</b><ul className="list-disc list-inside">{data.dispute_focus.map(i => <li key={i}>{i}</li>)}</ul></div>
        <div><b>关键事实时间线:</b><ul className="list-disc list-inside">{data.fact_timeline.map(i => <li key={i}>{i}</li>)}</ul></div>
        <div><b>调解切入点:</b><ul className="list-disc list-inside">{data.mediation_points.map(i => <li key={i}>{i}</li>)}</ul></div>
    </div>
);

const DocumentContentDisplay: React.FC<{ items?: (QuestionListItem | DocxListItem)[] }> = ({ items }) => {
    if (!items || items.length === 0) return <p className="text-base-content/60">无内容</p>;
    
    // 在组件内部进行数据转换
    const formattedItems = items.map(item => {
        if ('question' in item) { // It's a QuestionListItem
            return { title: item.question, content: item.answers };
        } else { // It's a DocxListItem
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

export const AdminCaseDetailPage: React.FC = () => {
    const { caseNumber } = useParams<{ caseNumber: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const [aiResult, setAiResult] = useState<React.ReactNode | null>(null);

    const { data: documents, isLoading, error } = useQuery<FullDocumentData[]>({
        queryKey: ['adminCaseDocs', caseNumber],
        queryFn: () => fetchDocumentsForCase(caseNumber!),
        enabled: !!caseNumber,
    });

    const claimDoc = documents?.find(d => d.document_type === '起诉状' && d.is_latest);
    const defenseDoc = documents?.find(d => d.document_type === '答辩状' && d.is_latest);

    const filingMutation = useMutation({
        mutationFn: (data: FullDocumentData) => analyzeForFiling(data.final_data),
        onSuccess: (data) => setAiResult(<AIFilingReport data={data} />),
        onError: (e) => toast.error(`AI分析失败: ${e.message}`)
    });
    
    const judgeMutation = useMutation({
        mutationFn: (data: { claim: FullDocumentData, defense: FullDocumentData | null }) => analyzeForJudge(data.claim.final_data, data.defense?.final_data || null),
        onSuccess: (data) => setAiResult(<AIJudgeReport data={data} />),
        onError: (e) => toast.error(`AI分析失败: ${e.message}`)
    });

    const updateCaseNumberMutation = useMutation({
        mutationFn: ({ caseId, newNumber }: { caseId: number, newNumber: string }) => updateCaseNumber(caseId, newNumber),
        onSuccess: (_, vars) => {
            toast.success("案号更新成功！");
            queryClient.invalidateQueries({ queryKey: ['pendingCases'] });
            navigate(`/admin/cases/${encodeURIComponent(vars.newNumber)}`);
        },
        onError: (e) => toast.error(`更新失败: ${e.message}`)
    });
    
    const handleFilingAnalysis = () => {
        if (claimDoc) filingMutation.mutate(claimDoc);
        else toast.error("缺少起诉状数据");
    };
    
    const handleJudgeAnalysis = () => {
        if (claimDoc) judgeMutation.mutate({ claim: claimDoc, defense: defenseDoc || null });
        else toast.error("缺少起诉状数据");
    };

    const handleUpdateCaseNumber = () => {
        if (!claimDoc) return;
        const newNumber = prompt("请输入新的正式案号：", caseNumber);
        if (newNumber && newNumber.trim() && newNumber !== caseNumber) {
            updateCaseNumberMutation.mutate({ caseId: claimDoc.case_id, newNumber: newNumber.trim() });
        }
    };

    if (isLoading) return <div className="text-center"><span className="loading loading-spinner loading-lg"></span></div>;
    if (error) return <div className="alert alert-error">加载案件文书失败: {error.message}</div>;
    if (!claimDoc) return <div className="alert alert-warning">未找到该案件的起诉状信息。</div>;

    const isPendingCase = caseNumber?.startsWith('新案件-');
    const isAnalyzing = filingMutation.isPending || judgeMutation.isPending;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">案件详情与智能分析</h1>
                    <p className="font-mono text-base-content/70">案号: {caseNumber} | 案由: {claimDoc.final_data.case_type}</p>
                </div>
                <div className="flex items-center gap-2">
                    {isPendingCase && (
                        <button onClick={handleUpdateCaseNumber} className="btn btn-secondary btn-sm" disabled={updateCaseNumberMutation.isPending}>
                            {updateCaseNumberMutation.isPending && <span className="loading loading-spinner loading-xs"></span>}
                            立案 (修改案号)
                        </button>
                    )}
                    <Link to={isPendingCase ? "/admin/pending-cases" : "/admin/all-cases"} className="btn btn-ghost btn-sm">返回列表</Link>
                </div>
            </div>

            <div className="card bg-base-100 shadow-xl border mb-8">
                <div className="card-body">
                    <h2 className="card-title">AI 法官助理</h2>
                    <div className="flex gap-4 flex-wrap">
                        <button onClick={handleFilingAnalysis} className="btn btn-primary btn-sm" disabled={isAnalyzing}>AI立案要素审查</button>
                        <button onClick={handleJudgeAnalysis} className="btn btn-accent btn-sm" disabled={!defenseDoc || isAnalyzing}>AI深度案情分析</button>
                    </div>
                    {isAnalyzing && <div className="text-center mt-4"><div className="p-4 bg-base-200 rounded-lg"><span className="loading loading-dots"></span><p className="text-sm">AI正在分析中...</p></div></div>}
                    <div className="mt-4">{aiResult}</div>
                </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-4 mt-8">诉辩状核心内容</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card bg-base-100 shadow-md border">
                    <div className="card-body">
                        <h3 className="card-title">原告 - 起诉状 (v{claimDoc.version})</h3>
                        <div className="divider my-2"></div>
                        <h4 className="font-bold mt-2">诉讼请求</h4>
                        <DocumentContentDisplay items={claimDoc.final_data.claimItems} />
                        <h4 className="font-bold mt-4">事实与理由</h4>
                        <DocumentContentDisplay items={claimDoc.final_data.factItems} />
                    </div>
                </div>
                <div className="card bg-base-100 shadow-md border">
                    <div className="card-body">
                        <h3 className="card-title">被告 - 答辩状 {defenseDoc ? `(v${defenseDoc.version})` : ''}</h3>
                        <div className="divider my-2"></div>
                        {defenseDoc ? (
                            <>
                                <h4 className="font-bold mt-2">答辩事项</h4>
                                {/* (修复) 现在可以正确传递 */}
                                <DocumentContentDisplay items={defenseDoc.final_data.defenseItems} />
                                <h4 className="font-bold mt-4">事实与理由</h4>
                                <DocumentContentDisplay items={defenseDoc.final_data.factsAndReasons} />
                            </>
                        ) : (
                            <p className="text-center p-8 text-base-content/60">被告尚未提交答辩状</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};