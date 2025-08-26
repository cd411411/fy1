// src/layouts/FormPageLayout.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";
import { FormHeader } from "./FormHeader";
import { FormActions } from "./FormActions";
import { AutoFillModal } from '../components/AutoFillModal';
import { PreviewModal } from '../components/PreviewModal';
import { SaveCodeModal } from '../components/SaveCodeModal';
import { generateAndDownloadDocx, generateEvidenceChecklistDocx } from '../api/documentApi';
import { useLocation, useNavigate } from 'react-router-dom';

interface Props {
  title: string;
  formId: string;
  onSubmit?: SubmitHandler<any>;
  docType: "起诉状" | "答辩状" | "申请书";
  children: React.ReactNode;
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  onPreviewData?: (data: any) => any;
  fixedFormValues?: { [key: string]: any };
  instructions? : string;
}

export const FormPageLayout: React.FC<Props> = ({
  title,
  formId,
  children,
  leftPanel,
  docType,
  rightPanel,
  onPreviewData,
  fixedFormValues,
  instructions
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [isAutoFillModalOpen, setIsAutoFillModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showSaveCodeModal, setShowSaveCodeModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // (新增) 获取 location 和 navigate 对象
  const location = useLocation();
  const navigate = useNavigate();
  // 从路由 state 中获取数据
  const loadedFormData = location.state?.loadedFormData;

  const methods = useForm({
    // (修改) 优先使用加载的数据进行初始化，这主要对首次渲染有效
    defaultValues: loadedFormData || fixedFormValues || {}
  });

  useEffect(() => {
    if (loadedFormData && Object.keys(loadedFormData).length > 0) {
      methods.reset(loadedFormData);
      toast.success('历史文书已成功加载到表单！');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [loadedFormData, methods, navigate, location.pathname]);

  // 检查是否存在本地草稿
  useEffect(() => {
    if (!loadedFormData) { // 仅在没有通过路由加载数据时才提示本地草稿
      const draft = localStorage.getItem(formId);
      if (draft) {
        setHasDraft(true);
        toast.success("检测到一份本地草稿，您可以选择载入。");
      }
    }
  }, [formId, loadedFormData]);

  const handleCloseSaveCodeModalAndRedirect = () => {
    setShowSaveCodeModal(false); // 关闭模态框
    navigate('/'); // 跳转到主页
  };

  const handleSaveDraft = () => {
    localStorage.setItem(formId, JSON.stringify(methods.getValues()));
    toast.success("草稿已成功保存到本地！");
    setHasDraft(true);
  };

  const handleLoadDraft = () => {
    const draft = localStorage.getItem(formId);
    if (draft) {
      methods.reset(JSON.parse(draft));
      toast.success("草稿已成功载入！");
    } else {
      toast.error("未找到草稿。");
    }
  };

  const handleDeleteDraft = () => {
    if (window.confirm("您确定要永久删除这份本地草稿吗？")) {
      localStorage.removeItem(formId);
      setHasDraft(false);
      toast.success("草稿已删除。");
    }
  };

  const handleReset = () => {
    if (window.confirm("您确定要清空所有已填写的内容吗？此操作无法撤销。")) {
      methods.reset(fixedFormValues || {});
    }
  };

  const handlePreview = () => {
    const formData = methods.getValues();
    const processedData = onPreviewData ? onPreviewData(formData) : formData;
    setPreviewData(processedData);
    setIsPreviewModalOpen(true);
  };

  const handleConfirmGeneration = async (options: { generateEvidence: boolean }) => {
    const formData = methods.getValues();
    const finalData = onPreviewData ? onPreviewData(formData) : formData;
    const payload = { formData, final: finalData };
    setIsSubmitting(true);
    try {
      const { headers } = await generateAndDownloadDocx(docType, payload, title);

      // const caseNumber = headers['x-case-number'] ? decodeURIComponent(headers['x-case-number']) : null;
      const code = headers['x-verification-code'];

      if (code) {
        setVerificationCode(code);
        setShowSaveCodeModal(true);
      }

      if (options.generateEvidence) {
        const claimsText = finalData.claimItems?.map((i: any) => i.answers).join('\n') || finalData.defenseItems?.map((i: any) => i.answers).join('\n') || '';
        const factsText = finalData.factItems?.map((i: any) => i.answers).join('\n') || finalData.factsAndReasons?.map((i: any) => i.answers).join('\n') || '';
        await generateEvidenceChecklistDocx(claimsText, factsText, docType);
      }

      localStorage.removeItem(formId);
      setHasDraft(false);
      setIsPreviewModalOpen(false);
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAutoFillModal = () => setIsAutoFillModalOpen(true);

  const handleAutoFillSuccess = (data: any) => {
    methods.reset(data);
    toast.success('表单已根据文本内容自动填充！');
  };

  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  console.log(formId);
  return (
    <>
      <div className="h-full overflow-hidden">
        <FormProvider {...methods}>
          <div className="flex h-full">
            {/* 左侧面板 */}
            {leftPanel && (
              <>
                {/* 左侧面板折叠状态 */}
                {!isLeftPanelOpen && (
                  <div className="hidden lg:flex flex-col bg-base-200 border-r w-12 items-center py-4 h-full overflow-hidden">
                    <button
                      onClick={() => setIsLeftPanelOpen(true)}
                      className="btn btn-sm btn-ghost rounded-md mb-4 hover:bg-base-300"
                      title="展开左侧面板"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* 垂直文字标识 */}
                    <div className="text-xs font-medium text-base-content/70 select-none transform rotate-90 whitespace-nowrap">
                      起诉状查询
                    </div>

                    {/* 功能图标提示 */}
                    <div className="mt-auto space-y-2">
                      <div className="w-6 h-6 bg-base-300 rounded opacity-50"></div>
                      <div className="w-6 h-6 bg-base-300 rounded opacity-50"></div>
                      <div className="w-6 h-6 bg-base-300 rounded opacity-50"></div>
                    </div>
                  </div>
                )}

                {/* 左侧面板内容 */}
                {isLeftPanelOpen && (
                  <div className="w-80 flex-shrink-0 hidden lg:block h-full overflow-hidden">
                    <div className="h-full border-r bg-base-100 flex flex-col">
                      {/* 左侧面板头部 */}
                      <div className="flex items-center justify-between p-4 border-b bg-base-100 flex-shrink-0">
                        <h3 className="font-semibold text-sm">起诉状查询</h3>
                        <button
                          onClick={() => setIsLeftPanelOpen(false)}
                          className="btn btn-xs btn-ghost hover:bg-base-200"
                          title="折叠左侧面板"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* 左侧面板内容区 */}
                      <div className="flex-1 overflow-y-auto p-4">
                        {leftPanel}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 主内容区 */}
            <main className="flex-1 min-w-0 h-full overflow-hidden">
              <div className="h-full overflow-y-auto">
                <div className="container mx-auto px-4 py-8">
                  <div className="rounded-xl shadow-lg bg-base-100">
                    <FormHeader title={title} onAutoFill={handleOpenAutoFillModal} instructions={instructions} />
                    <div className="pt-6 space-y-6">
                      {children}
                    </div>
                  </div>

                  {/* 表单操作按钮 */}
                  <div className="mt-8 sticky bottom-0 left-0 right-0">
                    <div className="bg-base-100 rounded-xl shadow-lg p-4">
                      <FormActions
                        isSubmitting={isSubmitting}
                        onReset={handleReset}
                        onSaveDraft={handleSaveDraft}
                        onLoadDraft={handleLoadDraft}
                        onDeleteDraft={handleDeleteDraft}
                        hasDraft={hasDraft}
                        showReset={true}
                        onPreview={handlePreview}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </main>

            {/* 右侧面板 */}
            {rightPanel && (
              <>
                {/* 右侧面板内容 */}
                {isRightPanelOpen && (
                  <div className="w-80 flex-shrink-0 hidden xl:block h-full overflow-hidden">
                    <div className="h-full border-l bg-base-100 flex flex-col">
                      {/* 右侧面板头部 */}
                      <div className="flex items-center justify-between p-4 border-b bg-base-100 flex-shrink-0">
                        <h3 className="font-semibold text-sm">AI助理</h3>
                        <button
                          onClick={() => setIsRightPanelOpen(false)}
                          className="btn btn-xs btn-ghost hover:bg-base-200"
                          title="折叠右侧面板"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      {/* 右侧面板内容区 */}
                      <div className="flex-1 overflow-y-auto p-4">
                        {rightPanel}
                      </div>
                    </div>
                  </div>
                )}

                {/* 右侧面板折叠状态 */}
                {!isRightPanelOpen && (
                  <div className="hidden xl:flex flex-col bg-base-200 border-l w-12 items-center py-4 h-full overflow-hidden">
                    <button
                      onClick={() => setIsRightPanelOpen(true)}
                      className="btn btn-sm btn-ghost rounded-md mb-4 hover:bg-base-300"
                      title="展开右侧面板"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* 垂直文字标识 */}
                    <div className="text-xs font-medium text-base-content/70 select-none transform rotate-90 whitespace-nowrap">
                      AI助理
                    </div>

                    {/* 功能图标提示 */}
                    <div className="mt-auto space-y-2">
                      <div className="w-6 h-6 bg-base-300 rounded opacity-50"></div>
                      <div className="w-6 h-6 bg-base-300 rounded opacity-50"></div>
                      <div className="w-6 h-6 bg-base-300 rounded opacity-50"></div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </FormProvider>
      </div>
      {/* 模态框 */}
      <AutoFillModal
        isOpen={isAutoFillModalOpen}
        onClose={() => setIsAutoFillModalOpen(false)}
        onSuccess={handleAutoFillSuccess}
        formId={formId}
        fixedValues={fixedFormValues}
      />

      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        onConfirmWithOptions={handleConfirmGeneration}
        isSubmitting={isSubmitting}
        previewData={previewData}
        title={title}
      />
      <SaveCodeModal
        isOpen={showSaveCodeModal}
        onClose={handleCloseSaveCodeModalAndRedirect}
        verificationCode={verificationCode}
      />
    </>
  );
};