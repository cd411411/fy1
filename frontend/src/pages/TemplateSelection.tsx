import React, { useState, useMemo } from 'react';
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
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [pinnedTemplates, setPinnedTemplates] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(`pinnedTemplates_${docType}_${category}`);
    return saved ? new Set(JSON.parse(saved)) : new Set<string>();
  });
  
  const { data: templates, isLoading, isError } = useQuery<TemplateInfo[]>({
    queryKey: ['templates', docType, category],
    // 查询函数接收一个上下文对象
    queryFn: () => {
      if (!docType || !category) {
        return Promise.resolve([]); // 如果参数不全，返回一个空的promise
      }
      return fetchTemplates(docType, category);
    },
    enabled: !!docType && !!category, // 确保参数存在时才查询
    initialData: [], // 确保 templates 变量总是一个数组，避免 map 错误
  });

  const togglePin = (templateId: string) => {
    setPinnedTemplates(prev => {
      const newPinned = new Set(prev);
      if (newPinned.has(templateId)) {
        newPinned.delete(templateId);
      } else {
        newPinned.add(templateId);
      }
      
      // 保存到localStorage
      localStorage.setItem(`pinnedTemplates_${docType}_${category}`, JSON.stringify(Array.from(newPinned)));
      return newPinned;
    });
  };

  const sortedAndFilteredTemplates = useMemo(() => {
    // 1. 先进行排序：已pin的在前，可用的在前，不可用的在后
    const sorted = [...templates].sort((a, b) => {
      const aPinned = pinnedTemplates.has(a.id);
      const bPinned = pinnedTemplates.has(b.id);
      
      // 如果一个已pin，一个未pin，则已pin的排在前面
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      
      // 如果都已pin或都未pin，则已pin的排在前面
      if (aPinned && bPinned) {
        // 都已pin，按添加顺序排序
        const aIndex = Array.from(pinnedTemplates).indexOf(a.id);
        const bIndex = Array.from(pinnedTemplates).indexOf(b.id);
        return aIndex - bIndex;
      }
      
      // 都未pin，可用的在前，不可用的在后
      return (a.disabled ? 1 : 0) - (b.disabled ? 1 : 0);
    });

    // 2. 再进行搜索过滤
    if (!searchTerm) {
      return sorted;
    }
    return sorted.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [templates, searchTerm, pinnedTemplates]);

  if (!docType || !category) {
    return <div className="p-8 text-error text-center">无效的路径或暂无模板。</div>;
  }


  const firstDisabledIndex = sortedAndFilteredTemplates.findIndex(t => t.disabled && !pinnedTemplates.has(t.id));

  const handleRecommendation = (templateId: string) => {
    setHighlightedId(templateId);
    setTimeout(() => setHighlightedId(null), 3000);
  };

  const pageTitle = `选择${categoryTitles[category] || ''}${docTypeTitles[docType] || ''}模板`;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold ">{pageTitle}</h1>
        <p className="text-lg  mt-2">请根据您的具体案由选择模板，或使用下方搜索框快速查找。</p>
      </div>
      <div className="max-w-2xl mx-auto mb-10">
        <AIRecommender templates={templates || []} onRecommendation={handleRecommendation} />
      </div>
      {/* 模板列表渲染 */}
      <div className="flex justify-center">
        {isLoading && <span className="loading loading-spinner loading-lg"></span>}
        {isError && <div className="text-error">加载模板失败...</div>}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
            {sortedAndFilteredTemplates.map((template, index) => {
              const isPinned = pinnedTemplates.has(template.id);
              return (
              <React.Fragment key={template.id}>
                {/* 如果当前索引是第一个禁用模板的索引，并且它不是列表的第一个元素，则渲染分割线 */}
                {index === firstDisabledIndex && firstDisabledIndex !== 0 && (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 my-4">
                    <div className="divider text-sm text-gray-400">即将推出</div>
                  </div>
                )}

                {/* 渲染模板卡片 */}
                <div className={`card  shadow-lg border  transition-all duration-300 ${template.disabled ? 'opacity-60' : 'hover:shadow-2xl'} ${highlightedId === template.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                  <div className="card-body p-6 text-left">
                    <div className="flex justify-between items-start">
                      <h2 className="card-title text-2xl font-bold ">{template.name}</h2>
                      <button 
                        onClick={() => togglePin(template.id)}
                        className={`btn btn-ghost btn-sm p-1 ${isPinned ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                        title={isPinned ? '取消置顶' : '置顶模板'}
                      >
                        {isPinned ? <Pin size={18} fill="currentColor" /> : <PinOff size={18} />}
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
        <div className="text-center  mt-8">
          <p>未找到与“{searchTerm}”相关的模板。</p>
        </div>
      )}
    </div>
  );
};