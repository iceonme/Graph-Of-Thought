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

        let result = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              if (jsonStr === '[DONE]') continue;
              
              try {
                const json = JSON.parse(jsonStr);
                const content = json.choices[0]?.delta?.content;
                if (content) result += content;
              } catch (e) {
                console.error('解析响应数据出错:', e);
              }
            }
          }
        }
        
        return result;
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