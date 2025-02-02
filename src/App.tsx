import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  Connection,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import ChatNode from './components/ChatNode';
import FileNode from './components/FileNode';
import ChatPanel from './components/ChatPanel';
import NewNodeButton from './components/NewNodeButton';
import { LayoutManager } from './utils/LayoutManager';
import { useLLM } from './hooks/useLLM';
import { LLMService } from './services/llm';

const nodeTypes = {
  chatNode: ChatNode,
  fileNode: FileNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function App() {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_OPENAI_API_KEY || '');
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isCreatingEmptyNode, setIsCreatingEmptyNode] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<{
    files: File[];
    processing: boolean;
  }>({
    files: [],
    processing: false
  });
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const [error, setError] = useState<string | null>(null); // Added error state


  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [setNodes, setEdges, selectedNode]);

  const updateSelectedNode = useCallback((nodeId: string | null) => {
    setNodes((nds) => 
      nds.map((node) => ({
        ...node,
        selected: node.id === nodeId
      }))
    );
  }, [setNodes]);

  const nodesWithDelete = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onDelete: () => handleDeleteNode(node.id)
    }
  }));

  const onConnect = useCallback(
    (params: Connection) => {
      const isCreatingCycle = (source: string, target: string, visited = new Set<string>()): boolean => {
        if (source === target) return true;
        if (visited.has(target)) return false;

        visited.add(target);
        const outgoingEdges = edges.filter(edge => edge.source === target);
        return outgoingEdges.some(edge => isCreatingCycle(source, edge.target, visited));
      };

      if (params.source && params.target && !isCreatingCycle(params.source, params.target)) {
        setEdges((eds) => addEdge(params, eds));
      }
    },
    [edges, setEdges],
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
    updateSelectedNode(node.id);
    setIsCreatingEmptyNode(false);
  }, [updateSelectedNode]);

  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);

    const selectionChange = changes.find(
      change => change.type === 'select' && change.selected !== undefined
    );

    if (selectionChange) {
      const nodeId = selectionChange.id;
      const isSelected = selectionChange.selected;

      if (isSelected) {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          setSelectedNode(node);
          setIsCreatingEmptyNode(false);
        }
      } else if (!nodes.some(n => n.selected)) {
        setSelectedNode(null);
      }
    }
  }, [nodes, onNodesChange]);

  const getNodeInputs = (nodeId: string): Node[] => {
    const inputEdges = edges.filter(edge => edge.target === nodeId);
    return nodes.filter(node => inputEdges.some(edge => edge.source === node.id));
  };

  const createNewNodes = useCallback(async (question: string, parentNode?: Node) => {
    const provider = {
      providerId: 'openai',
      model: selectedModel
    };

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const basePosition = LayoutManager.getNewNodePosition(nodes, parentNode, edges);

    const { providerId, model } = provider;

    const newNodeId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newNode: Node = {
      id: newNodeId,
      type: 'chatNode',
      position: basePosition,
      data: {
        label: `${parentNode ? '继续对话' : '初始问题'} (${providerId})`,
        content: question,
        response: '等待回答...',
        llmConfig: {
          providerId,
          model
        }
      },
      selected: true
    };

    if (parentNode) {
      const newEdge: Edge = {
        id: `e${parentNode.id}-${newNodeId}`,
        source: parentNode.id,
        target: newNodeId,
      };
      newEdges.push(newEdge);
    }

    newNodes.push(newNode);


    try {
      // 创建 LLMService 实例
      const llmService = new LLMService({
        model: selectedModel
      });

      // 准备对话消息
      const messages = [
        {
          role: 'user',
          content: question
        }
      ];

      // 如果有父节点，将其内容添加到上下文
      if (parentNode) {
        messages.unshift(
          {
            role: 'user',
            content: parentNode.data.content
          },
          {
            role: 'assistant',
            content: parentNode.data.response
          }
        );
      }

      // 更新节点状态为等待中
      setNodes((nds) => [...nds.map(n => ({ ...n, selected: false })), ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
      setSelectedNode(newNodes[0]);

      // 调用 API 获取回答
      const response = await llmService.chat(messages);

      let currentResponse = '';

      // 获取回答并同步更新对话页和卡片
      const result = await llmService.chat(messages, (content) => {
        currentResponse += content;

        // 先更新对话页(selectedNode)
        setSelectedNode(prev => prev && prev.id === newNodeId ? {
          ...prev,
          data: {
            ...prev.data,
            response: currentResponse
          }
        } : prev);

        // 再更新卡片
        setNodes((nds) => nds.map(node => 
          node.id === newNodeId 
            ? {
                ...node,
                data: {
                  ...node.data,
                  response: currentResponse
                }
              }
            : node
        ));
      });

      const updatedNode = {
        ...newNode,
        data: {
          ...newNode.data,
          response: result
        }
      };

      setNodes((nds) => nds.map(node => 
        node.id === newNodeId ? updatedNode : node
      ));
      setSelectedNode(updatedNode);

      setIsCreatingEmptyNode(false);
      updateSelectedNode(newNodeId);
    } catch (error) {
      console.error('Error creating node:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);

      // Update node with error state
      setNodes((nds) => nds.map(node => 
        node.id === newNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                response: '抱歉，发生了错误：' + errorMessage,
                error: true
              }
            }
          : node
      ));

      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  }, [nodes, edges, selectedModel, setNodes, setEdges, updateSelectedNode]);

  const handleStreamingResponse = async (newNodeId: string, messages: any[], newNode: Node) => {
    const llmService = new LLMService({
      model: selectedModel
    });

    let currentResponse = '';

    try {
      const result = await llmService.chat(messages, (content) => {
        currentResponse += content;

        // 更新对话页
        setSelectedNode(prev => prev && prev.id === newNodeId ? {
          ...prev,
          data: {
            ...prev.data,
            response: currentResponse
          }
        } : prev);

        // 更新卡片
        setNodes((nds) => nds.map(node => 
          node.id === newNodeId 
            ? {
                ...node,
                data: {
                  ...node.data,
                  response: currentResponse
                }
              }
            : node
        ));
      });

      return result;
    } catch (error) {
      console.error('Error in streaming response:', error);
      throw error;
    }
  };

  const handleAskFollowUp = useCallback(async (parentNode: Node, question: string, selectedText: string) => {
    try {
      const provider = {
        providerId: 'deepseek',
        model: selectedModel
      };

      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];
      const basePosition = LayoutManager.getNewNodePosition(nodes, parentNode, edges);

      const { providerId, model } = provider;

      const newNodeId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newNode: Node = {
        id: newNodeId,
        type: 'chatNode',
        position: {
          x: basePosition.x,
          y: basePosition.y
        },
        data: {
          label: `${selectedText ? `追问: ${selectedText.slice(0, 20)}...` : '进一步讨论'} (${providerId})`,
          content: question,
          response: '等待回答...',
          llmConfig: {
            providerId,
            model
          }
        },
        selected: true
      };

      const newEdge: Edge = {
        id: `e${parentNode.id}-${newNodeId}`,
        source: parentNode.id,
        target: newNodeId,
      };

      newNodes.push(newNode);
      newEdges.push(newEdge);

      setNodes((nds) => [...nds.map(n => ({ ...n, selected: false })), ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
      setSelectedNode(newNodes[0]);
      updateSelectedNode(newNodes[0].id);

      // 创建 LLM 服务实例
      const llmService = new LLMService({
        model: selectedModel
      });

      // 准备对话消息
      let messages = [];
      
      if (selectedText && selectedText !== '继续对话') {
        messages = [
          {
            role: 'user',
            content: `关于"${selectedText}"，${question}`
          }
        ];
      } else {
        messages = [
          {
            role: 'user',
            content: parentNode.data.content
          },
          {
            role: 'assistant',
            content: parentNode.data.response
          },
          {
            role: 'user',
            content: question
          }
        ];
      }

      // 使用统一的流式处理函数
      const response = await handleStreamingResponse(newNodeId, messages, newNode);

      const updatedNode = {
        ...newNode,
        data: {
          ...newNode.data,
          response
        }
      };

      setSelectedNode(updatedNode);

    } catch (error) {
      console.error('Error in follow-up:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);

      setNodes((nds) => nds.map(node => 
        node.id === newNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                response: '抱歉，发生了错误：' + errorMessage,
                error: true
              }
            }
          : node
      ));
      setTimeout(() => setError(null), 5000);
    }
  }, [nodes, edges, selectedModel, setNodes, setEdges, updateSelectedNode]);

  const handleNewEmptyNode = useCallback(() => {
    const newNodeId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newPosition = LayoutManager.getNewNodePosition(nodes);

    const newNode: Node = {
      id: newNodeId,
      type: 'chatNode',
      position: newPosition,
      data: {
        label: '空白卡片',
        content: '',
        response: ''
      },
      selected: true
    };

    setNodes((nds) => nds.map(n => ({ ...n, selected: false })).concat(newNode));
    setSelectedNode(newNode);
    setIsCreatingEmptyNode(true);
    updateSelectedNode(newNodeId);
  }, [nodes, setNodes, updateSelectedNode]);

  const handleUpdateNodeLLM = useCallback((nodeId: string, providerId: string, model: string) => {
    setNodes((nds) => 
      nds.map((node) => 
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                llmConfig: {
                  providerId,
                  model
                }
              }
            }
          : node
      )
    );
  }, [setNodes]);

  const handleFileUpload = useCallback((file: File) => {
    setUploadQueue(prev => ({
      files: [...prev.files, file],
      processing: false
    }));
  }, []);

  const processUploadQueue = useCallback(() => {
    if (uploadQueue.processing || uploadQueue.files.length === 0) return;

    setUploadQueue(prev => ({ ...prev, processing: true }));

    const timestamp = Date.now();
    const fileNodes: Node[] = [];
    const filePositions = LayoutManager.getFileNodesPositions(nodes, uploadQueue.files.length);

    uploadQueue.files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = () => {
        const uniqueId = Math.random().toString(36).substr(2, 9);
        const newFileId = `file-${timestamp}-${uniqueId}`;

        const fileNode: Node = {
          id: newFileId,
          type: 'fileNode',
          position: filePositions[index],
          data: {
            label: '文件节点',
            fileInfo: {
              name: file.name,
              size: file.size,
              type: file.type,
              uploadTime: new Date(),
              content: reader.result
            }
          }
        };

        fileNodes.push(fileNode);

        if (fileNodes.length === uploadQueue.files.length) {
          const chatNodePosition = LayoutManager.getChatNodePositionForFiles([...nodes, ...fileNodes], fileNodes);
          const chatNodeId = `chat-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

          const newChatNode: Node = {
            id: chatNodeId,
            type: 'chatNode',
            position: chatNodePosition,
            selected: true,
            data: {
              label: `分析文件：${fileNodes.map(n => n.data.fileInfo.name).join(', ')}`,
              content: `请分析这些文件的内容，并提供主要观点和见解。`,
              response: '等待回答...'
            }
          };

          const newEdges: Edge[] = fileNodes.map(fileNode => ({
            id: `e${fileNode.id}-${chatNodeId}`,
            source: fileNode.id,
            target: chatNodeId,
          }));

          setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), ...fileNodes, newChatNode]);
          setEdges(eds => [...eds, ...newEdges]);
          setSelectedNode(newChatNode);
          updateSelectedNode(chatNodeId);
          setUploadQueue({ files: [], processing: false });
        }
      };

      if (file.type.startsWith('text/')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  }, [nodes, setNodes, setEdges, updateSelectedNode, uploadQueue]);

  React.useEffect(() => {
    processUploadQueue();
  }, [uploadQueue.files, processUploadQueue]);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);

  const handleDrag = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth >= 30 && newWidth <= 70) {
      setLeftPanelWidth(newWidth);
    }
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
  }, []);

  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileView = windowWidth < 768; // 768px is the typical tablet breakpoint

  const flowContent = (
    <div className="w-full h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
      <ReactFlow
        nodes={nodesWithDelete}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        zoomOnScroll={true}
        defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
        minZoom={0.2}
        maxZoom={1.5}
        className="bg-gray-50"
      >
        <Background color="#e2e8f0" gap={16} />
        <Controls />
      </ReactFlow>
      <NewNodeButton onClick={handleNewEmptyNode} />
    </div>
  );

  const chatContent = (
    <ChatPanel 
      node={selectedNode}
      isCreatingEmpty={isCreatingEmptyNode}
      inputNodes={selectedNode ? getNodeInputs(selectedNode.id) : []}
      onAskFollowUp={handleAskFollowUp}
      onInitialQuestion={createNewNodes}
      onFileUpload={handleFileUpload}
      onUpdateNodeLLM={handleUpdateNodeLLM}
      selectedModel={selectedModel}
      setSelectedModel={setSelectedModel}
      error={error}
    />
  );

  return (
    <div className="w-screen h-screen bg-gray-50">
      <div className="w-full h-full">
        {isMobileView ? (
          <div className="w-full h-full p-4">
            <TabView flowContent={flowContent} chatContent={chatContent} />
          </div>
        ) : (
          <div className="flex w-full h-full">
            <div style={{ width: `${leftPanelWidth}%` }} className="h-full p-4">
              {flowContent}
            </div>
            <div
              className="w-2 hover:bg-blue-200 cursor-col-resize transition-colors relative group size-handler"
              onMouseDown={handleDragStart}
            >
              <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-100 transition-colors" />
            </div>
            <div style={{ width: `${100 - leftPanelWidth}%` }} className="h-full p-4">
              {chatContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;