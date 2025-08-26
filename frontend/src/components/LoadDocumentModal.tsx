// src/components/LoadDocumentModal.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { loadDocumentForEditing } from '../api/documentApi';
import { findTemplatePathByCause } from '../api/templateApi';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const LoadDocumentModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [caseNumber, setCaseNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!caseNumber.trim() || !verificationCode.trim()) {
            toast.error('请输入案号和验证码');
            return;
        }
        setIsLoading(true);
        try {
            // (修改) API 调用简化
            const { formData, doc_type, case_cause } = await loadDocumentForEditing({
                case_number: caseNumber,
                verification_code: verificationCode,
            });

            const formPath = await findTemplatePathByCause(doc_type, case_cause);

            toast.success('文书加载成功！即将跳转至编辑页面...');
            onClose();

            navigate(formPath, { state: { loadedFormData: formData } });

        } catch (error) {
            console.error("加载或跳转失败:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <dialog open className="modal modal-open">
            <div className="modal-box w-11/12 max-w-md">
                {/* 头部 */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-base-content">
                            以案号及验证码填写
                        </h3>
                        <p className="py-2 text-sm text-base-content/70">请输入您收到的案号和专属验证码以继续编辑。</p>
                    </div>
                    <button
                        type="button"
                        className="btn btn-sm btn-circle btn-ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        aria-label="关闭"
                    >
                        ✕
                    </button>
                </div>

                {/* 表单 */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 案号输入 */}
                    <div className="form-control w-full">
                        <label className="input">
                            <span className="label">案号</span>
                            <input
                                type="text"
                                value={caseNumber}
                                onChange={e => setCaseNumber(e.target.value)}
                                className="text"
                                placeholder="例如：（2025）粤0106民初12345678号"
                                disabled={isLoading}
                                required
                            />
                        </label>
                    </div>

                    {/* 验证码输入 */}
                    <div className="form-control w-full">
                        <fieldset className="fieldset">
                            <label className="input">
                                <span className="label">验证码</span>

                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={e => setVerificationCode(e.target.value)}
                                    className="text"
                                    placeholder="8位大小写字母+数字"
                                    maxLength={8}
                                    disabled={isLoading}
                                    required
                                />
                            </label>
                            <p className="label">
                                请输入保存时生成的8位验证码
                            </p>
                        </fieldset>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            className="btn btn-ghost flex-1"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary flex-1"
                            disabled={isLoading}
                        >
                            {isLoading && (
                                <span className="loading loading-spinner loading-sm"></span>
                            )}
                            {isLoading ? '加载中...' : '加载并编辑'}
                        </button>
                    </div>
                </form>
            </div>

            {/* 背景遮罩 */}
            <form method="dialog" className="modal-backdrop">
                <button type="button" onClick={onClose} disabled={isLoading}>
                    关闭
                </button>
            </form>
        </dialog>
    );
};