import { ChatMessage, LLMConfig } from '../types/llm';

export class APIService {
  private static instance: APIService;
  private baseURL: string = 'https://api.deepseek.com/v1';

  private constructor() {}

  static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  async chat(messages: ChatMessage[], config: LLMConfig): Promise<string> {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('API key not found - please set VITE_DEEPSEEK_API_KEY in Secrets');
    }

    const retryCount = 3; // 设置最大重试次数

    for (let i = 0; i < retryCount; i++) {
      try {
        const response = await fetch(`${this.baseURL}/chat/completions`, {
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
            temperature: 0.7,
            max_tokens: 2000,
            stream: false
          })
        });

        if (!response.ok) {
          const error = await response.json();
          console.log('API Error details:', error);
          if (i < retryCount - 1) {
            console.log(`Retrying... (${i + 1}/${retryCount})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // 增加重试间隔
            continue;
          }
          throw new Error(`DeepSeek API 错误 (尝试 ${retryCount} 次后失败): ${error.error?.message || error.message || `HTTP error! status: ${response.status}`}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
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
}

export const api = APIService.getInstance();