// src/api/aiApi.ts
import { isAxiosError } from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AIQueryRequest {
  history: ChatMessage[];
  model?: string;
  temperature?: number;
}

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
    const response = await fetch(`${API_BASE_URL}/api/ai/chat-stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

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

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

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
            
            if (data.done) {
              safeOnDone();
              return;
            }
            
            if (data.error) {
              onError(data.error);
              safeOnDone();
              return;
            }
            
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