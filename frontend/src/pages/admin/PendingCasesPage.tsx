// src/pages/admin/PendingCasesPage.tsx (最终完整版)

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/axiosConfig';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Pagination } from '../../components/Pagination';
import { Search } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

interface PendingCase {
    id: number;
    case_number: string;
    case_cause: string;
    created_at: string;
    plaintiff: string;
    defendant: string;
}

const ITEMS_PER_PAGE = 10;

const fetchPendingCases = async (searchTerm: string): Promise<PendingCase[]> => {
    try {
        const { data } = await apiClient.get('/api/admin/pending-cases', {
            params: { 
                search_term: searchTerm || undefined // 如果为空字符串则不发送
            }
        });
        return Array.isArray(data) ? data : [];
    } catch (error) {
        const errorMessage = `加载待立案案件列表失败:${error}`;
        toast.error(errorMessage);
        throw new Error(errorMessage);
    }
};

export const PendingCasesPage: React.FC = () => {
    const [searchTermInput, setSearchTermInput] = useState('');
    const debouncedSearchTerm = useDebounce(searchTermInput, 300);
    const [currentPage, setCurrentPage] = useState(1);
    
    const { data: cases = [], isLoading, error } = useQuery<PendingCase[]>({ 
        queryKey: ['pendingCases', debouncedSearchTerm],
        queryFn: () => fetchPendingCases(debouncedSearchTerm)
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm]);

    const paginatedCases = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return cases.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [cases, currentPage]);

    const totalPages = Math.ceil(cases.length / ITEMS_PER_PAGE);

    if (isLoading) return <div className="flex justify-center items-center h-full"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
    if (error) return <div className="alert alert-error">加载数据失败: {error.message}</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">待立案案件审查</h1>
                <p className="text-sm text-base-content/70 mt-2">这里列出了所有尚未分配正式案号的案件。请点击“审查与分析”进入详情页进行立案或分析。</p>
            </div>
            
            <div className="flex justify-between items-center gap-4">
                 <div className="form-control w-full max-w-xs">
                    <label className="input input-bordered flex items-center gap-2">
                      <input 
                        type="text" 
                        className="grow" 
                        placeholder="搜索临时案号、案由..."
                        value={searchTermInput}
                        onChange={(e) => setSearchTermInput(e.target.value)}
                      />
                      <Search className="w-4 h-4 opacity-70"/>
                    </label>
                </div>
                <span className="text-sm text-base-content/70 flex-shrink-0">共 {cases.length} 个待立案案件</span>
            </div>

            <div className="card bg-base-100 shadow-xl border">
                <div className="card-body">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead><tr><th>临时案号</th><th>案由</th><th>创建时间</th><th>操作</th></tr></thead>
                            <tbody>
                            {paginatedCases.length > 0 ? paginatedCases.map(c => (
                                <tr key={c.id} className="hover">
                                    <td className="font-mono text-warning font-semibold">{c.case_number}</td>
                                    <td><div className="badge badge-outline">{c.case_cause}</div></td>
                                    <td>{new Date(c.created_at).toLocaleString()}</td>
                                    <td>
                                        <Link to={`/admin/filing-review/${encodeURIComponent(c.case_number)}`} className="btn btn-sm btn-ghost text-primary">
                                            审查与分析
                                        </Link>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="text-center h-32">{searchTermInput ? '未找到匹配的待立案案件' : '暂无待立案案件'}</td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </div>
        </div>
    );
};