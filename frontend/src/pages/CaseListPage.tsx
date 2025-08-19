import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchAllCases } from "../../src/api/caseApi";
import { Search, FileText, Calendar,  Plus, X } from "lucide-react";

// --- 类型定义 ---
interface CaseItem {
  id: number;
  case_number: string;
  case_cause: string;
  plaintiff: string;
  defendant: string;
  created_at: string;
  updated_at: string;
  status: "进行中" | "已完成" | "已暂停";
  document_count: number;
}

// --- 子组件 ---
const CaseCard: React.FC<{
  caseItem: CaseItem;
  onViewDetails: (caseNumber: string) => void;
}> = ({ caseItem, onViewDetails }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "进行中": return "badge-info";
      case "已完成": return "badge-success";
      case "已暂停": return "badge-warning";
      default: return "badge-neutral";
    }
  };

  return (
    // 使用 bg-base-100/200/300 作为背景色，而不是 bg-white
    <div className="card bg-base-100 shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out">
      <div className="card-body p-6 gap-4">
        {/* 头部：案号和状态 */}
        <div className="flex justify-between items-start">
          <h3 className="card-title text-lg font-bold">
            {caseItem.case_number}
          </h3>
          <div className={`badge ${getStatusColor(caseItem.status)}`}>
            {caseItem.status}
          </div>
        </div>

        {/* 核心信息 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-base-content/70 w-12">案由:</span>
            <span className="badge badge-outline">{caseItem.case_cause}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-base-content/70 w-12">原告:</span>
            <span className="truncate">{caseItem.plaintiff}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-base-content/70 w-12">被告:</span>
            <span className="truncate">{caseItem.defendant}</span>
          </div>
        </div>
        
        {/* 底部元数据和操作 */}
        <div className="card-actions justify-between items-center mt-2 pt-4 border-t border-base-200/50">
            <div className="flex items-center gap-4 text-sm text-base-content/70">
                <div className="flex items-center gap-1.5" title="创建日期">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(caseItem.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5" title="文书数量">
                    <FileText className="w-4 h-4" />
                    <span>{caseItem.document_count}</span>
                </div>
            </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onViewDetails(caseItem.case_number)}
          >
            查看详情
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 搜索与筛选组件
 * 优化点:
 * 1. 使用 `bg-base-100` 作为背景，并使用 `shadow-sm` 获得更柔和的阴影。
 * 2. Icon 颜色使用 `text-base-content/40`，更柔和且能适应主题。
 * 3. 布局使用 `gap-2`，并在小屏幕上 `flex-col`，增强响应式。
 * 4. "清除筛选" 按钮使用 `btn-ghost`，这是一种无背景、主题适应性强的按钮样式。
 */
const SearchFilters: React.FC<{
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCause: string;
  setSelectedCause: (cause: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  onClearFilters: () => void;
  hasFilters: boolean;
}> = ({
  searchTerm,
  setSearchTerm,
  selectedCause,
  setSelectedCause,
  selectedStatus,
  setSelectedStatus,
  onClearFilters,
  hasFilters,
}) => {
  // 在真实应用中，这些选项可能来自API或常量文件
  const caseCauses = ["买卖合同纠纷", "侵权责任纠纷", "离婚纠纷", "劳动争议纠纷", "物权纠纷", "知识产权纠纷", "公司纠纷", "其他"];
  const statusOptions = ["进行中", "已完成", "已暂停"];

  return (
    <div className="bg-base-200/50 p-4 rounded-lg mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-center">
        {/* 搜索框 */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40 pointer-events-none" />
          <input
            type="text"
            placeholder="搜索案号、当事人..."
            className="input input-bordered w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* 案由筛选 */}
        <select className="select select-bordered w-full" value={selectedCause} onChange={(e) => setSelectedCause(e.target.value)}>
          <option value="">所有案由</option>
          {caseCauses.map((cause) => <option key={cause} value={cause}>{cause}</option>)}
        </select>

        {/* 状态筛选 */}
        <select className="select select-bordered w-full" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
          <option value="">所有状态</option>
          {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        
        {/* 清除筛选按钮 */}
        <button 
          className="btn btn-ghost" 
          onClick={onClearFilters} 
          disabled={!hasFilters}
        >
          <X className="w-4 h-4" />
          清除
        </button>
      </div>
    </div>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col justify-center items-center py-24 gap-4">
    <span className="loading loading-spinner loading-lg text-primary"></span>
    <span className="text-base-content/80">案件数据加载中...</span>
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-center py-24 rounded-lg bg-base-200/30">
    {/* Icon 颜色使用低透明度的 text-base-content */}
    <FileText className="w-20 h-20 text-base-content/20 mx-auto mb-6" />
    {/* 消息文本使用中等透明度 */}
    <p className="text-base-content/60 text-lg">{message}</p>
  </div>
);

// --- 主组件 ---
export const CaseListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCause, setSelectedCause] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3x3 网格，视觉效果更好

  const { data: cases = [], isLoading, error } = useQuery({
    // 将所有筛选条件作为 queryKey 的一部分，当筛选变化时自动重新获取
    queryKey: ["allCases", selectedCause],
    queryFn: () => fetchAllCases(selectedCause || undefined),
    staleTime: 5 * 60 * 1000,
  });
  
  // 在客户端进行搜索和状态过滤
  const filteredCases = cases.filter((caseItem: CaseItem) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === "" ||
      caseItem.case_number.toLowerCase().includes(searchLower) ||
      caseItem.plaintiff.toLowerCase().includes(searchLower) ||
      caseItem.defendant.toLowerCase().includes(searchLower);
    const matchesStatus = selectedStatus === "" || caseItem.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const paginatedCases = filteredCases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  const hasActiveFilters = !!searchTerm || !!selectedCause || !!selectedStatus;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCause("");
    setSelectedStatus("");
    setCurrentPage(1);
  };
  
  const handleViewDetails = (caseNumber: string) => {
    navigate(`/cases-details/${encodeURIComponent(caseNumber)}`);
  };
  
  // 错误状态
  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
        <div className="alert alert-error">
          <X className="w-6 h-6" />
          <span>加载案件列表失败: {error.message}</span>
        </div>
      </div>
    );
  }

  return (
    // 使用 p-4/6/8 实现响应式内边距
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      {/* 页面标题和操作按钮 */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          {/* 移除硬编码颜色，自动继承主题色 */}
          <h1 className="text-3xl font-bold">案件管理</h1>
          {/* 使用 text-base-content/70 作为次要文本颜色 */}
          <p className="text-base-content/70 mt-1">
            共找到 {filteredCases.length} 个相关案件
          </p>
        </div>
        <button className="btn btn-primary btn-md">
          <Plus className="w-5 h-5" />
          新建案件
        </button>
      </div>

      {/* 搜索和筛选 */}
      <SearchFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCause={selectedCause}
        setSelectedCause={setSelectedCause}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        onClearFilters={clearFilters}
        hasFilters={hasActiveFilters}
      />

      {/* 内容区域 */}
      <main>
        {isLoading ? (
          <LoadingSpinner />
        ) : paginatedCases.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {paginatedCases.map((caseItem: CaseItem) => (
                <CaseCard key={caseItem.id} caseItem={caseItem} onViewDetails={handleViewDetails}/>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center">
                <div className="join">
                  <button className="join-item btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>«</button>
                  <button className="join-item btn">Page {currentPage} of {totalPages}</button>
                  <button className="join-item btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>»</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState message={hasActiveFilters ? "没有找到符合条件的案件" : "暂无案件数据"}/>
        )}
      </main>
    </div>
  );
};

export default CaseListPage;