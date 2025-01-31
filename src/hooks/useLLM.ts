import { useState } from 'react';
import { OPENAI_MODELS } from '../types/llm';

export function useLLM() {
  const [selectedModel, setSelectedModel] = useState<string>('gpt-3.5-turbo');

  return {
    selectedModel,
    setSelectedModel,
    models: OPENAI_MODELS
  };
}