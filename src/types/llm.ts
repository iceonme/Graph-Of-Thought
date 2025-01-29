export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMConfig {
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface LLMProvider {
  id: string;
  name: string;
  models: string[];
  baseUrl: string;
}

export const PROVIDERS: LLMProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4', 'gpt-3.5-turbo'],
    baseUrl: 'https://api.openai.com/v1'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-coder'],
    baseUrl: 'https://api.deepseek.com/v1'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: ['claude-2', 'claude-instant-1'],
    baseUrl: 'https://api.anthropic.com/v1'
  }
];