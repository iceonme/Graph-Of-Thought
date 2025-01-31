
import { ChatMessage, LLMConfig } from '../types/llm';

export class APIService {
  private static instance: APIService;
  private baseURL: string = 'https://api.openai.com/v1';

  private constructor() {}

  static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  async chat(messages: ChatMessage[], config: LLMConfig): Promise<string> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('API key not found');
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature: config.temperature || 0.7,
          max_tokens: config.max_tokens || 1000,
          top_p: config.top_p || 1,
          frequency_penalty: config.frequency_penalty || 0,
          presence_penalty: config.presence_penalty || 0
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `HTTP error! status: ${response.status}`);
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
