import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  title: string;
  onAutoFill?: () => void;
  instructions?: string;
}

interface InstructionsProps {
  content?: string;
}

const Instructions: React.FC<InstructionsProps> = ({ content }) => {
  // 默认说明内容
  const defaultContent = (
    <div className="prose prose-sm max-w-none">
      <p>为了方便您更好地参加诉讼，保护您的合法权利，请填写本表。</p>
      <ol>
        <li>起诉时需向人民法院提交证明您身份的材料，如身份证复印件、营业执照复印件等。</li>
        <li>本表所列内容是您参加诉讼以及人民法院查明案件事实所需，请务必如实填写。</li>
        <li>本表有些内容可能与您的案件无关，您认为与案件无关的项目可以填"无"或不填；对于本表中勾选项可以在对应项打"√"；您认为另有重要内容需要列明的，可以另附页填写。</li>
        <li>本表word 电子版填写时, 相关栏目可复制粘贴或扩容, 但不得改变要素内容、格式设置。例如, 多原告、多被告或多委托诉讼代理人等情况, 可根据实际情况复制粘贴; 需填写文字较多时，可根据实际对栏目进行扩容等。</li>
      </ol>
      <div className="alert alert-warning shadow-md mt-4 text-warning-content">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <div>
          <h3 className="font-bold">★ 特别提示 ★</h3>
          <div className="text-xs">诉讼参加人应遵守诚信原则如实认真填写表格。如果诉讼参加人违反有关规定，虚假诉讼、恶意诉讼、滥用诉权，人民法院将视违法情形依法追究责任。</div>
        </div>
      </div>
    </div>
  );

  // 根据传入内容决定显示什么
  const displayContent = content ? (
    <div className="prose prose-sm max-w-none">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  ) : defaultContent;

  return displayContent;
};

export const FormHeader: React.FC<Props> = ({ title, onAutoFill, instructions }) => {
  const navigate = useNavigate();
  // 默认展开说明，让用户第一时间看到
  const [showInstructions, setShowInstructions] = useState(true);

  return (
    <div className=" rounded-xl shadow-lg border  p-6 md:p-8">
      {/* 1. 顶部操作行 */}
      <div className="flex justify-between items-center">
        <button type="button" onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          返回
        </button>
        {onAutoFill && (
          <button type="button" onClick={onAutoFill} className="btn btn-sm btn-accent  text-white">
            AI 自动填写
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowInstructions(!showInstructions)}
          className="btn btn-ghost btn-sm text-info"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${showInstructions ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          {showInstructions ? '隐藏说明' : '查看说明'}
        </button>
      </div>

      {/* 2. 标题 */}
      <div className="text-center mt-4">
        <h1 className="text-2xl md:text-3xl font-bold ">
          {title}
        </h1>
      </div>

      {/* 3. 分割线和可折叠说明区 */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showInstructions ? 'max-h-screen mt-6 pt-6 border-t' : 'max-h-0'}`}>
        {showInstructions && (
          <div className="animate-fade-in">
            <Instructions content={instructions} />
          </div>
        )}
      </div>
    </div>
  );
};