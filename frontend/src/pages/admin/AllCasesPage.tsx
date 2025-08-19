// src/pages/admin/AllCasesPage.tsx (最终完整版)

import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchAllCases } from "../../api/caseApi";
import type { CaseItem } from "../../api/caseApi";
import { Pagination } from "../../components/Pagination";
import { useDebounce } from "../../hooks/useDebounce"; // (新增) 引入 debounce hook

const ITEMS_PER_PAGE = 10;

export const AllCasesPage: React.FC = () => {
  // 搜索条件的 state
  const [searchTermInput, setSearchTermInput] = useState("");
  const [selectedCause, setSelectedCause] = useState("");

  // (新增) 使用 debounce 来防止用户输入时频繁触发API调用
  const debouncedSearchTerm = useDebounce(searchTermInput, 300); // 延迟300毫秒

  // 分页的 state
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: cases = [],
    isLoading,
    error,
  } = useQuery<CaseItem[]>({
    // queryKey 包含所有去抖后的搜索条件
    queryKey: ["allAdminCases", debouncedSearchTerm, selectedCause],
    // API函数接收所有参数
    queryFn: () => fetchAllCases(debouncedSearchTerm, selectedCause),
    staleTime: 5 * 60 * 1000,
  });

  // 搜索条件变化时，自动重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedCause]);

  // === START: 完整的前端分页逻辑 ===
  // paginatedCases 现在直接在 useQuery 返回的 cases 上进行操作
  const paginatedCases = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return cases.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [cases, currentPage]);
  // === END: 完整的前端分页逻辑 ===

  const totalPages = Math.ceil(cases.length / ITEMS_PER_PAGE);

  const caseCauses = useMemo(() => {
    // (优化) 从原始数据中提取案由，避免在搜索后列表变化
    const allCauses = cases.map((c) => c.case_cause).filter(Boolean);
    return [...new Set(allCauses)];
  }, [cases]);

  if (error)
    return (
      <div className="alert alert-error">加载数据失败: {error.message}</div>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">全部案件管理</h1>

      <div className="p-4 bg-base-200 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="form-control">
            <label className="input">
              <span className="label">关键词搜索</span>
            
            <input
              type="text"
              placeholder="案号、案由、当事人..."
              className="w-full"
              value={searchTermInput}
              onChange={(e) => setSearchTermInput(e.target.value)}
            />
            </label>
          </div>
          <div className="form-control">
            <label className="select">
              <span className="label">按案由筛选</span>
            
            <select
              className="select"
              value={selectedCause}
              onChange={(e) => setSelectedCause(e.target.value)}
            >
              <option value="">所有案由</option>
              {caseCauses.map((cause) => (
                <option key={cause} value={cause}>
                  {cause}
                </option>
              ))}
            </select>
            </label>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl border">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center p-8">
              <span className="loading loading-spinner text-primary"></span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>案号</th>
                      <th>案由</th>
                      <th>原告 / 被告</th>
                      <th>更新时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCases.length > 0 ? (
                      paginatedCases.map((c) => (
                        <tr key={c.id} className="hover">
                          <td
                            className={`font-mono ${
                              c.case_number.startsWith("新案件-")
                                ? "text-warning"
                                : ""
                            }`}
                          >
                            {c.case_number}
                          </td>
                          <td>
                            <div className="badge badge-outline">
                              {c.case_cause}
                            </div>
                          </td>
                          <td>
                            {c.plaintiff} / {c.defendant}
                          </td>
                          <td>{new Date(c.updated_at).toLocaleString()}</td>
                          <td>
                            <Link
                              to={`/admin/judgement/${encodeURIComponent(
                                c.case_number
                              )}`}
                              className="btn btn-xs btn-ghost"
                            >
                              查看详情
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center h-24">
                          未找到匹配的案件
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
