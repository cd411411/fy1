// src/components/AutoFillModal.tsx

import React, { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { autofillFromSource } from '../api/documentApi';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: any) => void;
    formId: string;
    fixedValues?: { [key: string]: any };
}

export const AutoFillModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, formId, fixedValues }) => {
    const [text, setText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setText('');
            toast.success(`已选择文件: ${acceptedFiles[0].name}`);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'image/*': ['.jpeg', '.jpg', '.png'],
            'text/plain': ['.txt'],
        },
        multiple: false,
    });

    const handleAnalyze = () => {
        if (!text.trim() && !file) {
            toast.error("请输入案情描述或上传一个文件！");
            return;
        }

        onClose(); // 立即关闭模态框，让用户可以继续操作页面

        // 1. 显示一个表示“正在进行中”的持久性toast通知
        const toastId = toast.loading('AI正在分析您的文档，请稍候...');

        // 2. 将API调用变成一个在后台执行的异步任务
        autofillFromSource({
            formId: formId,
            textContent: text.trim(),
            file: file,
        })
            .then(extractedData => {
                // --- 成功逻辑 ---

                // a. 数据修正 (与之前相同)
                let finalData = extractedData;
                if (fixedValues) {
                    if (fixedValues.basicInfo && extractedData.basicInfo) {
                        finalData.basicInfo = { ...extractedData.basicInfo, ...fixedValues.basicInfo };
                    } else if (fixedValues.basicInfo) {
                        finalData.basicInfo = fixedValues.basicInfo;
                    }
                }

                // b. 更新toast为“成功”状态，并提供“应用填充”按钮
                toast.success(
                    (t) => (
                        <div className="flex flex-col gap-2 max-w-sm">
                            <span className="font-semibold">AI分析完成！</span>
                            <p className="text-xs">是否将提取的内容应用到当前表单？</p>
                            <div className="flex gap-2 mt-2 self-end">
                                <button
                                    className="btn btn-xs btn-primary"
                                    onClick={() => {
                                        onSuccess(finalData); // 点击按钮时才调用 onSuccess
                                        toast.dismiss(t.id);
                                    }}
                                >
                                    应用填充
                                </button>
                                <button
                                    className="btn btn-xs btn-ghost"
                                    onClick={() => toast.dismiss(t.id)}
                                >
                                    忽略
                                </button>
                            </div>
                        </div>
                    ),
                    { id: toastId, duration: 60000 } // 让成功通知停留更长时间，等待用户操作
                );

            })
            .catch(error => {
                // --- 失败逻辑 ---
                // 更新toast为“失败”状态
                const errorMessage = error instanceof Error ? error.message : "分析失败";
                toast.error(`分析失败: ${errorMessage}`, { id: toastId });
            });
    };

    React.useEffect(() => {
        if (isOpen) {
            setText('');
            setFile(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <dialog open className="modal modal-open">
            <div className="modal-box w-11/12 max-w-3xl">
                <h3 className="font-bold text-lg">AI 智能填表</h3>
                <p className="py-2 text-sm text-base-content/70">请<strong>粘贴案情描述</strong>或<strong>上传相关文档</strong> (起诉状、合同等)，AI将尝试为您自动填写表单。</p>

                <div
                    {...getRootProps()}
                    className={`mt-4 p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary'}`}
                >
                    <input {...getInputProps()} />
                    {file ? (
                        <div className="text-success font-semibold">
                            <p>已选择文件：{file.name}</p>
                            <button
                                className="btn btn-xs btn-ghost text-error mt-2"
                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                            >
                                清除文件
                            </button>
                        </div>
                    ) : isDragActive ? (
                        <p>松开即可上传文件</p>
                    ) : (
                        <p>将文件拖拽到此处，或点击选择文件<br /><small>(支持PDF, DOCX, JPG, PNG, TXT)</small></p>
                    )}
                </div>

                <div className="divider">或</div>

                <textarea
                    className="textarea textarea-bordered w-full h-40"
                    placeholder="在此处粘贴文本..."
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        if (e.target.value.trim()) setFile(null);
                    }}
                />

                <div className="modal-action">
                    <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleAnalyze}
                    >
                        开始后台分析
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop"><button type="button" onClick={onClose}>close</button></form>
        </dialog>
    );
};