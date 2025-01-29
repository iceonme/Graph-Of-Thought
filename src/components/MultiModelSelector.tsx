import React from 'react';
import { PROVIDERS } from '../types/llm';

interface MultiModelSelectorProps {
  selectedProviders: Array<{
    providerId: string;
    model: string;
  }>;
  onToggleProvider: (providerId: string) => void;
  onModelChange: (providerId: string, model: string) => void;
  className?: string;
}

export default function MultiModelSelector({
  selectedProviders,
  onToggleProvider,
  onModelChange,
  className = ''
}: MultiModelSelectorProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-sm font-medium text-gray-700 mb-2">选择 AI 模型</div>
      <div className="grid gap-3">
        {PROVIDERS.map(provider => {
          const isSelected = selectedProviders.some(p => p.providerId === provider.id);
          const selectedModel = selectedProviders.find(p => p.providerId === provider.id)?.model || provider.models[0];

          return (
            <div key={provider.id} className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleProvider(provider.id)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">{provider.name}</span>
              </label>

              {isSelected && (
                <select
                  value={selectedModel}
                  onChange={(e) => onModelChange(provider.id, e.target.value)}
                  className="px-2 py-1 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {provider.models.map(model => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </div>
      <div className="text-xs text-gray-500 mt-2">
        提示：选择多个模型将同时生成多个回答供比较
      </div>
    </div>
  );
}