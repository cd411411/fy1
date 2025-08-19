// src/components/MaskableCode.tsx (新文件)

import React, { useState } from 'react';
import { Eye, EyeOff, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  code: string;
}

export const MaskableCode: React.FC<Props> = ({ code }) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止事件冒泡
    navigator.clipboard.writeText(code);
    toast.success('验证码已复制！');
  };

  return (
    <div className="flex items-center gap-2 font-mono text-sm p-2 bg-base-200 rounded-md">
      <span className="flex-grow">{isVisible ? code : '********'}</span>
      <button 
        className="btn btn-xs btn-ghost btn-circle" 
        onClick={() => setIsVisible(!isVisible)}
        title={isVisible ? '隐藏' : '显示'}
      >
        {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      <button 
        className="btn btn-xs btn-ghost btn-circle" 
        onClick={handleCopy}
        title="复制"
      >
        <Copy size={14} />
      </button>
    </div>
  );
};