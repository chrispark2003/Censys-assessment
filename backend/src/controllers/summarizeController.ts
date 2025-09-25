import { Request, Response } from 'express';
import fs from 'fs/promises';
import { GeminiService } from '../services/geminiService';
import { InMemoryStore } from '../utils/inMemoryStore';
import { ApiResponse, ProcessingResult } from '../types';

/**
 * Controller for handling summarization requests
 */
export const summarizeController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Session ID is required. Please upload a file first.'
      } as ApiResponse);
      return;
    }

    // Retrieve data from memory store
    const sessionData = InMemoryStore.get(sessionId);
    
    if (!sessionData) {
      res.status(404).json({
        success: false,
        error: 'Session not found or expired. Please upload your file again.'
      } as ApiResponse);
      return;
    }


    // Process the data with Gemini AI
    const result: ProcessingResult = await GeminiService.summarizeHosts(sessionData.data);
    
    if (!result.success) {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate summaries'
      } as ApiResponse);
      return;
    }

    // Clean up uploaded file but keep session data with summaries for context
    try {
      if (sessionData.filePath) {
        await fs.unlink(sessionData.filePath);
      }

      // Update session data to include summaries and remove file path
      InMemoryStore.store(sessionId, {
        ...sessionData,
        summaries: result.summaries,
        filePath: undefined
      });

    } catch (cleanupError) {
      // Cleanup warning
    }


    res.json({
      success: true,
      data: {
        summaries: result.summaries,
        processedCount: result.processedCount,
        totalCount: result.totalCount
      },
      message: `Successfully generated summaries for ${result.processedCount} host(s). Is there anything else you'd like me to help you summarize?`
    } as ApiResponse);

  } catch (error) {
    // Summarize controller error
    
    res.status(500).json({
      success: false,
      error: 'An error occurred while generating summaries. Please try again.'
    } as ApiResponse);
  }
};