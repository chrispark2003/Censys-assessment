import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { DataValidator } from '../utils/dataValidator';
import { InMemoryStore } from '../utils/inMemoryStore';
import { ApiResponse, ValidationResult } from '../types';

/**
 * Controller for handling file uploads and initial validation
 */
export const uploadController = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded. Please select a JSON file to upload.'
      } as ApiResponse);
      return;
    }

    const { filename, originalname, path: filePath } = req.file;
    
    
    // Read and parse the uploaded JSON file
    let jsonData: any;
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      jsonData = JSON.parse(fileContent);
    } catch (parseError) {
      // Clean up the uploaded file
      await fs.unlink(filePath).catch(() => {});
      
      res.status(400).json({
        success: false,
        error: 'Invalid JSON file. Please ensure your file contains valid JSON data.'
      } as ApiResponse);
      return;
    }

    // Perform comprehensive validation automatically (AI + traditional) - no user input required
    const validation: ValidationResult = await DataValidator.validateData(jsonData, true);
    
    if (!validation.isValid) {
      // Clean up the uploaded file
      await fs.unlink(filePath).catch(() => {});
      
      res.status(400).json({
        success: false,
        error: validation.error || 'Invalid data format'
      } as ApiResponse);
      return;
    }

    if (!validation.isCensysData) {
      // Clean up the uploaded file
      await fs.unlink(filePath).catch(() => {});

      let errorMessage = 'This does not appear to be Censys host data. Please upload a valid JSON file containing rich Censys host data with fields like "services", "location", or "autonomous_system".';
      
      // Add AI validation details if available
      if (validation.aiValidation) {
        const confidence = Math.round(validation.aiValidation.confidence * 100);
        errorMessage += ` AI analysis (${confidence}% confidence): ${validation.aiValidation.reasoning}`;
        
        if (validation.aiValidation.concerns.length > 0) {
          errorMessage += ` Concerns: ${validation.aiValidation.concerns.join(', ')}`;
        }
      }

      res.status(400).json({
        success: false,
        error: errorMessage
      } as ApiResponse);
      return;
    }

    // Store the data temporarily in memory
    const sessionId = path.basename(filename, path.extname(filename));
    InMemoryStore.store(sessionId, {
      data: jsonData,
      originalFilename: originalname,
      uploadedAt: new Date(),
      filePath: filePath
    });


    // Generate success message showing all validations were completed automatically
    let successMessage = `File successfully uploaded and validated.`;
    

    res.json({
      success: true,
      data: {
        sessionId,
        hostCount: validation.hostCount,
        filename: originalname,
        shouldSummarize: validation.isCensysData && validation.hostCount! >= 1,
        validationSummary: {
          structuralValidation: 'passed',
          aiValidation: validation.aiValidation ? {
            status: 'completed',
            confidence: validation.aiValidation.confidence,
            reasoning: validation.aiValidation.reasoning
          } : { status: validation.fallbackToManual ? 'unavailable' : 'skipped' },
          overallResult: validation.isCensysData ? 'authentic_censys_data' : 'valid_structure_only'
        }
      },
      message: successMessage
    } as ApiResponse);

  } catch (error) {
    // Upload controller error
    
    // Clean up file if it exists
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your file. Please try again.'
    } as ApiResponse);
  }
};