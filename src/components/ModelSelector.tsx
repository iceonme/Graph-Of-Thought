import React from 'react';
import { PROVIDERS } from '../types/llm';

interface ModelSelectorProps {
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (providerId: string) => void;
  onModelChange: (model: string) => void;
}

export default function ModelSelector({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange
}: ModelSelectorProps) {
  const currentProvider = PROVIDERS.find(p => p.id === selectedProvider);

  return (
    <div className="flex items-center gap-3">
      <select
        value={selectedProvider}
        onChange={(e) => onProviderChange(e.target.value)}
        className="px-2 py-1 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {PROVIDERS.map(provider => (
          <option key={provider.id} value={provider.id}>
            {provider.name}
          </option>
        ))}
      </select>

      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        className="px-2 py-1 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {currentProvider?.models.map(model => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>
    </div>
  );
}