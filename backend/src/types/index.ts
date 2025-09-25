/**
 * Type definitions for Censys host data structure
 */

export interface CensysHost {
  ip: string;
  location?: {
    country?: string;
    city?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  services?: Array<{
    port: number;
    service_name?: string;
    transport_protocol?: string;
    certificate?: any;
    banner?: string;
  }>;
  autonomous_system?: {
    asn?: number;
    name?: string;
    country_code?: string;
  };
  operating_system?: {
    product?: string;
    version?: string;
    vendor?: string;
  };
  tags?: string[];
  last_updated_at?: string;
  [key: string]: any; // Allow for additional Censys fields
}

export interface CensysData {
  hosts: CensysHost[];
  [key: string]: any; // Allow for metadata
}

export interface HostSummary {
  ip: string;
  summary: string;
}

export interface ProcessingResult {
  success: boolean;
  summaries?: HostSummary[];
  error?: string;
  processedCount?: number;
  totalCount?: number;
}

export interface ValidationResult {
  isValid: boolean;
  isCensysData: boolean;
  error?: string;
  hostCount?: number;
  fallbackToManual?: boolean;
  aiValidation?: {
    confidence: number;
    reasoning: string;
    identifiedFields: string[];
    concerns: string[];
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}