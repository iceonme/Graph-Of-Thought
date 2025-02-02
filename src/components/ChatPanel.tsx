import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Node } from 'reactflow';
import MarkdownPreview from '@uiw/react-markdown-preview';
import FloatingToolbar from './FloatingToolbar';
import QuestionDialog from './QuestionDialog';
import { useLLM } from '../hooks/useLLM';

interface ChatPanelProps {
  node: Node | null;
  isCreatingEmpty: boolean;
  inputNodes: Node[];
  onAskFollowUp?: (parentNode: Node, question: string, selectedText: string) => void;
  onInitialQuestion?: (question: string) => void;
  onFileUpload?: (file: File) => void;
  onUpdateNodeLLM?: (nodeId: string, providerId: string, model: string) => void;
  onNodeSelect?: (node: Node) => void;
}

function ChatPanel({ 
  node, 
  isCreatingEmpty, 
  inputNodes, 
  onAskFollowUp, 
  onInitialQuestion,
  onFileUpload,
  onUpdateNodeLLM
}: ChatPanelProps) {
  const [selectedText, setSelectedText] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleModelChange } = useLLM();

  const handleTextSelection = useCallback((e: MouseEvent) => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setSelectedText(selection.toString());
      setMousePos({ x: e.pageX, y: e.pageY });
    } else if (!showQuestionDialog) {
      setSelectedText('');
    }
  }, [showQuestionDialog]);

  const handleAskFollowUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setSelectedText(selection.toString());
    }
    setShowQuestionDialog(true);
  };

  const handleQuestionSubmit = async (question: string) => {
    try {
      if (node && onAskFollowUp) {
        await onAskFollowUp(node, question, selectedText);
      }
      setShowQuestionDialog(false);
      setSelectedText('');
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error('Error submitting follow-up question:', error);
    }
  };

  const handleQuestionDialogClose = () => {
    setShowQuestionDialog(false);
    setSelectedText('');
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 0);
  };

  const contentRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: WheelEvent) => {
    if (!contentRef.current || !node) return;
    
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 1;
    const isAtTop = scrollTop === 0;

    // Only handle navigation when content is at extremes
    if ((isAtBottom && e.deltaY > 0) || (isAtTop && e.deltaY < 0)) {
      e.preventDefault();
      const nodes = inputNodes.concat(node);
      const currentIndex = nodes.findIndex(n => n.id === node.id);
      
      if (e.deltaY > 0 && currentIndex < nodes.length - 1) {
        // Navigate to next node
        onNodeSelect?.(nodes[currentIndex + 1]);
      } else if (e.deltaY < 0 && currentIndex > 0) {
        // Navigate to previous node
        onNodeSelect?.(nodes[currentIndex - 1]);
      }
    }
  };

  useEffect(() => {
    const content = contentRef.current;
    if (content) {
      content.addEventListener('wheel', handleWheel, { passive: false });
      return () => content.removeEventListener('wheel', handleWheel);
    }
  }, [node, inputNodes]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    try {
      if (node && !isCreatingEmpty && onAskFollowUp) {
        onAskFollowUp(node, chatInput, '继续对话');
      } else if (onInitialQuestion) {
        onInitialQuestion(chatInput);
      }

      setChatInput('');
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error('Error submitting chat:', error);
      // TODO: Add error handling UI
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (onFileUpload) {
        onFileUpload(file);
      }
    });
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (onFileUpload) {
        onFileUpload(file);
      }
    });
  };

  React.useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
    };
  }, [handleTextSelection]);

  const t = (key: string) => {
    // Placeholder for translation function - replace with actual implementation
    switch (key) {
      case 'welcome': return '欢迎使用 AI 对话';
      case 'startChat': return '开始你的第一个问题，创建对话流程图。后续可以通过选中文本进行追问，或继续对话来扩展你的思维导图。';
      default: return key;
    }
  };

  return (
    <>
      <div className="w-full h-full bg-white rounded-lg shadow-lg flex flex-col">
        {!node ? (
          <div className="flex-1 p-6 flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <h1 className="text-2xl font-bold text-gray-900">{t('welcome')}</h1>
              <p className="text-gray-500 text-center max-w-md">
                {t('startChat')}
              </p>
              <div className="mt-4 w-full max-w-md">
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50">
              <form onSubmit={handleChatSubmit} className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleFileUploadClick}
                >
                  <div className="flex flex-col items-center gap-2 cursor-pointer">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-gray-500">点击或拖拽文件到此处上传</span>
                    <span className="text-xs text-gray-400">支持多个文件同时上传</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="输入你的第一个问题..."
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    发送
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">{node?.data.label}</h2>
              </div>
              {inputNodes.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">参考输入：</h3>
                  <div className="flex flex-wrap gap-2">
                    {inputNodes.map((inputNode) => (
                      <div
                        key={inputNode.id}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                      >
                        {inputNode.data.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div ref={contentRef} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {isCreatingEmpty ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <p className="text-gray-500 text-center max-w-md">
                      这是一个空白卡片，你可以通过连线来关联其他对话作为输入，然后在下方输入你的问题。
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">问题</h3>
                      <div className="prose prose-sm max-w-none">
                        {node?.data.content || ''}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">回答</h3>
                      <div className="prose prose-sm max-w-none markdown-body">
                        <div className={`${node?.data.error ? 'text-red-600' : 'text-gray-700'}`}>
                          <MarkdownPreview source={node?.data.response || ''} />
                          {node?.data.error && (
                            <div className="mt-4">
                              <button
                                onClick={() => handleChatSubmit({preventDefault: () => {}} as React.FormEvent)}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                重试
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50">
              <form onSubmit={handleChatSubmit} className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleFileUploadClick}
                >
                  <div className="flex flex-col items-center gap-2 cursor-pointer">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-gray-500">点击或拖拽文件到此处上传</span>
                    <span className="text-xs text-gray-400">支持多个文件同时上传</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={isCreatingEmpty ? "输入新问题..." : "继续对话..."}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    发送
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      {(selectedText && !showQuestionDialog) && (
        <FloatingToolbar
          x={mousePos.x}
          y={mousePos.y}
          selectedText={selectedText}
          onAskFollowUp={handleAskFollowUp}
        />
      )}

      <QuestionDialog
        isOpen={showQuestionDialog}
        onClose={handleQuestionDialogClose}
        onSubmit={handleQuestionSubmit}
        selectedText={selectedText}
      />
    </>
  );
}

export default ChatPanel;