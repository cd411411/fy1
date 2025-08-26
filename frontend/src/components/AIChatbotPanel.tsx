import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { fetchRAGStream } from '../api/aiApi';
import type { ChatMessage } from '../api/aiApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Trash2 } from 'lucide-react';

// 修改组件props类型定义
interface AIChatbotPanelProps {
    caseType?: string;
}

const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
    return (
        // 在 prose 容器内渲染Markdown
        <div className="prose prose-sm max-w-none prose-p:my-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
            </ReactMarkdown>
        </div>
    );
};

// 修改组件定义，接收caseType参数
export const AIChatbotPanel: React.FC<AIChatbotPanelProps> = ({ caseType }) => {
    const systemPrompt = useMemo<ChatMessage>(() => {
        // 根据是否有caseType构建不同的系统提示
        const basePrompt = '你是要素式诉辩状智能生成平台的辅助AI助理，你的任务是解答用户在使用该平台中遇到的法律问题，例如：法律名词解释、填写建议、把文段优化得更符合法律用语等。除用户问你身份外，如用户提出的问题与法律或填写诉状无关，请拒绝作答，并礼貌地告知用户。';
        const caseTypePrompt = caseType ? `用户当前正在处理的案件类型是"${caseType}"，请结合该案件类型的法律知识进行回答。` : '';
        
        return {
            role: 'system',
            content: basePrompt + (caseTypePrompt ? ' ' + caseTypePrompt : '')
        };
    }, [caseType]);

    // 初始消息仅用于前端显示，不会发送到后端
    const initialMessages: ChatMessage[] = [
        { role: 'assistant', content: '您好！我是您的AI法律助手，可以为您提供填写建议或解释法律术语。' }
    ];

    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const assistantContentRef = useRef<string>('');


    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = useCallback(async () => {
        const trimmedInput = inputValue.trim();
        if (!trimmedInput || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', content: trimmedInput };
        
        // 只发送systemPrompt和用户实际发送的消息，不包括初始欢迎消息
        const historyForApi = [systemPrompt, ...messages.slice(1), newUserMessage];

        // 在显示中包括所有消息（包括初始欢迎消息）
        setMessages(prev => [...prev, newUserMessage, { role: 'assistant', content: '' }]);
        setInputValue('');
        setIsLoading(true);
        assistantContentRef.current = '';

        await fetchRAGStream( 
            historyForApi,
            caseType,
            (chunk) => {
                assistantContentRef.current += chunk;

                setMessages(prev => {
                    const updatedMessages = [...prev];
                    const lastMsgIndex = updatedMessages.length - 1;

                    if (lastMsgIndex >= 0 && updatedMessages[lastMsgIndex].role === 'assistant') {
                        updatedMessages[lastMsgIndex].content = assistantContentRef.current;
                    }

                    return updatedMessages;
                });
            },
            () => { // onDone
                setIsLoading(false);
                setTimeout(() => inputRef.current?.focus(), 100);
            },
            (errorMessage) => { // onError
                toast.error(errorMessage);
                setIsLoading(false);
                setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content === '') {
                        return prev.slice(0, -1);
                    }
                    return prev;
                });
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        );
    }, [inputValue, isLoading, systemPrompt, messages, caseType]);

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleClearChat = () => {
        if (isLoading || messages.length <= initialMessages.length) return;

        if (window.confirm("确定要清除所有聊天记录吗？")) {
            setMessages(initialMessages);
            setInputValue('');
            toast.success("聊天记录已清除");
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const hasMessagesToClear = messages.length > initialMessages.length;

    return (
        <div className="card border shadow-md h-full">
            <div className="card-body p-4 flex flex-col h-full">
                <div className="flex justify-between items-center border-b pb-2 flex-shrink-0">
                    <h2 className="card-title text-lg">AI 问答助手</h2>
                    <button
                        type="button"
                        onClick={handleClearChat}
                        className="btn btn-ghost btn-xs text-base-content/60 hover:text-error transition-colors"
                        disabled={!hasMessagesToClear || isLoading}
                        title={hasMessagesToClear ? "清除聊天记录" : "暂无记录可清除"}
                    >
                        <Trash2 size={14} /> 清除
                    </button>
                </div>

                <div className="flex-grow my-4 space-y-4 overflow-y-auto pr-2" ref={chatEndRef}>
                    {messages.map((msg, index) => (
                        <div key={index} className={`chat ${msg.role === 'user' ? 'chat-end' : 'chat-start'}`}>
                            <div className={`chat-bubble break-words ${msg.role === 'user' ? 'chat-bubble-primary text-primary-content' : 'chat-bubble-secondary text-secondary-content'
                                }`}>
                                {msg.role === 'assistant' && msg.content === '' && isLoading && (
                                    <span className="loading loading-dots loading-sm"></span>
                                )}
                                {/* (修改) 使用新的子组件进行渲染 */}
                                <MarkdownContent content={msg.content} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-auto flex gap-2 flex-shrink-0">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="在此输入您的问题..."
                        className="input input-bordered w-full"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isLoading}
                        onKeyDown={handleKeyPress}
                    />
                    <button
                        type="button"
                        onClick={handleSendMessage}
                        className="btn btn-primary"
                        disabled={isLoading || !inputValue.trim()}
                    >
                        {isLoading ? <span className="loading loading-spinner loading-xs"></span> : <Send size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
};