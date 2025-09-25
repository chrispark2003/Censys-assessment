import { GoogleGenerativeAI } from '@google/generative-ai';
import { CensysData, CensysHost, HostSummary, ProcessingResult } from '../types';
import { DataValidator } from '../utils/dataValidator';
import { SessionData } from '../utils/inMemoryStore';

/**
 * Service for integrating with Google's Gemini AI for host summarization
 */
export class GeminiService {
  private static genAI: GoogleGenerativeAI | null = null;

  /**
   * Initialize Gemini AI client
   */
  private static initializeClient(): GoogleGenerativeAI {
    if (!this.genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
    }

    return this.genAI;
  }

  /**
   * Generate summaries for all hosts in the provided data
   */
  static async summarizeHosts(data: CensysData): Promise<ProcessingResult> {
    try {
      // Extract valid hosts
      const hosts = DataValidator.extractHosts(data);
      
      if (hosts.length === 0) {
        return {
          success: false,
          error: 'No valid hosts found in the provided data',
          processedCount: 0,
          totalCount: 0
        };
      }


      // Initialize Gemini client
      const genAI = this.initializeClient();
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const summaries: HostSummary[] = [];
      let processedCount = 0;

      // Process hosts in batches to avoid rate limits
      const batchSize = 5;
      for (let i = 0; i < hosts.length; i += batchSize) {
        const batch = hosts.slice(i, i + batchSize);
        const batchPromises = batch.map(host => this.summarizeHost(model, host));
        
        try {
          const batchResults = await Promise.allSettled(batchPromises);
          
          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
              summaries.push(result.value);
              processedCount++;
            } else {
              const host = batch[index];
              // Failed to summarize host - using fallback
              
              // Add a fallback summary for failed hosts
              summaries.push({
                ip: host?.ip || 'unknown',
                summary: 'Unable to generate summary for this host due to processing error.'
              });
            }
          });
          
          // Small delay between batches to respect rate limits
          if (i + batchSize < hosts.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (batchError) {
          // Batch processing error - using fallback summaries
          
          // Add fallback summaries for the entire batch
          batch.forEach(host => {
            summaries.push({
              ip: host?.ip || 'unknown',
              summary: 'Unable to generate summary for this host due to processing error.'
            });
          });
        }
      }

      return {
        success: true,
        summaries,
        processedCount,
        totalCount: hosts.length
      };

    } catch (error) {
      // Gemini service error - returning empty results
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during summarization',
        processedCount: 0,
        totalCount: 0
      };
    }
  }

  /**
   * Generate summary for a single host
   */
  private static async summarizeHost(model: any, host: CensysHost): Promise<HostSummary | null> {
    try {
      const prompt = this.buildPrompt(host);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();

      return {
        ip: host.ip,
        summary: summary.trim()
      };

    } catch (error) {
      // Error summarizing host - returning fallback
      return null;
    }
  }

  /**
   * Build a comprehensive prompt for host summarization
   */
  private static buildPrompt(host: CensysHost): string {
    const hostJson = JSON.stringify(host, null, 2);
    
    return `You are a cybersecurity analyst specializing in Censys host data analysis. Please provide a concise but comprehensive summary of this host.

Host Data:
${hostJson}

Please provide a summary that includes:
1. IP address and basic location information (if available)
2. Key services and ports detected
3. Notable security findings or certificates
4. Operating system information (if detected)
5. Any significant security implications or interesting findings

IMPORTANT: Respond with PLAINTEXT ONLY. Do not use any markdown formatting, HTML tags, or special characters. No asterisks, underscores, backticks, or other formatting. Just plain, readable text.

Format your response as a clear, readable paragraph. Focus on the most important and actionable information. Keep it concise but informative.

Example format: "[IP] is located in [location]. The host runs [key services] on ports [ports]. [Security findings]. [Additional notable information]."

Summary:`;
  }

  /**
   * Test connection to Gemini API
   */
  static async testConnection(): Promise<boolean> {
    try {
      const genAI = this.initializeClient();
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const result = await model.generateContent('Test connection. Please respond with "OK".');
      const response = await result.response;
      
      return response.text().includes('OK');
    } catch (error) {
      // Gemini connection test failed
      return false;
    }
  }

  /**
   * Generate conversational response for chat messages
   */
  static async generateChatResponse(message: string, sessionContext?: SessionData | null): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // Initialize Gemini client
      const genAI = this.initializeClient();
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const chatPrompt = this.buildChatPrompt(message, sessionContext);

      const result = await model.generateContent(chatPrompt);
      const response = await result.response;
      const chatResponse = response.text();

      return {
        success: true,
        message: chatResponse.trim()
      };

    } catch (error) {
      // Gemini chat API error
      return {
        success: false,
        error: 'Failed to generate chat response'
      };
    }
  }

  /**
   * Generate content for any prompt - utility method for data validation
   */
  static async generateContent(prompt: string): Promise<string> {
    try {
      // Initialize Gemini client
      const genAI = this.initializeClient();
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text();

    } catch (error) {
      // Gemini generateContent API error
      throw error;
    }
  }

  /**
   * Build a specialized prompt for chat conversations
   */
  private static buildChatPrompt(message: string, sessionContext?: SessionData | null): string {
    let contextInfo = '';

    if (sessionContext) {
      const hostCount = sessionContext.data?.hosts?.length || 0;
      const hasSummaries = !!sessionContext.summaries?.length;

      contextInfo = `

CURRENT SESSION CONTEXT:
- User uploaded file: ${sessionContext.originalFilename || 'Unknown'}
- Total hosts in data: ${hostCount}
- Upload date: ${sessionContext.uploadedAt.toISOString()}
- Summaries generated: ${hasSummaries ? 'Yes' : 'No'}`;

      // Include actual summary content if available
      if (hasSummaries && sessionContext.summaries) {
        contextInfo += `

HOST SUMMARIES:`;
        sessionContext.summaries.forEach((summary: any, index: number) => {
          contextInfo += `
${index + 1}. ${summary.ip}: ${summary.summary}`;
        });
      }

      contextInfo += `

You can reference this data when answering questions. The user may ask about specific hosts, security findings, or patterns in their uploaded data.`;
    }

    return `You are an intelligent assistant specializing in cybersecurity and Censys host data analysis. You are part of a web application that helps users analyze and summarize Censys host data.

User capabilities in this application:
- Upload JSON files containing Censys host data
- Get AI-powered summaries of host information
- Chat with you about questions regarding their data or general assistance

Your role:
- Be helpful, professional, and knowledgeable about cybersecurity
- Answer questions about Censys data, network security, host analysis, and related topics
- Guide users on how to use the application effectively
- Provide context about cybersecurity concepts when relevant
- Be concise but informative in your responses
- Use plain text formatting only (no markdown asterisks or bold formatting)
- Use simple bullet points with hyphens (-) instead of asterisks
${contextInfo}

User message: "${message}"

Please provide a helpful and relevant response:`;
  }
}