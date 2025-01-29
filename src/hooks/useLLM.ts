import { useState, useCallback } from 'react';
import { PROVIDERS } from '../types/llm';

interface SelectedProvider {
  providerId: string;
  model: string;
}

export function useLLM() {
  const [selectedProviders, setSelectedProviders] = useState<SelectedProvider[]>([
    { providerId: 'openai', model: 'gpt-3.5-turbo' }
  ]);

  const toggleProvider = useCallback((providerId: string) => {
    setSelectedProviders(prev => {
      // 检查是否已经选中
      const isSelected = prev.some(p => p.providerId === providerId);
      
      if (isSelected) {
        // 如果已选中且不是最后一个，则移除
        if (prev.length > 1) {
          return prev.filter(p => p.providerId !== providerId);
        }
        // 如果是最后一个，保持不变
        return prev;
      } else {
        // 如果未选中，则添加到数组中
        const provider = PROVIDERS.find(p => p.id === providerId);
        if (!provider) return prev;
        
        return [...prev, {
          providerId,
          model: provider.models[0]
        }];
      }
    });
  }, []);

  const handleModelChange = useCallback((providerId: string, newModel: string) => {
    setSelectedProviders(prev => 
      prev.map(p => 
        p.providerId === providerId 
          ? { ...p, model: newModel }
          : p
      )
    );
  }, []);

  return {
    selectedProviders,
    toggleProvider,
    handleModelChange,
  };
}