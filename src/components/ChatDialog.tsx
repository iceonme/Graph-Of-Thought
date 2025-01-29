import React from 'react';
import { Node } from 'reactflow';

interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node | null;
}

function ChatDialog({ isOpen, onClose, node }: ChatDialogProps) {
  if (!isOpen || !node) return null;

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      // TODO: 实现选中文本后的追问功能
      console.log('Selected text:', selection.toString());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{node.data.label}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div 
            className="bg-gray-100 p-4 rounded-lg"
            onMouseUp={handleTextSelection}
          >
            <p className="font-medium mb-2">问题：</p>
            <p>{node.data.content}</p>
          </div>
          
          <div 
            className="bg-blue-50 p-4 rounded-lg"
            onMouseUp={handleTextSelection}
          >
            <p className="font-medium mb-2">回答：</p>
            <p>{node.data.response}</p>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          提示：选中文本可以进行追问
        </div>
      </div>
    </div>
  );
}

export default ChatDialog;