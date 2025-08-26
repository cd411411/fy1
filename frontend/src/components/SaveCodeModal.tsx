// src/components/SaveCodeModal.tsx

import React from 'react';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  verificationCode: string;
}

export const SaveCodeModal: React.FC<Props> = ({ isOpen, onClose, verificationCode }) => {

  const handleCopy = () => {
    navigator.clipboard.writeText(verificationCode);
    toast.success('验证码已复制到剪贴板！');
  };

  if (!isOpen) return null;

  return (
    <dialog open className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg text-success">文书已生成并开始下载！</h3>
        <div className="py-4 space-y-2">
          <p className="text-base">请<strong>务必</strong>保存好下面的专属验证码，这是您后续查询或修改文书的<strong>唯一凭证</strong>。</p>
          <div
            className="my-4 p-4 bg-base-200 rounded-lg text-center cursor-pointer hover:bg-base-300 transition-colors"
            onClick={handleCopy}
            title="点击复制"
          >
            <p className="text-sm">您的案件验证码（点击可以复制）：</p>
            <p className="font-mono text-2xl font-bold tracking-widest text-primary">{verificationCode}</p>
          </div>
        </div>
        <div className="modal-action justify-center">
          <button className="btn btn-primary text-white" onClick={onClose}>我已保存，返回主页</button>
        </div>
      </div>
      <div className="modal-backdrop bg-opacity-30 backdrop-blur-sm"></div>
    </dialog>
  );
};