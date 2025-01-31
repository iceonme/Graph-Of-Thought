
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

export const OPENAI_MODELS = ['gpt-4', 'gpt-3.5-turbo'];

export const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: OPENAI_MODELS
  }
];
