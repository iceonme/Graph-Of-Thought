import { ChatMessage, LLMConfig } from '../types/llm';
import { api } from './api';

export class LLMService {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      return await api.chat(messages, this.config);
    } catch (error) {
      console.error('LLM Error:', error);
      throw error;
    }
  }
}