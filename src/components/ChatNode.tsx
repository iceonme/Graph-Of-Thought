import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { PROVIDERS } from '../types/llm';
import 'github-markdown-css';

interface ChatNodeProps {
  data: { 
    label: string; 
    content: string; 
    response: string;
    llmConfig?: {
      providerId: string;
      model: string;
    };
    onDelete?: () => void;
  };
  selected?: boolean;
}

function ChatNode({ data, selected }: ChatNodeProps) {
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const provider = { id: 'openai', name: 'OpenAI' };

  return (
    <div 
      className="relative bg-white rounded-xl shadow-lg border border-gray-100 w-[300px] transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
      onMouseEnter={() => setShowDeleteButton(true)}
      onMouseLeave={() => setShowDeleteButton(false)}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ top: -6 }}
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
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2 mb-3">
          <h3 className="font-bold text-gray-800 text-lg">{data.label}</h3>
          {data.llmConfig && (
            <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
              <span>{data.llmConfig?.model}</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="font-medium text-sm text-blue-600 mb-1">问题：</p>
            <div className="text-gray-600 text-sm line-clamp-2">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                className="markdown-body text-sm prose prose-sm max-w-none"
                components={{
                  p: ({node, ...props}) => <p className="my-1" {...props} />,
                  pre: ({node, ...props}) => <pre className="bg-gray-50 rounded p-2" {...props} />,
                  code: ({node, inline, ...props}) => 
                    inline ? 
                      <code className="bg-gray-100 px-1 rounded" {...props} /> :
                      <code {...props} />
                }}
              >
                {data.content}
              </ReactMarkdown>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-3">
            <p className="font-medium text-sm text-blue-600 mb-1">回答</p>
            <div className="text-gray-600 text-sm line-clamp-2">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                className="markdown-body text-sm prose prose-sm max-w-none"
                components={{
                  p: ({node, ...props}) => <p className="my-1" {...props} />,
                  pre: ({node, ...props}) => <pre className="bg-gray-50 rounded p-2" {...props} />,
                  code: ({node, inline, ...props}) => 
                    inline ? 
                      <code className="bg-gray-100 px-1 rounded" {...props} /> :
                      <code {...props} />
                }}
              >
                {data.response}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ bottom: -6 }}
      />
    </div>
  );
}

export default memo(ChatNode);