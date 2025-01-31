
import { ChatMessage, LLMConfig } from '../types/llm';
import { api } from './api';

export class LLMService {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async chat(messages: ChatMessage[], onStream?: (chunk: string) => void): Promise<string> {
    try {
      if (onStream) {
        return await api.chatStream(messages, this.config, onStream);
      }
      return await api.chat(messages, this.config);
    } catch (error) {
      console.error('LLM Error:', error);
      throw error;
    }
  }
}
