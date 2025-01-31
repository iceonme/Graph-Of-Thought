import { ChatMessage, LLMConfig } from '../types/llm';

export const api = {
  async chat(messages: ChatMessage[], config: LLMConfig): Promise<string> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, config }),
    });

    if (!response.ok) {
      throw new Error('Chat request failed');
    }

    const data = await response.json();
    return data.response;
  },

  async chatStream(
    messages: ChatMessage[],
    config: LLMConfig,
    onStream: (chunk: string) => void
  ): Promise<string> {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('API key not found - please set VITE_DEEPSEEK_API_KEY in Secrets');
    }
    const retryCount = 3; // 设置最大重试次数

    for (let i = 0; i < retryCount; i++) {
      try {
        const response = await fetch(`/api/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            temperature: config.temperature || 0.7,
            max_tokens: config.max_tokens || 2000,
            stream: true
          })
        });

        if (!response.ok) {
          let errorText;
          try {
            const error = await response.json();
            errorText = error.error?.message || error.message;
          } catch (e) {
            errorText = `HTTP error! status: ${response.status}`;
          }

          console.log('API Error details:', errorText);

          if (i < retryCount - 1) {
            console.log(`Retrying... (${i + 1}/${retryCount})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
            continue;
          }

          throw new Error(`DeepSeek API 错误 (尝试 ${retryCount} 次后失败): ${errorText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('无法获取响应流');
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;
          onStream(chunk);
        }

        return fullResponse;
      } catch (error) {
        if (i < retryCount - 1) {
          console.log(`Retrying... (${i + 1}/${retryCount})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }
        console.error('API Error:', error);
        throw new Error(`DeepSeek API 调用失败 (尝试 ${retryCount} 次后失败): ${error.message}`);
      }
    }
    throw new Error('达到最大重试次数，请稍后再试');
  }
};