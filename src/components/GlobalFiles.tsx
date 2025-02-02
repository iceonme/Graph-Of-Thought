
import React, { useState } from 'react';
import { Node } from 'reactflow';

interface GlobalFilesProps {
  files: Node[];
  onFileUpload: (file: File) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'text/plain',
  'text/markdown',
  'application/pdf',
  'application/json',
  'image/png',
  'image/jpeg'
];

function GlobalFiles({ files, onFileUpload }: GlobalFilesProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      setError('文件大小不能超过10MB');
      return false;
    }
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('不支持该文件格式');
      return false;
    }
    
    return true;
  };

  const handleFiles = (files: File[]) => {
    setError(null);
    files.forEach(file => {
      if (validateFile(file)) {
        onFileUpload(file);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  return (
    <div className="w-full bg-white shadow-md rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">全局文件</h2>
        <label className="cursor-pointer">
          <input
            type="file"
            className="hidden"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              handleFiles(files);
            }}
            accept={ALLOWED_TYPES.join(',')}
          />
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            上传文件
          </span>
        </label>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-600 rounded">
          {error}
        </div>
      )}

      <div 
        className={`border-2 border-dashed rounded-lg p-4 mb-4 transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center text-gray-500">
          拖拽文件到此处上传
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {files.map(file => (
          <div
            key={file.id}
            className="flex-shrink-0 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">{file.data.fileInfo.name}</span>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              {(file.data.fileInfo.size / 1024).toFixed(1)} KB
            </div>
            <div className="flex justify-end gap-2">
              <button 
            onClick={() => {
              const content = file.data.fileInfo.content;
              if (file.data.fileInfo.type.startsWith('text/')) {
                alert(content);
              } else if (file.data.fileInfo.type.startsWith('image/')) {
                window.open(content, '_blank');
              }
            }}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
          >
            预览
          </button>
              <button className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GlobalFiles;
