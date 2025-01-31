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

const nodeTypes = {
  chatNode: ChatNode,
  fileNode: FileNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function App() {
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
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo'); // Added state for selected model

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

  const createNewNodes = useCallback((question: string, parentNode?: Node) => {
    const provider = {
      providerId: 'openai',
      model: selectedModel
    };

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const basePosition = LayoutManager.getNewNodePosition(nodes, parentNode);

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


    setNodes((nds) => [...nds.map(n => ({ ...n, selected: false })), ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
    setSelectedNode(newNodes[0]);
    setIsCreatingEmptyNode(false);
    updateSelectedNode(newNodes[0].id);
  }, [nodes, selectedModel, setNodes, setEdges, updateSelectedNode]);

  const handleAskFollowUp = useCallback((parentNode: Node, question: string, selectedText: string) => {
    const provider = {
      providerId: 'openai',
      model: selectedModel
    };

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const basePosition = LayoutManager.getNewNodePosition(nodes, parentNode);

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
        label: `追问: ${selectedText.slice(0, 20)}... (${providerId})`,
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
  }, [nodes, selectedModel, setNodes, setEdges, updateSelectedNode]);

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

  return (
    <div className="w-screen h-screen flex bg-gray-50">
      <div style={{ width: `${leftPanelWidth}%` }} className="h-full p-4">
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
      </div>

      <div
        className="w-2 hover:bg-blue-200 cursor-col-resize transition-colors relative group size-handler"
        onMouseDown={handleDragStart}
      >
        <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-100 transition-colors" />
      </div>

      <div style={{ width: `${100 - leftPanelWidth}%` }} className="h-full p-4">
        <ChatPanel 
          node={selectedNode}
          isCreatingEmpty={isCreatingEmptyNode}
          inputNodes={selectedNode ? getNodeInputs(selectedNode.id) : []}
          onAskFollowUp={handleAskFollowUp}
          onInitialQuestion={createNewNodes}
          onFileUpload={handleFileUpload}
          onUpdateNodeLLM={handleUpdateNodeLLM}
          selectedModel={selectedModel} // Pass selectedModel to ChatPanel
          setSelectedModel={setSelectedModel} //Pass setSelectedModel to ChatPanel
        />
      </div>
    </div>
  );
}

export default App;