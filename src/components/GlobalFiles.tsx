import React from 'react';
import { Node } from 'reactflow';

interface GlobalFilesProps {
  files: Node[];
  onFileUpload: (file: File) => void;
}

function GlobalFiles({ files, onFileUpload }: GlobalFilesProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(file => onFileUpload(file));
  };

  return (
    <div 
      className="w-full bg-white shadow-md rounded-lg p-4 mb-4"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">全局文件</h2>
        <label className="cursor-pointer">
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files[0]) {
                onFileUpload(files[0]);
              }
            }}
          />
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            上传文件
          </span>
        </label>
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
            <div className="flex justify-end gap-2">
              <button className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                预览
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GlobalFiles;