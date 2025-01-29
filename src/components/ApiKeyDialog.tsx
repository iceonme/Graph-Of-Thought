import React, { useState } from 'react';
import { PROVIDERS } from '../types/llm';

interface ApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiKeyDialog({ isOpen, onClose }: ApiKeyDialogProps) {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    return PROVIDERS.reduce((acc, provider) => ({
      ...acc,
      [provider.id]: localStorage.getItem(`${provider.id}_api_key`) || ''
    }), {});
  });

  const handleSave = () => {
    Object.entries(apiKeys).forEach(([providerId, apiKey]) => {
      localStorage.setItem(`${providerId}_api_key`, apiKey);
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-[500px] max-w-[90vw]">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">设置 API 密钥</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {PROVIDERS.map(provider => (
              <div key={provider.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {provider.name} API Key
                </label>
                <input
                  type="password"
                  value={apiKeys[provider.id]}
                  onChange={(e) => setApiKeys(prev => ({
                    ...prev,
                    [provider.id]: e.target.value
                  }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`输入 ${provider.name} API Key`}
                />
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}