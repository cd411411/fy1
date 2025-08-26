// src/pages/TemplateSelection.tsx

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTemplates } from '../api/templateApi';
import type { TemplateInfo } from '../api/templateApi';
import { AIRecommender } from '../components/AIRecommender';
import { Pin, PinOff } from 'lucide-react';

const categoryTitles: { [key: string]: string } = { civil: "民事", criminal: "刑事", administrative: "行政" };
const docTypeTitles: { [key: string]: string } = { claim: "起诉状", defense: "答辩状", application: "申请书" };

export const TemplateSelection: React.FC = () => {
  const { docType, category } = useParams<{ docType: string; category: string }>();

  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null); // (保留)
  const [pinnedTemplates, setPinnedTemplates] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(`pinnedTemplates_${docType}_${category}`);
    return saved ? new Set(JSON.parse(saved)) : new Set<string>();
  });

  const templateRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  
  const { data: templates = [], isLoading, isError } = useQuery<TemplateInfo[]>({
    queryKey: ['templates', docType, category],
    queryFn: () => {
      if (!docType || !category) return Promise.resolve([]);
      return fetchTemplates(docType, category);
    },
    enabled: !!docType && !!category,
  });

  const togglePin = (templateId: string) => {
    setPinnedTemplates(prev => {
      const newPinned = new Set(prev);
      if (newPinned.has(templateId)) {
        newPinned.delete(templateId);
      } else {
        newPinned.add(templateId);
      }
      localStorage.setItem(`pinnedTemplates_${docType}_${category}`, JSON.stringify(Array.from(newPinned)));
      return newPinned;
    });
  };

  const handlePinRecommended = (templateId: string) => {
    // 1. 更新 Pinned 状态
    setPinnedTemplates(prev => {
      const newPinned = new Set(prev);
      newPinned.add(templateId);
      localStorage.setItem(`pinnedTemplates_${docType}_${category}`, JSON.stringify(Array.from(newPinned)));
      return newPinned;
    });

    // 2. (新增) 触发高亮效果
    setHighlightedId(templateId);
    setTimeout(() => setHighlightedId(null), 3000); // 3秒后移除高亮

    // 3. 延迟执行滚动
    setTimeout(() => {
      const element = templateRefs.current.get(templateId);
      element?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 100);
  };

  const sortedAndFilteredTemplates = useMemo(() => {
    // (保留) 您的排序逻辑是完美的，无需修改
    const sorted = [...templates].sort((a, b) => {
      const aPinned = pinnedTemplates.has(a.id);
      const bPinned = pinnedTemplates.has(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      if (aPinned && bPinned) {
        const aIndex = Array.from(pinnedTemplates).indexOf(a.id);
        const bIndex = Array.from(pinnedTemplates).indexOf(b.id);
        return aIndex - bIndex;
      }
      return (a.disabled ? 1 : 0) - (b.disabled ? 1 : 0);
    });

    if (!searchTerm) return sorted;
    return sorted.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [templates, searchTerm, pinnedTemplates]);

  if (!docType || !category) {
    return <div className="p-8 text-error text-center">无效的路径或暂无模板。</div>;
  }
  
  // (保留) 您的分割线逻辑是完美的，无需修改
  const firstDisabledIndex = sortedAndFilteredTemplates.findIndex(t => t.disabled && !pinnedTemplates.has(t.id));

  const pageTitle = `选择${categoryTitles[category] || ''}${docTypeTitles[docType] || ''}模板`;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold ">{pageTitle}</h1>
        <p className="text-lg  mt-2">请根据您的具体案由选择模板，或使用下方搜索框快速查找。</p>
      </div>
      <div className="max-w-2xl mx-auto mb-10">
        {/* (修改) 确保 AIRecommender 使用正确的 prop 名称 */}
        <AIRecommender templates={templates} onPinRecommended={handlePinRecommended} />
      </div>
      
      <div className="flex justify-center">
        {isLoading && <span className="loading loading-spinner loading-lg"></span>}
        {isError && <div className="text-error">加载模板失败...</div>}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
            {/* (恢复) 您的完整渲染逻辑 */}
            {sortedAndFilteredTemplates.map((template, index) => {
              const isPinned = pinnedTemplates.has(template.id);
              return (
              <React.Fragment key={template.id}>
                {index === firstDisabledIndex && firstDisabledIndex !== 0 && (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 my-4">
                    <div className="divider text-sm text-gray-400">即将推出</div>
                  </div>
                )}

                <div 
                  ref={(node) => {
                    if (node) templateRefs.current.set(template.id, node);
                    else templateRefs.current.delete(template.id);
                  }}
                  className={`card shadow-lg border transition-all duration-300 ${template.disabled ? 'opacity-60' : 'hover:shadow-2xl'} ${highlightedId === template.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                >
                  <div className="card-body p-6 text-left">
                    <div className="flex justify-between items-start">
                      <h2 className="card-title text-2xl font-bold ">{template.name}</h2>
                      <button 
                        onClick={() => togglePin(template.id)}
                        className={`btn btn-ghost btn-sm p-1 ${isPinned ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                        title={isPinned ? '取消置顶' : '置顶模板'}
                      >
                        {isPinned ? <Pin size={18} fill="currentColor" /> : <Pin size={18} />}
                      </button>
                    </div>
                    <p className=" mt-1">{template.description}</p>
                    <div className="card-actions justify-end mt-6">
                      {template.disabled ? (
                        <button className="btn" disabled>即将推出</button>
                      ) : (
                        <Link to={template.path} className="btn btn-primary">开始填写</Link>
                      )}
                    </div>
                    {isPinned && (
                      <div className="absolute top-0 right-0 mt-2 mr-2 badge badge-primary badge-outline badge-sm">
                        已置顶
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            )})}
          </div>
        )}
      </div>

      {!isLoading && sortedAndFilteredTemplates.length === 0 && (
        <div className="text-center mt-8">
          <p>未找到与“{searchTerm}”相关的模板。</p>
        </div>
      )}
    </div>
  );
};