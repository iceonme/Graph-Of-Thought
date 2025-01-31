
import { useState } from 'react';
import { OPENAI_MODELS } from '../types/llm';

export function useLLM() {
  const [selectedModel, setSelectedModel] = useState<string>(OPENAI_MODELS[0]);

  return {
    selectedModel,
    setSelectedModel,
    models: OPENAI_MODELS
  };
}
