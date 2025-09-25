import axios from 'axios';
import { ApiResponse, UploadResponse, SummarizeResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

export class ApiService {
  /**
   * Upload a file to the backend for processing
   */
  static async uploadFile(file: File): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || 'Failed to upload file',
        };
      }
      return {
        success: false,
        error: 'An unexpected error occurred during upload',
      };
    }
  }

  /**
   * Request summarization for uploaded data
   */
  static async summarizeData(sessionId: string): Promise<ApiResponse<SummarizeResponse>> {
    try {
      const response = await apiClient.post('/summarize', { sessionId });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || 'Failed to generate summaries',
        };
      }
      return {
        success: false,
        error: 'An unexpected error occurred during summarization',
      };
    }
  }

  /**
   * Check if the API is available
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health');
      return response.data.success === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Send a chat message and get AI response
   */
  static async sendChatMessage(message: string, sessionId?: string): Promise<ApiResponse<{ response: string }>> {
    try {
      const response = await apiClient.post('/chat', { message, sessionId });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || 'Failed to get chat response',
        };
      }
      return {
        success: false,
        error: 'An unexpected error occurred during chat',
      };
    }
  }
}