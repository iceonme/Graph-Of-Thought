
import { ChatCompletionRequestMessage } from 'openai';

export type ChatMessage = ChatCompletionRequestMessage;

export interface LLMConfig {
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export const OPENAI_MODELS = [
  'gpt-4',
  'gpt-4-32k',
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k',
];

export const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: OPENAI_MODELS
  }
];
