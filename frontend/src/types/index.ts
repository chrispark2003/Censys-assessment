export interface HostSummary {
  ip: string;
  summary: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadResponse {
  sessionId: string;
  hostCount: number;
  filename: string;
  shouldSummarize?: boolean;
}

export interface SummarizeResponse {
  summaries: HostSummary[];
  processedCount: number;
  totalCount: number;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'error' | 'system';
  content: string;
  timestamp: Date;
  summaries?: HostSummary[];
}