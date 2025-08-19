// src/components/ClaimInfoPanel.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useConfig } from '../hooks/useConfig';
import { fetchClaimForDefense, fetchClaimInfoByCaseNumber } from '../api/documentApi';
import type { FinalDataObject, QuestionListItem, ClaimInfoResponse } from '../interfaces/document.types';
import toast from 'react-hot-toast';
import eventBus from '../utils/events';
import { analyzeOpponentDocument } from '../api/legalApi';
import type { OpponentAnalysisResult } from '../api/legalApi';

interface Props {
    initialCaseNumber: string | null;
    initialDefendantCode?: string | null;
    currentCaseCause: string;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;

// 对抗分析报告的展示组件
const OpponentAnalysisDisplay: React.FC<{ result: OpponentAnalysisResult }> = ({ result }) => (
    <div className="mt-4 space-y-4 text-xs p-3 bg-accent/5 rounded-lg border border-dashed border-accent/30">
        <div className="collapse collapse-arrow bg-base-100/50 shadow-sm">
            <input type="checkbox" defaultChecked />
            <div className="collapse-title text-sm font-semibold">诉请要素解构</div>
            <div className="collapse-content">
                <p className="text-xs text-base-content/70 mb-2">AI分析：要让原告的诉请成立，他们必须向法院证明以下几点：</p>
                <ul className="list-decimal list-inside space-y-1">
                    {result.claim_deconstruction.map((fact, i) => <li key={i}>{fact}</li>)}
                </ul>
            </div>
        </div>
        <div className="collapse collapse-arrow bg-base-100/50 shadow-sm">
            <input type="checkbox" defaultChecked />
            <div className="collapse-title text-sm font-semibold">事实陈述的潜在弱点</div>
            <div className="collapse-content">
                <ul className="list-disc list-inside space-y-1">
                    {result.factual_weaknesses.map((point, i) => <li key={i}>{point}</li>)}
                </ul>
            </div>
        </div>
        <div className="collapse collapse-arrow bg-base-100/50 shadow-sm">
            <input type="checkbox" defaultChecked />
            <div className="collapse-title text-sm font-semibold">我方反驳策略建议</div>
            <div className="collapse-content">
                <ul className="list-disc list-inside space-y-1">
                    {result.rebuttal_strategies.map((sugg, i) => <li key={i}>{sugg}</li>)}
                </ul>
            </div>
        </div>
    </div>
);




// 子组件：用于展示已加载的数据项
const DocumentDisplayItems: React.FC<{ items?: QuestionListItem[] }> = ({ items }) => {
    if (!items || items.length === 0) {
        return <p className="text-sm text-base-content/60 px-1">暂无相关信息。</p>;
    }
    return (
        <div className="space-y-4">
            {items.map((item, index) => (
                // 过滤掉空的或仅有标题的条目
                item.answers && item.answers.trim() !== '' && (
                    <div key={index} className="pb-2 border-b border-base-200 last:border-b-0">
                        {/* 只有当问题不是通用标题时才显示 */}
                        {item.question && !item.question.includes('完整陈述') &&
                            <p className="font-semibold text-sm mb-1">{item.question}</p>
                        }
                        <pre className="whitespace-pre-wrap font-sans text-sm">{item.answers}</pre>
                    </div>
                )
            ))}
        </div>
    );
};


export const ClaimInfoPanel: React.FC<Props> = ({ initialCaseNumber, initialDefendantCode, currentCaseCause }) => {
    const { appMode } = useConfig();

    const [caseNumberInput, setCaseNumberInput] = useState(initialCaseNumber || '');
    const [code, setCode] = useState(initialDefendantCode || '');
    const [claimData, setClaimData] = useState<FinalDataObject | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSearchSuccessful, setIsSearchSuccessful] = useState(false); // 新增状态跟踪查询是否成功

