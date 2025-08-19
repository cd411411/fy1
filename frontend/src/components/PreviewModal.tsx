// src/components/PreviewModal.tsx
import React, { useState, useRef } from 'react';
import type { FinalDataObject, DocxListItem, QuestionListItem } from '../interfaces/document.types';
import { adjudicateDocument } from '../api/legalApi'; 
import type { AdjudicationResult } from '../api/legalApi'; 
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmWithOptions: (options: { generateEvidence: boolean }) => void;
  isSubmitting: boolean;
  previewData: FinalDataObject | null;
  title: string;
}

// (修改) AI研判报告展示组件 - 添加ReactMarkdown支持和ref
const AIAnalysisDisplay = React.forwardRef<HTMLDivElement, { result: AdjudicationResult }>(({ result }, ref) => (
    <div ref={ref} className="mt-8 p-4 border-2 border-dashed border-info rounded-lg bg-info/5 animate-fade-in">
      <h4 className="text-xl font-bold text-info-content mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
        AI 智能研判报告
      </h4>
      <div className="space-y-5 text-sm">
        {/* 评分与反馈 */}
        <div className="card bg-base-100 shadow-sm border">
          <div className="card-body p-4">
            <div className="flex items-center gap-4">
              <div className="text-info flex items-center justify-center">
                <span className="text-base-content/80 text-xs">
                  <span className="font-bold text-lg text-base-content">{result.completeness_score}</span>
                  /10
                </span>
              </div>
              <div>
                <h5 className="font-semibold text-base-content">完整度评分</h5>
                <div className="text-base-content/80 mt-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result.completeness_feedback}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 法律风险 */}
        <div className="collapse collapse-arrow bg-base-100 shadow-sm border">
            <input type="checkbox" defaultChecked />
            <div className="collapse-title font-semibold text-base-content">潜在法律风险</div>
            <div className="collapse-content">
                <div className="space-y-2 text-base-content/90">
                  {result.legal_risk_analysis.map((item, i) => (
                    <div key={i} className="border-l-2 border-warning pl-3">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {item}
                      </ReactMarkdown>
                    </div>
                  ))}
                </div>
            </div>
        </div>
  
        {/* 语言表达 */}
        <div className="collapse collapse-arrow bg-base-100 shadow-sm border">
            <input type="checkbox" title='语言表达建议'/>
            <div className="collapse-title font-semibold text-base-content">语言表达建议</div>
            <div className="collapse-content">
                <div className="space-y-2 text-base-content/90">
                  {result.expression_suggestions.map((item, i) => (
                    <div key={i} className="border-l-2 border-success pl-3">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {item}
                      </ReactMarkdown>
                    </div>
                  ))}
                </div>
            </div>
        </div>
  
        {/* 总体评价 */}
         <div className="card bg-base-100 shadow-sm border">
          <div className="card-body p-4">
            <h5 className="font-semibold text-base-content">总体评价与核心建议</h5>
            <div className="text-base-content/80 mt-1">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {result.overall_assessment}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
));

const PreviewTableSection: React.FC<{ title: string; items?: Array<DocxListItem | QuestionListItem> }> = ({ title, items }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-6"><h3 className="text-xl font-bold mb-3 border-b-2 border-base-300 pb-2">{title}</h3><table className="table w-full table-zebra"><tbody>{items.map((item, index) => (<tr key={index} className="hover"><th className="w-1/3 align-top bg-base-200/40 p-3 font-semibold">{'role' in item ? item.role : item.question}</th><td className="w-2/3 p-3 whitespace-pre-wrap">{'details' in item ? item.details : item.answers}</td></tr>))}</tbody></table></div>
  );
};

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, onConfirmWithOptions, isSubmitting, previewData, title }) => {
  const [generateEvidence, setGenerateEvidence] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AdjudicationResult | null>(null);
  
  // (新增) 用于滚动到AI研判结果的ref
  const analysisResultRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !previewData) return null;

  const handleConfirm = () => onConfirmWithOptions({ generateEvidence });
  
  const handleAIAdjudicate = async () => {
    if (!previewData) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const docType = title.includes("起诉状") ? "起诉状" : "答辩状";
      const result = await adjudicateDocument(previewData, docType);
      setAnalysisResult(result);
      toast.success('AI研判完成！');
      
      // (新增) 延迟滚动到研判结果，确保DOM已更新
      setTimeout(() => {
        analysisResultRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    } catch (error) {
       toast.error(`AI研判失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
        <div className="bg-primary text-primary-content px-6 py-4 flex items-center justify-between flex-shrink-0 -mx-6 -mt-6 mb-6">
          <h2 className="text-xl font-bold">{title} - 内容预览</h2>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">✕</button>
        </div>
        <div className="overflow-y-auto flex-grow pr-4 -mr-4">
          <div className="space-y-8">
            <div className="border-b border-base-300 pb-4"><h3 className="text-xl font-bold mb-3">基本信息</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base"><div><span className="font-medium">案件类型：</span><span>{previewData.case_type || '未填写'}</span></div><div><span className="font-medium">案件编号：</span><span>{previewData.case_number || '未填写'}</span></div></div></div>
            <PreviewTableSection title="当事人信息" items={previewData.partyInfo} />
            <PreviewTableSection title="诉讼请求" items={previewData.claimItems} />
            <PreviewTableSection title="答辩事项" items={previewData.defenseItems} />
            <PreviewTableSection title="诉前保全" items={previewData.pretrialPreservation} />
            <PreviewTableSection title="约定管辖和诉前保全" items={previewData.jurisdictionAndPreservation} />
            <PreviewTableSection title="约定管辖、诉前保全及鉴定申请" items={previewData.jurisdictionPreservationAppraisal} />
            <PreviewTableSection title="诉前保全及鉴定申请" items={previewData.preservationAndAppraisal} />
            <PreviewTableSection title="事实与理由" items={previewData.factItems} />
            <PreviewTableSection title="关联案件信息" items={previewData.relatedCaseInfo} />
            <PreviewTableSection title="对纠纷解决方式的意愿" items={previewData.mediationInfo} />
            
            {isAnalyzing && <div className="text-center p-8"><span className="loading loading-spinner text-primary loading-lg"></span><p className="mt-2">AI正在深度研判文书...</p></div>}
            {analysisResult && <AIAnalysisDisplay ref={analysisResultRef} result={analysisResult} />}
          </div>
        </div>

        <div className="modal-action flex-shrink-0 mt-6 pt-4 border-t justify-between items-center">
          <div className="flex items-center gap-4">
            <button type="button" onClick={handleAIAdjudicate} className="btn btn-sm btn-info btn-outline" disabled={isAnalyzing || isSubmitting}>
              {isAnalyzing ? <><span className="loading loading-spinner loading-xs"></span>研判中...</> : 'AI 智能研判'}
            </button>
            <div className="form-control"><label className="label cursor-pointer gap-2"><input type="checkbox" checked={generateEvidence} onChange={(e) => setGenerateEvidence(e.target.checked)} className="checkbox checkbox-primary checkbox-sm" /><span className="label-text">同时生成AI推荐证据目录</span></label></div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn btn-ghost" disabled={isSubmitting}>返回编辑</button>
            <button type="button" onClick={handleConfirm} className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <><span className="loading loading-spinner loading-sm"></span>生成中...</> : '确认并生成文档'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};