import { Request, Response } from 'express';
import { GeminiService } from '../services/geminiService';
import { InMemoryStore } from '../utils/inMemoryStore';
import { ApiResponse } from '../types';

/**
 * Controller for handling chat/conversation requests
 */
export const chatController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string.'
      } as ApiResponse);
      return;
    }


    // Get session context if available
    let sessionContext = null;
    if (sessionId) {
      sessionContext = InMemoryStore.get(sessionId);
    }

    // Use Gemini to generate a conversational response with context
    const response = await GeminiService.generateChatResponse(message.trim(), sessionContext);
    
    if (!response.success) {
      res.status(500).json({
        success: false,
        error: response.error || 'Failed to generate chat response'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: {
        response: response.message
      },
      message: 'Chat response generated successfully'
    } as ApiResponse);

  } catch (error) {
    // Chat controller error
    
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your message. Please try again.'
    } as ApiResponse);
  }
};