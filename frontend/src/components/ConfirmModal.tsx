// src/components/ConfirmModal.tsx (新文件)

import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  confirmButtonClass?: string;
  isConfirming?: boolean; // 用于在异步操作时显示加载状态
}

export const ConfirmModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = '确认',
  confirmButtonClass = 'btn-error',
  isConfirming = false,
}) => {
  if (!isOpen) return null;

  return (
    <dialog open className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{title}</h3>
        <div className="py-4">{children}</div>
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose} disabled={isConfirming}>
            取消
          </button>
          <button className={`btn ${confirmButtonClass}`} onClick={onConfirm} disabled={isConfirming}>
            {isConfirming && <span className="loading loading-spinner loading-xs"></span>}
            {confirmText}
          </button>
        </div>
      </div>
       <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};