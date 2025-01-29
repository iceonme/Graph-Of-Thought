import { ChatMessage, LLMConfig, LLMProvider } from '../types/llm';

export class LLMService {
  private apiKey: string;
  private provider: LLMProvider;
  private config: LLMConfig;

  constructor(provider: LLMProvider, apiKey: string, config: LLMConfig) {
    this.provider = provider;
    this.apiKey = apiKey;
    this.config = config;
  }

  private getApiUrl(endpoint: string): string {
    // 确保 baseUrl 和 endpoint 都没有多余的斜杠
    const baseUrl = this.provider.baseUrl.replace(/\/+$/, '');
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    return `${baseUrl}/${cleanEndpoint}`;
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      const url = this.getApiUrl('chat/completions');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          messages,
          ...this.config
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling LLM service:', error);
      throw error;
    }
  }

  async streamChat(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const url = this.getApiUrl('chat/completions');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          messages,
          ...this.config,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0].delta.content;
              if (content) onChunk(content);
            } catch (e) {
              console.error('Error parsing SSE chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in stream chat:', error);
      throw error;
    }
  }
}