    // (新增) State for active tab
    const [activeTab, setActiveTab] = useState<'claims' | 'facts' | 'analysis'>('claims');
    const [attempts, setAttempts] = useState(0);
    const [lockoutTime, setLockoutTime] = useState<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLocked = lockoutTime !== null && lockoutTime > Date.now();
    const [analysisResult, setAnalysisResult] = useState<OpponentAnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyzeOpponent = async () => {
        if (!claimData) return;
        setIsAnalyzing(true);
        setAnalysisResult(null);
        try {
            const result = await analyzeOpponentDocument(claimData);
            setAnalysisResult(result);
            setActiveTab('analysis');
            toast.success("对抗分析完成！");
        } catch (error) {
            // toast is handled in api layer
        } finally {
            setIsAnalyzing(false);
        }
    };



    useEffect(() => {
        // 清理定时器
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const handleSearch = useCallback(async () => {
        if (isLocked) {
            toast.error(`查询失败次数过多，请在稍后重试。`);
            return;
        }
        const numToSearch = caseNumberInput.trim();
        const codeToSearch = code.trim();

        if (!numToSearch) {
            toast.error("请输入案号");
            return;
        }
        if (appMode === 'court' && !codeToSearch) {
            toast.error("请输入被告验证码");
            return;
        }

        setIsLoading(true);
        setError(null);
        setClaimData(null);
        setAnalysisResult(null);
        setActiveTab('claims');
        setIsSearchSuccessful(false);

        try {
            let data: FinalDataObject | null = null;
            if (appMode === 'court') {
                data = await fetchClaimForDefense(numToSearch, codeToSearch, currentCaseCause);
            } else {
                const simpleData: ClaimInfoResponse = await fetchClaimInfoByCaseNumber(numToSearch, currentCaseCause);
                if ('claims' in simpleData) {
                    const parse = (text: string): QuestionListItem[] => text ? text.split('\n\n').map(b => ({ question: b.split(/:\s/, 1)[0], answers: b.split(/:\s/).slice(1).join(': ') })) : [];
                    data = {
                        partyInfo: [],
                        claimItems: parse(simpleData.claims),
                        factItems: parse(simpleData.facts),
                        mediationInfo: []
                    };
                } else if ('error' in simpleData) {
                    throw new Error(simpleData.error);
                }
            }
            setClaimData(data);
            if (data) {
                eventBus.dispatch('claimDataLoaded', data);
                setAttempts(0); // 成功后重置计数器
                if (lockoutTime) setLockoutTime(null); // 解除锁定
                setIsSearchSuccessful(true); // 设置查询成功状态
            } else {
                // 如果API成功但返回null
                setError("未找到相关文书。");
                eventBus.dispatch('claimDataLoaded', null);
                setIsSearchSuccessful(false); // 查询未找到结果，重置状态
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "查询失败";
            setError(errorMessage);
            eventBus.dispatch('claimDataLoaded', null);
            setIsSearchSuccessful(false); // 查询失败，重置状态

            // === START: 重试与锁定逻辑 ===
            if (appMode === 'court') {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                if (newAttempts >= MAX_ATTEMPTS) {
                    const newLockoutTime = Date.now() + LOCKOUT_DURATION_MS;
                    setLockoutTime(newLockoutTime);
                    toast.error(`查询失败次数过多，请在 5 分钟后重试。`);
                    // 设置一个定时器来在5分钟后自动解除锁定状态，以便UI可以刷新
                    timerRef.current = setTimeout(() => {
                        setLockoutTime(null);
                        setAttempts(0);
                    }, LOCKOUT_DURATION_MS);
                } else {
                    toast.error(`验证失败！剩余尝试次数: ${MAX_ATTEMPTS - newAttempts}`);
                }
            }
        } finally {
            setIsLoading(false);
        }
    }, [caseNumberInput, code, appMode, currentCaseCause, isLocked, attempts, lockoutTime]);

    useEffect(() => {
        // 当初始案号和(在法院模式下)初始验证码都存在时，自动触发查询
        const shouldAutoSearch = initialCaseNumber && (appMode === 'open' || (appMode === 'court' && initialDefendantCode));

        if (shouldAutoSearch) {
            // 确保 state 已更新
            setCaseNumberInput(initialCaseNumber!);
            if (initialDefendantCode) setCode(initialDefendantCode);

            toast.success("已自动加载案件信息并查询起诉状...", { duration: 2000 });
            // 使用 useCallback 版本的 handleSearch
            handleSearch();
        }
    }, [initialCaseNumber, initialDefendantCode, appMode, handleSearch]);

    return (
        <div className="card border shadow-md h-full">
            <div className="card-body p-4 flex flex-col h-full">
                <div className="border-b pb-2 flex-shrink-0">
                    <h2 className="card-title text-lg font-bold">起诉状查询助手</h2>
                </div>

                {/* 查询区域 - 仅在未成功查询时显示 */}
                {!isSearchSuccessful && (
                    <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="py-4 flex flex-col gap-3 flex-shrink-0">
                        <div className="form-control">
                            <label className="label py-0"><span className="label-text text-xs">案号</span></label>
                            <input
                                type="text"
                                placeholder="请输入案号"
                                className="input input-bordered input-sm w-full"
                                value={caseNumberInput}
                                onChange={(e) => setCaseNumberInput(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        {appMode === 'court' && (
                            <div className="form-control">
                                <label className="label py-0"><span className="label-text text-xs">被告验证码</span></label>
                                <input
                                    type="text"
                                    placeholder="请输入被告验证码"
                                    className="input input-bordered input-sm w-full"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        )}
                        <button type="submit" className="btn btn-sm btn-primary" disabled={isLoading || isLocked}>
                            {isLoading ? <span className="loading loading-spinner loading-xs"></span> : '查询起诉状'}
                        </button>
                    </form>
                )}

                {/* 查询成功后显示标题 */}
                {isSearchSuccessful && (
                    <div className="py-4 flex-shrink-0">
                        <h3 className="font-bold text-base">本案的起诉状信息</h3>
                    </div>
                )}

                {/* 内容展示区 */}
                <div className="flex-1 border-t pt-4 min-h-0 flex flex-col">
                    {isLoading && <div className="text-center p-4"><span className="loading loading-spinner text-primary"></span></div>}

                    {error && !isLoading && <div role="alert" className="alert alert-warning p-3"><span className="text-sm">{error}</span></div>}

                    {claimData && !isLoading && !error && (
                        <div className="flex flex-col h-full min-h-0">
                            <div className="tabs tabs-boxed mb-4 flex-shrink-0">
                                <button
                                    type="button"
                                    className={`tab ${activeTab === 'claims' ? 'tab-active font-bold' : ''}`}
                                    onClick={() => setActiveTab('claims')}
                                >
                                    诉讼请求
                                </button>
                                <button
                                    type="button"
                                    className={`tab ${activeTab === 'facts' ? 'tab-active font-bold' : ''}`}
                                    onClick={() => setActiveTab('facts')}
                                >
                                    事实与理由
                                </button>
                                {analysisResult && (
                                    <button
                                        type="button"
                                        className={`tab ${activeTab === 'analysis' ? 'tab-active font-bold text-accent' : ''}`}
                                        onClick={() => setActiveTab('analysis')}
                                    >
                                        AI分析
                                    </button>)}
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                                {activeTab === 'claims' && <DocumentDisplayItems items={claimData.claimItems} />}
                                {activeTab === 'facts' && <DocumentDisplayItems items={claimData.factItems} />}
                                {activeTab === 'analysis' && analysisResult && <OpponentAnalysisDisplay result={analysisResult} />}
                            </div>
                            <div className="mt-4 pt-4 border-t flex-shrink-0">
                                <button className="btn btn-sm btn-accent w-full" onClick={handleAnalyzeOpponent} disabled={isAnalyzing}>
                                    {isAnalyzing ? <span className="loading loading-spinner loading-xs text-white"></span> : '🤖'}
                                    {isAnalyzing ? '分析中...' : 'AI 弱点分析 & 反驳建议'}
                                </button>
                                {isAnalyzing && <div className="text-center p-2 text-xs">AI正在深度分析起诉状...</div>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};