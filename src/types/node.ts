export interface NodeLLMConfig {
  providerId: string;
  model: string;
}

export interface ChatNodeData {
  label: string;
  content: string;
  response: string;
  llmConfig?: NodeLLMConfig;
  onDelete?: () => void;
}

export interface FileNodeData {
  label: string;
  fileInfo: {
    name: string;
    size: number;
    type: string;
    uploadTime: Date;
    content?: string;
  };
  onDelete?: () => void;
}