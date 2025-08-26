// src/pages/admin/FilingReviewPage.tsx (已优化)

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchDocumentsForCase } from '../../api/caseApi';
import type { CaseDetails } from '../../api/caseApi'; // (修改) 使用更完整的 CaseDetails 类型
import { analyzeForFiling, updateCaseNumber } from '../../api/adminApi';
import type { FilingAnalysisResult } from '../../api/adminApi';
import type { QuestionListItem, DocxListItem, FinalDataObject } from '../../interfaces/document.types';
import { MaskableCode } from '../../components/MaskableCode'; // (新增) 引入验证码组件

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
const AIFilingReport: React.FC<{ data: FilingAnalysisResult }> = ({ data }) => (
    <div className="p-4 bg-base-200 rounded-lg space-y-3 prose prose-sm max-w-none">
        <h4 className="font-bold">立案要素审查报告</h4>
        <p><b>核心诉求:</b> {data.summary}</p>
        <p><b>是否满足立案要素:</b> {data.meets_requirements ? <span className="text-success font-bold">是</span> : <span className="text-error font-bold">否</span>}</p>
        <div><b>缺失或待明确的要素:</b><ul className="list-disc list-inside">{data.missing_elements.map(i => <li key={i}>{i}</li>)}</ul></div>
        <div><b>审查建议:</b><ul className="list-disc list-inside">{data.suggestions.map(i => <li key={i}>{i}</li>)}</ul></div>
    </div>
);

export const FilingReviewPage: React.FC = () => {
    const { caseNumber } = useParams<{ caseNumber: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const [aiResult, setAiResult] = useState<React.ReactNode | null>(null);

    // (修改) 使用 CaseDetails 类型，它包含了 documents, case_info, defendants
    const { data: caseDetails, isLoading, error } = useQuery<CaseDetails>({
        queryKey: ['adminCaseDetails', caseNumber], // 与 JudgementPage 保持一致
        queryFn: () => fetchDocumentsForCase(caseNumber!),
        enabled: !!caseNumber,
    });

    const claimDoc = caseDetails?.documents?.find(d => d.document_type === '起诉状' && d.is_latest);

    const filingMutation = useMutation({
        // (修复) 确保 final_data 存在
        mutationFn: (data: FinalDataObject) => analyzeForFiling(data),
        onSuccess: (data) => { setAiResult(<AIFilingReport data={data} />); toast.success("立案审查分析完成！"); },
        onError: (e) => toast.error(`AI分析失败: ${e.message}`)
    });

    const updateCaseNumberMutation = useMutation({
        mutationFn: ({ caseId, newNumber }: { caseId: number, newNumber: string }) => updateCaseNumber(caseId, newNumber),
        onSuccess: (_, vars) => {
            toast.success("案号更新成功，案件已正式立案！");
            queryClient.invalidateQueries({ queryKey: ['pendingCases'] });
            // 立案后跳转到更强大的研判页
            navigate(`/admin/judgement/${encodeURIComponent(vars.newNumber)}`); 
        },
        onError: (e) => toast.error(`更新失败: ${e.message}`)
    });

    const handleFilingAnalysis = () => {
        if (claimDoc?.final_data) {
            filingMutation.mutate(claimDoc.final_data);
        } else {
            toast.error("缺少起诉状数据，无法分析。");
        }
    };
    
    const handleUpdateCaseNumber = () => {
        if (!caseDetails) return;
        const newNumber = prompt("请输入新的正式案号：", caseNumber);
        if (newNumber && newNumber.trim() && newNumber !== caseNumber) {
            updateCaseNumberMutation.mutate({ caseId: caseDetails.case_info.id, newNumber: newNumber.trim() });
        }
    };

    if (isLoading) return <div className="text-center"><span className="loading loading-spinner loading-lg"></span></div>;
    if (error) return <div className="alert alert-error">加载案件文书失败: {error.message}</div>;
    // (修改) 增加对 caseDetails 的检查
    if (!caseDetails || !claimDoc) return <div className="alert alert-warning">案件数据不完整或未找到起诉状。</div>;

    const isAnalyzing = filingMutation.isPending;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">立案审查</h1>
                    <p className="font-mono text-base-content/70 mt-1">
                        临时案号: {caseNumber} | 案由: {claimDoc.final_data.case_type}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleUpdateCaseNumber} className="btn btn-secondary btn-sm" disabled={updateCaseNumberMutation.isPending}>
                        {updateCaseNumberMutation.isPending && <span className="loading loading-spinner loading-xs"></span>}
                        立案 (修改案号)
                    </button>
                    <Link to="/admin/pending-cases" className="btn btn-ghost btn-sm">返回列表</Link>
                </div>
            </div>

            {/* (新增) 复用凭证信息卡片 */}
            <div className="card bg-base-100 shadow-xl border">
                 <div className="card-body">
                    <h2 className="card-title">案件凭证信息</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label text-sm font-semibold">原告验证码</label>
                            <MaskableCode code={caseDetails.case_info.plaintiff_code} />
                        </div>
                        <div>
                            <label className="label text-sm font-semibold">被告验证码 (供送达使用)</label>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                            {caseDetails.defendants.map(def => (
                                <div key={def.id} className="flex items-center gap-2">
                                    <span className="font-semibold w-24 truncate" title={def.name}>{def.name}:</span>
                                    <div className="flex-grow"><MaskableCode code={def.verification_code} /></div>
                                </div>
                            ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow-xl border">
                <div className="card-body">
                    <h2 className="card-title">AI立案审查助理</h2>
                    <button onClick={handleFilingAnalysis} className="btn btn-primary btn-sm" disabled={isAnalyzing}>
                        {isAnalyzing && <span className="loading loading-spinner loading-xs"></span>}
                        AI立案要素审查
                    </button>
                    {isAnalyzing && <div className="text-center mt-4"><div className="p-4 bg-base-200 rounded-lg"><span className="loading loading-dots"></span></div></div>}
                    <div className="mt-4">{aiResult}</div>
                </div>
            </div>
            
            <div>
                <h2 className="text-2xl font-bold mb-4">起诉状内容 (版本 v{claimDoc.version})</h2>
                <div className="card bg-base-100 shadow-md border">
                    <div className="card-body space-y-4">
                        <div><h3 className="card-title text-lg">当事人信息</h3><DocumentContentDisplay items={claimDoc.final_data.partyInfo} /></div>
                        <div className="divider"></div>
                        <div><h3 className="card-title text-lg">诉讼请求</h3><DocumentContentDisplay items={claimDoc.final_data.claimItems} /></div>
                        <div className="divider"></div>
                        <div><h3 className="card-title text-lg">事实与理由</h3><DocumentContentDisplay items={claimDoc.final_data.factItems} /></div>
                    </div>
                </div>
            </div>
        </div>
    );
};