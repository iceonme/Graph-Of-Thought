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
        console.log('API Error details:', error); // 添加详细日志
        throw new Error(error.error?.message || error.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
}

export const api = APIService.getInstance();