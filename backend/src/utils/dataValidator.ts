import { CensysData, ValidationResult } from '../types';
import { GeminiService } from '../services/geminiService';

/**
 * Utility class for validating Censys host data
 */
export class DataValidator {
  /**
   * Quick validation method for API endpoints that need fast responses
   */
  static async validateQuick(data: any): Promise<ValidationResult> {
    return this.validateData(data, false); // Skip AI validation for speed
  }

  /**
   * AI-only validation method for explicit AI verification requests
   */
  static async validateWithAI(data: any): Promise<ValidationResult> {
    return this.validateAI(data);
  }

  /**
   * Comprehensive validation that automatically combines AI and traditional validation methods
   * This is the primary validation method that should be used for all uploads
   */
  static async validateData(data: any, useAI: boolean = true): Promise<ValidationResult> {
    // Always perform traditional validation first for basic structure checks
    const traditionalResult = this.validateCensysData(data);
    
    // If traditional validation fails completely, return immediately
    if (!traditionalResult.isValid) {
      return traditionalResult;
    }

    // If AI validation is disabled, return traditional result
    if (!useAI) {
      return traditionalResult;
    }

    // Always attempt AI validation for uploaded data to ensure authenticity
    try {
      const aiResult = await this.validateAI(data);
      
      // Combine results - traditional validation provides structure validation,
      // AI validation provides additional confidence but shouldn't override valid traditional results
      const combinedResult: ValidationResult = {
        isValid: traditionalResult.isValid && aiResult.isValid,
        isCensysData: traditionalResult.isCensysData && aiResult.isCensysData,
        hostCount: traditionalResult.hostCount,
        aiValidation: aiResult.aiValidation
      };

      // Combine error messages if both have concerns
      const errors: string[] = [];
      if (traditionalResult.error) errors.push(`Structure validation: ${traditionalResult.error}`);
      if (aiResult.error) errors.push(`AI validation: ${aiResult.error}`);
      
      if (errors.length > 0) {
        combinedResult.error = errors.join(' | ');
      }

      // If AI has low confidence, add warning but don't override valid traditional validation
      if (aiResult.aiValidation && aiResult.aiValidation.confidence < 0.6 && traditionalResult.isCensysData) {
        const confidencePercent = Math.round(aiResult.aiValidation.confidence * 100);
        combinedResult.error = combinedResult.error ? 
          `${combinedResult.error}. AI confidence warning: ${confidencePercent}% confidence` : 
          `AI validation warning: ${confidencePercent}% confidence - data structure is valid`;
        // Keep isCensysData as true since traditional validation passed
      } else if (aiResult.aiValidation && aiResult.aiValidation.confidence < 0.6) {
        combinedResult.isCensysData = false;
        const confidencePercent = Math.round(aiResult.aiValidation.confidence * 100);
        combinedResult.error = combinedResult.error || 
          `AI validation failed (${confidencePercent}% confidence) - data structure is valid but content authenticity is questionable`;
      }

      // If AI identifies concerns, include them but don't override valid traditional results
      if (aiResult.aiValidation && aiResult.aiValidation.concerns.length > 0) {
        const concernText = aiResult.aiValidation.concerns.join(', ');
        combinedResult.error = combinedResult.error ? 
          `${combinedResult.error}. AI concerns: ${concernText}` : 
          `AI validation concerns: ${concernText}`;
      }

      return combinedResult;

    } catch (error) {
      // AI validation failed during comprehensive validation
      
      // If AI validation fails, return traditional result (don't downgrade valid results)
      return {
        ...traditionalResult,
        error: traditionalResult.error ? 
          `${traditionalResult.error} (AI validation unavailable)` : 
          undefined, // Don't add error message if traditional validation passed cleanly
        fallbackToManual: true
      };
    }
  }

  /**
   * Validates if the provided data is valid JSON and contains Censys host data
   */
  static validateCensysData(data: any): ValidationResult {
    try {
      // Check if data exists
      if (!data || typeof data !== 'object') {
        return {
          isValid: false,
          isCensysData: false,
          error: 'Data must be a valid JSON object'
        };
      }

      // Check for hosts array
      if (!data.hosts) {
        return {
          isValid: true,
          isCensysData: false,
          error: 'Data does not contain a "hosts" field. Expected Censys format: {"hosts": [...]}'
        };
      }

      // Validate hosts is an array
      if (!Array.isArray(data.hosts)) {
        return {
          isValid: true,
          isCensysData: false,
          error: 'The "hosts" field must be an array'
        };
      }

      // Check if hosts array is empty
      if (data.hosts.length === 0) {
        return {
          isValid: true,
          isCensysData: false,
          error: 'The "hosts" array is empty. Please provide data with at least one host.'
        };
      }

      // Validate individual hosts
      const validHosts = data.hosts.filter((host: any) => this.isValidHost(host));

      if (validHosts.length === 0) {
        return {
          isValid: true,
          isCensysData: false,
          error: 'No valid hosts found. Each host must have an "ip" field with a valid IP address.'
        };
      }

      // Check if we have a reasonable percentage of valid hosts
      const validRatio = validHosts.length / data.hosts.length;
      if (validRatio < 0.5) {
        return {
          isValid: true,
          isCensysData: false,
          error: `Only ${Math.round(validRatio * 100)}% of hosts have valid IP addresses. This may not be Censys host data.`
        };
      }

      // Validate Censys-specific structure
      const censysValidation = this.validateCensysStructure(data.hosts);
      if (!censysValidation.isValid) {
        return {
          isValid: true,
          isCensysData: false,
          error: censysValidation.error
        };
      }

      return {
        isValid: true,
        isCensysData: true,
        hostCount: validHosts.length
      };

    } catch (error) {
      return {
        isValid: false,
        isCensysData: false,
        error: 'Failed to validate data structure'
      };
    }
  }

