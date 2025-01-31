import React from 'react';
import { OPENAI_MODELS } from '../types/llm';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  className?: string;
}

export default function ModelSelector({
  selectedModel,
  onModelChange,
  className = ''
}: ModelSelectorProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-sm font-medium text-gray-700 mb-2">选择模型</div>
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        className="px-2 py-1 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {OPENAI_MODELS.map(model => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>
    </div>
  );
}