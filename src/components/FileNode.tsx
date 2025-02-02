import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';

interface FileNodeProps {
  data: { 
    label: string;
    fileInfo: {
      name: string;
      size: number;
      type: string;
      uploadTime: Date;
    };
    onDelete?: () => void;
  };
  selected?: boolean;
}

function FileNode({ data, selected }: FileNodeProps) {
  const [showDeleteButton, setShowDeleteButton] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div 
      className="relative bg-white rounded-xl shadow-lg border border-gray-100 w-[300px] transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
      onMouseEnter={() => setShowDeleteButton(true)}
      onMouseLeave={() => setShowDeleteButton(false)}
    >
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ bottom: -6 }}
      />
      
      {(showDeleteButton || selected) && data.onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete();
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
      
      <div className="p-4">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2 mb-3">
          <h3 className="font-bold text-gray-800 text-lg">{data.label}</h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm text-gray-600">{data.fileInfo.name}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            <span className="text-sm text-gray-600">{formatFileSize(data.fileInfo.size)}</span>
          </div>

          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-gray-600">
              {new Date(data.fileInfo.uploadTime).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-1 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100">
            预览
          </button>
          <button className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
            引用
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(FileNode);