  /**
   * Validates if a single host object is valid
   */
  private static isValidHost(host: any): boolean {
    if (!host || typeof host !== 'object') {
      return false;
    }

    // Must have an IP field
    if (!host.ip || typeof host.ip !== 'string') {
      return false;
    }

    // Validate IP address format (basic validation)
    return this.isValidIPAddress(host.ip);
  }

  /**
   * Basic IP address validation
   */
  private static isValidIPAddress(ip: string): boolean {
    // IPv4 regex pattern
    const ipv4Pattern = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
    
    // IPv6 basic pattern (simplified)
    const ipv6Pattern = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::1|::)$/;
    
    return ipv4Pattern.test(ip) || ipv6Pattern.test(ip) || ip === 'localhost';
  }

  /**
   * Validates Censys-specific data structure and fields
   */
  private static validateCensysStructure(hosts: any[]): { isValid: boolean; error?: string } {
    // Check if at least some hosts have Censys-typical fields
    const hostsWithCensysFields = hosts.filter(host => this.hasCensysFields(host));

    if (hostsWithCensysFields.length === 0) {
      return {
        isValid: false,
        error: 'Data does not appear to contain Censys host information. Expected fields like "services", "location", or "autonomous_system" are missing.'
      };
    }

    // If less than 30% of hosts have Censys fields, it's likely not real Censys data
    const censysRatio = hostsWithCensysFields.length / hosts.length;
    if (censysRatio < 0.3) {
      return {
        isValid: false,
        error: `Only ${Math.round(censysRatio * 100)}% of hosts contain typical Censys fields. This may not be genuine Censys data.`
      };
    }

    return { isValid: true };
  }

  /**
   * Checks if a host has typical Censys-specific fields
   */
  private static hasCensysFields(host: any): boolean {
    if (!host || typeof host !== 'object') return false;

    // Check for key Censys fields (at least one must be present)
    const censysFields = [
      'services',           // Array of services/ports
      'location',           // Geographic location data
      'autonomous_system',  // ASN information
      'dns',               // DNS information
      'threat_intelligence', // Security/threat data
      'protocols',         // Network protocols
      'certificates'       // SSL/TLS certificates
    ];

    return censysFields.some(field => host.hasOwnProperty(field));
  }

  /**
   * Extracts and cleans host data from validated Censys data
   */
  static extractHosts(data: CensysData): Array<any> {
    if (!data.hosts || !Array.isArray(data.hosts)) {
      return [];
    }

    return data.hosts.filter(host => this.isValidHost(host));
  }

  /**
   * Function to validate data using AI as a first check
   */
  static async validateAI(data: any): Promise<ValidationResult> {
    try {
      // Quick preliminary checks before AI validation
      if (!data || typeof data !== 'object') {
        return {
          isValid: false,
          isCensysData: false,
          error: 'Data must be a valid JSON object'
        };
      }

      // Prepare data sample for AI analysis (limit size for API efficiency)
      const sampleData = this.prepareSampleForAI(data);
      
      // Create prompt for AI validation
      const prompt = this.createValidationPrompt(sampleData);
      
      // Call AI service (you'll need to implement this based on your chosen AI provider)
      const aiResponse = await this.callAIService(prompt);
      
      // Parse AI response
      return this.parseAIResponse(aiResponse, data);

    } catch (error) {
      // AI validation failed
      
      // Fallback to traditional validation if AI fails - don't override valid results
      const fallbackResult = this.validateCensysData(data);
      return {
        ...fallbackResult,
        error: 'AI validation unavailable, relying on traditional validation',
        fallbackToManual: true
      };
    }
  }

  /**
   * Prepares a sample of the data for AI analysis
   */
  private static prepareSampleForAI(data: any): any {
    const sample: any = {
      structure: {},
      sampleHosts: []
    };

    // Analyze top-level structure
    sample.structure = Object.keys(data).reduce((acc, key) => {
      acc[key] = Array.isArray(data[key]) ? 'array' : typeof data[key];
      return acc;
    }, {} as Record<string, string>);

    // Take a sample of hosts (max 3 for analysis)
    if (data.hosts && Array.isArray(data.hosts)) {
      sample.hostCount = data.hosts.length;
      sample.sampleHosts = data.hosts.slice(0, 3).map((host: any) => {
        // Only include structure and first few characters of values for privacy
        const sampleHost: any = {};
        for (const [key, value] of Object.entries(host || {})) {
          if (typeof value === 'string') {
            sampleHost[key] = value.length > 20 ? `${value.substring(0, 20)}...` : value;
          } else if (Array.isArray(value)) {
            sampleHost[key] = `[array with ${value.length} items]`;
          } else if (typeof value === 'object' && value !== null) {
            sampleHost[key] = `{object with keys: ${Object.keys(value).join(', ')}}`;
          } else {
            sampleHost[key] = typeof value;
          }
        }
        return sampleHost;
      });
    }

    return sample;
  }

  /**
   * Creates a validation prompt for the AI service
   */
  private static createValidationPrompt(sampleData: any): string {
    return `
Please analyze this data structure and determine if it appears to be Censys host data:

Data Structure:
${JSON.stringify(sampleData, null, 2)}

This is the structure of valid Censys host data. Not all fields are required, but typical Censys data includes fields like 
"services", "location", "autonomous_system", and "dns". The data should be consistent with network and security-related information.:
{
  "metadata": {
    "description": "Host data collection",
    "created_at": "2024-01-01",
    "data_sources": ["data_source"],
    "hosts_count": 1,
    "ips_analyzed": ["xxx.xxx.xxx.xxx"]
  },
  "hosts": [
    {
      "ip": "xxx.xxx.xxx.xxx",
      "location": {
        "city": "city",
        "country": "country",
        "country_code": "XX",
        "coordinates": {
          "latitude": 0.0,
          "longitude": 0.0
        }
      },
      "autonomous_system": {
        "asn": 12345,
        "name": "organization name",
        "country_code": "XX"
      },
      "services": [
        {
          "port": 1234,
          "protocol": "protocol",
          "banner": "service banner text",
          "software": [
            {
              "product": "software",
              "vendor": "vendor",
              "version": "1.0"
            }
          ],
          "vulnerabilities": [
            {
              "cve_id": "CVE-YYYY-NNNN",
              "severity": "level",
              "cvss_score": 0.0,
              "description": "vulnerability description"
            }
          ]
        }
      ],
      "threat_intelligence": {
        "security_labels": ["label"],
        "risk_level": "level"
      }
    }
  ]
}

Please respond with a JSON object containing:
{
  "isCensysData": boolean,
  "confidence": number (0-1),
  "reasoning": "explanation of your analysis",
  "identifiedFields": ["list", "of", "censys", "fields", "found"],
  "concerns": ["any", "issues", "or", "anomalies"]
}

Key indicators of Censys data:
- "hosts" array at root level
- Host objects with "ip" fields
- Censys-specific fields like "services", "location", "autonomous_system", "dns"
- Network/security related metadata
- Consistent data structure across hosts
- Compare the provided data structure against the expected format above
`;
  }

  /**
   * Calls the AI service for validation
   */
  private static async callAIService(prompt: string): Promise<any> {
    // Use the existing Gemini service
    return await GeminiService.generateContent(prompt);
  }

  /**
   * Parses the AI response and converts it to ValidationResult
   */
  private static parseAIResponse(aiResponse: string, originalData: any): ValidationResult {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const aiAnalysis = JSON.parse(jsonMatch[0]);
      
      // Convert AI analysis to ValidationResult
      const result: ValidationResult = {
        isValid: true,
        isCensysData: aiAnalysis.isCensysData || false,
        aiValidation: {
          confidence: aiAnalysis.confidence || 0,
          reasoning: aiAnalysis.reasoning || 'No reasoning provided',
          identifiedFields: aiAnalysis.identifiedFields || [],
          concerns: aiAnalysis.concerns || []
        }
      };

      // Add host count if data is considered valid Censys data
      if (result.isCensysData && originalData.hosts && Array.isArray(originalData.hosts)) {
        result.hostCount = originalData.hosts.length;
      }

      // Add error message if confidence is low or concerns exist
      if (aiAnalysis.confidence < 0.7 || (aiAnalysis.concerns && aiAnalysis.concerns.length > 0)) {
        result.error = `AI validation concerns: ${aiAnalysis.concerns?.join(', ') || 'Low confidence in data validity'}`;
      }

      return result;

    } catch (error) {
      // Failed to parse AI response
      return {
        isValid: true,
        isCensysData: false,
        error: 'Failed to parse AI validation response',
        fallbackToManual: true
      };
    }
  }
}


