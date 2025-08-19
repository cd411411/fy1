import React from 'react';

interface Props {
  isSubmitting: boolean;
  onReset: () => void;
  onSaveDraft: () => void;
  onLoadDraft: () => void;
  onDeleteDraft: () => void;
  hasDraft: boolean;
  showReset: boolean;
  // 新增：预览按钮的处理函数
  onPreview: () => void;
}

export const FormActions: React.FC<Props> = ({ 
  isSubmitting, 
  onReset, 
  onSaveDraft,
  onLoadDraft,
  onDeleteDraft,
  hasDraft,
  showReset,
  onPreview
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
      {/* 左侧：草稿和重置操作 */}
      <div className="flex gap-3">
        <button type="button" onClick={onSaveDraft} className="btn btn-sm btn-outline btn-info">保存草稿</button>
        {hasDraft && (
          <>
            <button type="button" onClick={onLoadDraft} className="btn btn-sm btn-outline btn-success">载入草稿</button>
            <button type="button" onClick={onDeleteDraft} className="btn btn-sm btn-ghost btn-error">删除草稿</button>
          </>
        )}
        {showReset && <button type="button" onClick={onReset} className="btn btn-sm btn-outline btn-warning">重置表单</button>}
      </div>
      
      {/* 右侧：预览按钮 */}
      <button 
        type="button" 
        onClick={onPreview}
        disabled={isSubmitting} 
        className="btn btn-primary btn-lg"
      >
        {isSubmitting && <span className="loading loading-spinner"></span>}
        {isSubmitting ? '处理中...' : '预览文档'}
      </button>
    </div>
  );
};