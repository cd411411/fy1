import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { recommendTemplate } from '../api/templateApi';
import type { TemplateInfo } from '../api/templateApi';
import toast from 'react-hot-toast';

interface RecommendationData {
  recommended_template_id: string;
  reason: string;
}

interface Props {
  templates: TemplateInfo[];
  onRecommendation: (templateId: string) => void;
}

export const AIRecommender: React.FC<Props> = ({ templates, onRecommendation }) => {
  const { mutate, isPending, data: recommendation, reset } = useMutation<
    RecommendationData, Error, string
  >({
    mutationFn: (description) => recommendTemplate(description, templates),
    onSuccess: (data) => {
      const recommendedTemplate = templates.find(t => t.id === data.recommended_template_id);
      toast.success(`AI推荐: ${recommendedTemplate?.name || '未知模板'}`);
      onRecommendation(data.recommended_template_id);
    },
    onError: (error) => {
      toast.error(`AI推荐失败: 网络错误，请更换网络后再试。`);
    }
  });

  const handleRecommend = (e: React.FormEvent) => {
    e.preventDefault();
    const description = (e.currentTarget.querySelector('textarea') as HTMLTextAreaElement)?.value;
    if (!description || !description.trim()) {
      toast.error('请输入您的案情简述。');
      return;
    }
    mutate(description);
  };
  
  return (
    <div className="collapse collapse-arrow border border-base-300 dark:border-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
      <input type="checkbox" className="peer" placeholder='描述案情'/> 
      <div className="collapse-title text-lg font-medium flex items-center gap-3 py-4 peer-checked:border-b border-base-300 transition-all duration-300">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
          <svg 
            className="w-4 h-4 text-primary" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-base font-semibold text-base-content">AI帮我选案由</div>
          <div className="text-sm text-base-content/70 mt-1">不确定用哪个模板？让AI帮您推荐最合适的</div>
        </div>
      </div>
      
      <div className="collapse-content px-6 pb-6 transition-all duration-300">
        <form onSubmit={handleRecommend} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-base-content/80">
              案情描述
            </label>
            <p className="text-xs text-base-content/60">
              请简单描述您的案情，AI将为您推荐最合适的模板
            </p>
          </div>
          
          <textarea
            name="description"
            className="textarea textarea-bordered w-full h-28 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            placeholder="例如：我租的房子到期了，房东不退押金，并且还扣了我的水电费..."
            disabled={isPending}
          />
          
          <div className="flex justify-end">
            <button 
              type="submit" 
              className="btn btn-primary btn-sm px-6 gap-2 hover:scale-105 transition-transform"
              disabled={isPending}
            >
              {isPending && <span className="loading loading-spinner loading-xs" />}
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              获取AI推荐
            </button>
          </div>
        </form>

        {/* 推荐结果区域 */}
        {recommendation && !isPending && (
          <div className="mt-6 p-4 border border-success/30 rounded-lg relative overflow-hidden">
            {/* 装饰性元素 */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-success/5 rounded-full -translate-y-10 translate-x-10" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-success/5 rounded-full translate-y-8 -translate-x-8" />
            
            <div className="relative">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-success" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-success">AI推荐结果</span>
                </div>
                <button 
                  className="btn btn-xs btn-ghost hover:bg-base-200 text-base-content/60 hover:text-base-content"
                  onClick={() => reset()}
                >
                  重新推荐
                </button>
              </div>
              
              <div className="space-y-2">
                <p className="text-base font-bold text-base-content">
                  【{templates.find(t=>t.id === recommendation.recommended_template_id)?.name}】
                </p>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-base-content/60 mt-0.5 flex-shrink-0">推荐理由：</span>
                  <p className="text-xs text-base-content/80 leading-relaxed">{recommendation.reason}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};