// src/pages/admin/AIUsageStatsPage.tsx (最终完整版)

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/axiosConfig';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, Sector, CartesianGrid } from 'recharts';
import type { AIUsageStats } from '../../api/adminApi'; // 确保从 adminApi 导入

// API 调用函数
const fetchAIUsageStats = async (): Promise<AIUsageStats> => {
    try {
        const { data } = await apiClient.get('/api/admin/ai-usage-stats');
        return data;
    } catch (error) {
        const errorMessage = "加载AI用量统计失败";
        toast.error(errorMessage);
        throw new Error(errorMessage);
    }
};

// 子组件：带输入/输出详情的统计卡片
const StatCardDetailed: React.FC<{ title: string; usage: AIUsageStats['today_usage'] }> = ({ title, usage }) => {
    const format = (n: number = 0) => new Intl.NumberFormat().format(n);
    return (
        <div className="stat">
            <div className="stat-title">{title}</div>
            <div className="stat-value text-primary">{format(usage.total)}</div>
            <div className="stat-desc">
                <span>输入: {format(usage.prompt)}</span>
                <span className="mx-2">|</span>
                <span>输出: {format(usage.completion)}</span>
                <span className="mx-2">|</span>
                <span>模型思考花费：{format(usage.total - usage.prompt - usage.completion)}</span>
            </div>
        </div>
    );
};

// 子组件：饼图的自定义标签和形状
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';
  const format = (n: number) => new Intl.NumberFormat().format(n);

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>{payload.source}</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 6} outerRadius={outerRadius + 10} fill={fill} />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${format(value)} Tokens`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(占比 ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

// 主页面组件
export const AIUsageStatsPage: React.FC = () => {
    const { data: stats, isLoading, error } = useQuery<AIUsageStats>({
        queryKey: ['aiUsageStats'],
        queryFn: fetchAIUsageStats
    });

    const [activeIndex, setActiveIndex] = useState(0);

    if (isLoading) return <div className="flex justify-center items-center h-full"><span className="loading loading-spinner loading-lg"></span></div>;
    if (error) return <div className="alert alert-error">加载数据失败: {error.message}</div>;
    if (!stats) return <div className="alert alert-warning">未能加载到用量数据。</div>;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">AI Tokens 使用统计</h1>

            <div className="stats shadow w-full stats-vertical lg:stats-horizontal">
                <StatCardDetailed title="今日总用量" usage={stats.today_usage} />
                <StatCardDetailed title="本月总用量" usage={stats.this_month_usage} />
                <StatCardDetailed title="历史总用量" usage={stats.total_usage} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 按模型用量分布 - 堆叠柱状图 */}
                <div className="card bg-base-100 shadow-xl border">
                    <div className="card-body">
                        <h2 className="card-title">各模型用量分布</h2>
                        <div style={{ width: '100%', height: 400 }}>
                            <ResponsiveContainer>
                                <BarChart data={stats.by_model} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="model_name" width={100} interval={0} />
                                    <Tooltip formatter={(value) => new Intl.NumberFormat().format(value as number)} />
                                    <Legend />
                                    <Bar dataKey="prompt_tokens" stackId="a" fill="#8884d8" name="输入Tokens" />
                                    <Bar dataKey="completion_tokens" stackId="a" fill="#82ca9d" name="输出Tokens" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                
                {/* 按功能用量分布 - 动态饼图 */}
                <div className="card bg-base-100 shadow-xl border">
                    <div className="card-body">
                         <h2 className="card-title">各功能用量分布</h2>
                         <div style={{ width: '100%', height: 400 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie 
                                        data={stats.by_source} 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={80}
                                        outerRadius={120} 
                                        fill="#8884d8"
                                        dataKey="total_tokens"
                                        nameKey="source"
                                    >
                                        {stats.by_source.map((_entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Legend formatter={(value) => <span className="text-gray-600">{value}</span>} />
                                </PieChart>
                             </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};