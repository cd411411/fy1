// src/pages/Home.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadDocumentModal } from '../components/LoadDocumentModal'; 

export const Home: React.FC = () => {
  // state 用于控制模态框的打开和关闭
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);

  return (
    <>
      <div className="hero h-full">
        <div className="hero-content text-center">
          <div className="max-w-[80vh] px-4">
            <h1 className="text-5xl font-bold mb-6 ">要素式诉辩状智能生成平台</h1>
            <p className="mb-2">高效、准确、便捷地创建各类要素式法律文书</p>
            <p className="mb-6">请选择您要创建的文书大类，或加载已有文书进行编辑。</p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-lg mx-auto">
              <Link to="/select-type/claim" className="btn btn-primary btn-soft btn-lg flex-1">填写起诉状</Link>
              <Link to="/select-type/defense" className="btn btn-primary btn-soft btn-lg flex-1">填写答辩状</Link>
              <Link to="/select-type/application" className="btn btn-primary btn-soft btn-lg flex-1">填写申请书</Link>
            </div>

            <div className="divider my-8">或</div>
            <button 
              onClick={() => setIsLoadModalOpen(true)}
              className="btn btn-outline btn-wide"
            >
              通过案号及验证码填写
            </button>

          </div>
        </div>
      </div>
      
      <LoadDocumentModal 
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
      />
    </>
  );
};