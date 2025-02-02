
import React, { useState } from 'react';
import ReactFlow from 'reactflow';
import ChatPanel from './ChatPanel';

interface TabViewProps {
  flowContent: React.ReactNode;
  chatContent: React.ReactNode;
}

const TabView: React.FC<TabViewProps> = ({ flowContent, chatContent }) => {
  const [activeTab, setActiveTab] = useState<'flow' | 'chat'>('flow');

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex border-b">
        <button
          className={`px-4 py-2 ${
            activeTab === 'flow'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('flow')}
        >
          思维导图
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === 'chat'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('chat')}
        >
          对话
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <div
          className={`w-full h-full ${
            activeTab === 'flow' ? 'block' : 'hidden'
          }`}
        >
          {flowContent}
        </div>
        <div
          className={`w-full h-full ${
            activeTab === 'chat' ? 'block' : 'hidden'
          }`}
        >
          {chatContent}
        </div>
      </div>
    </div>
  );
};

export default TabView;
