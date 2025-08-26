// src/pages/admin/DashboardPage.tsx

import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../api/axiosConfig';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, BookOpen, Calendar, CheckSquare, Inbox } from 'lucide-react';

interface SystemStats {
    total_cases: number;
    pending_cases: number;
    filed_cases: number;
    total_documents: number;
    this_month_filed: number;
    this_year_filed: number;
    monthly_top_causes: { cause: string; count: number }[];
    weekly_daily_trend: { date: string; count: number }[];
    weekly_cause_distribution: { cause: string; count: number }[];
}

interface AIInsights {
    insights: string[];
}

const fetchStats = async (): Promise<SystemStats> => {
    try {
        const { data } = await apiClient.get('/api/admin/stats');
        return data;
    } catch (error) {
        const errorMessage = `加载统计数据失败：${error}`;
        toast.error(errorMessage);
        throw new Error(errorMessage);
    }
};

const analyzeStatsWithAI = async (stats: SystemStats): Promise<AIInsights> => {
    const { data } = await apiClient.post('/api/admin/ai-insights', { stats });
    return data;
};

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; className?: string }> = ({ title, value, icon, className }) => (
    <div className={`stat ${className}`}>
        <div className="stat-figure text-primary">{icon}</div>
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
    </div>
);

export const DashboardPage: React.FC = () => {
    const { data: stats, isLoading, error } = useQuery<SystemStats>({ 
        queryKey: ['adminStats'], 
        queryFn: fetchStats 
    });

    // (修改) AI 洞察现在是 useMutation
    const aiInsightMutation = useMutation({
        mutationFn: analyzeStatsWithAI,
        onSuccess: () => toast.success("AI数据洞察分析完成！"),
        onError: (e) => toast.error(`AI分析失败: ${e.message}`)
    });

    if (isLoading) return <div className="flex justify-center items-center h-full"><span className="loading loading-spinner loading-lg"></span></div>;
    if (error) return <div className="alert alert-error">加载数据失败: {error.message}</div>;
    if (!stats) return <div className="alert alert-warning">未能加载到统计数据。</div>;

    const formattedDailyTrend = stats.weekly_daily_trend.map(d => ({
        ...d,
        // 将 '2024-07-31' 格式化为 '07-31' 用于图表显示
        date: new Date(d.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
    }));

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">数据仪表盘</h1>
            
            <div className="stats shadow w-full stats-vertical lg:stats-horizontal">
                <StatCard title="总案件数" value={stats.total_cases} icon={<BookOpen />} />
                <StatCard title="已立案" value={stats.filed_cases} icon={<CheckSquare />} />
                <StatCard title="待立案" value={stats.pending_cases} icon={<Inbox />} className="text-secondary" />
                <StatCard title="本月立案" value={stats.this_month_filed} icon={<Calendar />} />
                <StatCard title="本年立案" value={stats.this_year_filed} icon={<Calendar />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 本周每日立案趋势 - 折线图 */}
                <div className="card bg-base-100 shadow-xl border">
                    <div className="card-body">
                        <h2 className="card-title">本周每日立案情况</h2>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart data={formattedDailyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" fontSize={12} />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="count" stroke="#8884d8" name="立案数" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 本月热门案由 */}
                <div className="card bg-base-100 shadow-xl border">
                    <div className="card-body">
                        <h2 className="card-title">本月热门案由</h2>
                        {stats.monthly_top_causes?.length > 0 ? (
                            <ul className="space-y-3 mt-2">
                                {stats.monthly_top_causes.map(item => (
                                    <li key={item.cause}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="truncate pr-2">{item.cause}</span>
                                            <span className="font-bold">{item.count} 件</span>
                                        </div>
                                        <progress className="progress progress-primary w-full" value={item.count} max={stats.monthly_top_causes[0].count}></progress>
                                    </li>
                                ))}
                            </ul>
                        ) : <p>暂无数据。</p>}
                    </div>
                </div>
            </div>

             {/* 本周案由分布 - 柱状图 */}
            <div className="card bg-base-100 shadow-xl border">
                <div className="card-body">
                    <h2 className="card-title">本周各案由立案数量</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={stats.weekly_cause_distribution}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="cause" fontSize={12} angle={-15} textAnchor="end" height={50} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#82ca9d" name="案件数" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* AI 洞察 */}
            <div className="card bg-base-100 shadow-xl border">
                <div className="card-body">
                    <div className="flex justify-between items-center">
                        <h2 className="card-title">🤖 AI 数据洞察</h2>
                        <button className="btn btn-sm btn-outline" onClick={() => aiInsightMutation.mutate(stats)} disabled={aiInsightMutation.isPending}>
                            {aiInsightMutation.isPending && <span className="loading loading-spinner loading-xs"></span>}
                            开始分析
                        </button>
                    </div>
                    {aiInsightMutation.isPending && <div className="text-center p-4"><span className="loading loading-dots"></span></div>}
                    {aiInsightMutation.data && (
                        <ul className="mt-4 space-y-2 list-disc list-inside">
                            {aiInsightMutation.data.insights.map((insight, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <AlertTriangle className="text-warning w-4 h-4 mt-1 flex-shrink-0" />
                                    <span>{insight}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};