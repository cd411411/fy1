// src/api/aiApi.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ==================== 类型定义 ====================
/**
 * 聊天消息接口
 */
export interface ChatMessage {
  /**
   * 消息角色，可以是系统、用户或助手
   */
  role: "system" | "user" | "assistant";
  
  /**
   * 消息内容
   */
  content: string;
}

/**
 * AI查询请求接口
 */
interface AIQueryRequest {
  /**
   * 聊天历史记录
   */
  history: ChatMessage[];
  
  /**
   * 模型名称（可选）
   */
  model?: string;
  
  /**
   * 温度参数，控制生成内容的随机性（可选）
   */
  temperature?: number;
}

// ==================== AI流式聊天接口 ====================
/**
 * 获取AI流式响应
 * @param history 聊天历史记录
 * @param onChunk 接收数据块的回调函数
 * @param onDone 完成时的回调函数
 * @param onError 错误处理的回调函数
 */
export const fetchAIStream = async (
  history: ChatMessage[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (errorMessage: string) => void
) => {
  const requestBody: AIQueryRequest = { history };

  let isDone = false;
  const safeOnDone = () => {
    if (!isDone) {
      isDone = true;
      onDone();
    }
  };

  try {
    // 发起AI流式聊天请求
    const response = await fetch(`${API_BASE_URL}/api/ai/chat-stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    // 处理错误响应
    if (!response.ok || !response.body) {
      try {
        const errorData = await response.json();
        // FastAPI 的 HTTPValidationException 会把错误放在 detail 字段
        throw new Error(errorData.detail || `HTTP 错误! 状态码: ${response.status}`);
      } catch (e) {
        // 如果响应体不是JSON，或者解析失败
        throw new Error(`HTTP 错误! 状态码: ${response.status}`);
      }
    }

    // 创建读取器和解码器
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    // 读取流式响应
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      // 解码新的数据块
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // 查找完整的SSE事件（以\n\n结尾）
      let eventEndIndex;
      while ((eventEndIndex = buffer.indexOf('\n\n')) !== -1) {
        const eventData = buffer.slice(0, eventEndIndex);
        buffer = buffer.slice(eventEndIndex + 2);

        // 处理事件数据
        if (eventData.startsWith('data: ')) {
          const jsonString = eventData.slice(6); // 去掉 "data: " 前缀
          
          try {
            const data = JSON.parse(jsonString);
            
            // 处理完成信号
            if (data.done) {
              safeOnDone();
              return;
            }
            
            // 处理错误
            if (data.error) {
              onError(data.error);
              safeOnDone();
              return;
            }
            
            // 处理内容数据
            if (data.content && typeof data.content === 'string') {
              // 确保内容不为空且有意义
              if (data.content.trim()) {
                onChunk(data.content);
              }
            }
          } catch (parseError) {
            console.warn('Failed to parse SSE data:', jsonString, parseError);
            // 继续处理其他事件，不因单个解析错误而中断
          }
        }
      }
    }
    
  } catch (error) {
    // 统一的错误处理
    let errorMessage = "无法连接到AI服务。";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    onError(errorMessage);
  } finally {
    safeOnDone();
  }
};

interface RAGQueryRequest {
  history: ChatMessage[];
  case_cause?: string;
}

/**
 * 获取RAG流式响应
 * @param history 聊天历史记录
 * @param caseCause 案件类型（可选）
 * @param onChunk 接收数据块的回调函数
 * @param onDone 完成时的回调函数
 * @param onError 错误处理的回调函数
 */
export const fetchRAGStream = async (
  history: ChatMessage[],
  caseCause: string | undefined,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (errorMessage: string) => void
) => {
  const requestBody: RAGQueryRequest = { history, case_cause: caseCause };

  let isDone = false;
  const safeOnDone = () => {
    if (!isDone) {
      isDone = true;
      onDone();
    }
  };

  try {
    // 发起RAG流式聊天请求
    const response = await fetch(`${API_BASE_URL}/api/chat/rag-stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    // 处理错误响应
    if (!response.ok || !response.body) {
      try {
        const errorData = await response.json();
        // FastAPI 的 HTTPValidationException 会把错误放在 detail 字段
        throw new Error(errorData.detail || `HTTP 错误! 状态码: ${response.status}`);
      } catch (e) {
        // 如果响应体不是JSON，或者解析失败
        throw new Error(`HTTP 错误! 状态码: ${response.status}`);
      }
    }

    // 创建读取器和解码器
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    // 读取流式响应
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      // 解码新的数据块
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // 查找完整的SSE事件（以\n\n结尾）
      let eventEndIndex;
      while ((eventEndIndex = buffer.indexOf('\n\n')) !== -1) {
        const eventData = buffer.slice(0, eventEndIndex);
        buffer = buffer.slice(eventEndIndex + 2);

        // 处理事件数据
        if (eventData.startsWith('data: ')) {
          const jsonString = eventData.slice(6); // 去掉 "data: " 前缀
          
          try {
            const data = JSON.parse(jsonString);
            
            // 处理完成信号
            if (data.done) {
              safeOnDone();
              return;
            }
            
            // 处理错误
            if (data.error) {
              onError(data.error);
              safeOnDone();
              return;
            }
            
            // 处理内容数据
            if (data.content && typeof data.content === 'string') {
              // 确保内容不为空且有意义
              if (data.content.trim()) {
                onChunk(data.content);
              }
            }
          } catch (parseError) {
            console.warn('Failed to parse SSE data:', jsonString, parseError);
            // 继续处理其他事件，不因单个解析错误而中断
          }
        }
      }
    }
    
  } catch (error) {
    // 统一的错误处理
    let errorMessage = "无法连接到AI服务。";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    onError(errorMessage);
  } finally {
    safeOnDone();
  }
};
