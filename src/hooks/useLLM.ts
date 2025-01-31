
import { useState } from 'react';
import { OPENAI_MODELS } from '../types/llm';

export function useLLM() {
  const [selectedModel, setSelectedModel] = useState<string>(OPENAI_MODELS[0]);

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  return {
    selectedModel,
    handleModelChange
  };
}
