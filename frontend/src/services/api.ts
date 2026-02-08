/**
 * API service for Brand Asset Generator.
 * Handles all communication with the FastAPI backend.
 */

import axios, { AxiosError } from 'axios';
import type {
  BrandGuidelines,
  LogoRequest,
  SocialMediaRequest,
  PresentationRequest,
  EmailTemplateRequest,
  MarketingRequest,
  AssetPackage,
  GenerationOptions,
} from '../types';

// Base URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes - image generation can take time
});

// Error handler helper
function handleApiError(error: unknown): never {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.detail || error.message;
    throw new Error(`API Error: ${message}`);
  }
  throw error;
}

/**
 * Health check to verify API is available
 */
export async function checkHealth(): Promise<boolean> {
  try {
    // Health endpoint is at root level, not under /api
    const response = await axios.get('http://localhost:8000/health');
    return response.data.status === 'healthy';
  } catch {
    return false;
  }
}

/**
 * Analyze brand guidelines without generating assets
 */
export async function analyzeBrand(
  brandGuidelines: BrandGuidelines
): Promise<{ brand_name: string; analysis: string }> {
  try {
    const response = await api.post('/analyze-brand', brandGuidelines);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Generate logo variations
 */
export async function generateLogos(request: LogoRequest): Promise<AssetPackage> {
  try {
    const response = await api.post('/generate/logos', request);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Generate social media templates
 */
export async function generateSocialMedia(
  request: SocialMediaRequest
): Promise<AssetPackage> {
  try {
    const response = await api.post('/generate/social-media', request);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Generate presentation slides
 */
export async function generatePresentation(
  request: PresentationRequest
): Promise<AssetPackage> {
  try {
    const response = await api.post('/generate/presentation', request);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Generate email templates
 */
export async function generateEmailTemplates(
  request: EmailTemplateRequest
): Promise<AssetPackage> {
  try {
    const response = await api.post('/generate/email-templates', request);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Generate marketing materials
 */
export async function generateMarketing(
  request: MarketingRequest
): Promise<AssetPackage> {
  try {
    const response = await api.post('/generate/marketing', request);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Generate complete asset package
 */
export async function generateCompletePackage(
  brandGuidelines: BrandGuidelines,
  options: GenerationOptions
): Promise<AssetPackage> {
  try {
    const params = new URLSearchParams();
    params.append('include_logos', String(options.include_logos));
    params.append('include_social', String(options.include_social));
    params.append('include_presentation', String(options.include_presentation));
    params.append('include_email', String(options.include_email));
    params.append('include_marketing', String(options.include_marketing));
    
    const response = await api.post(
      `/generate/complete-package?${params.toString()}`,
      brandGuidelines
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Progress event from SSE stream
 */
export interface ProgressEvent {
  type: 'progress';
  step: number;
  total: number;
  percentage: number;
  message: string;
}

/**
 * Complete event from SSE stream
 */
export interface CompleteEvent {
  type: 'complete';
  data: AssetPackage;
}

/**
 * Error event from SSE stream
 */
export interface ErrorEvent {
  type: 'error';
  message: string;
}

export type StreamEvent = ProgressEvent | CompleteEvent | ErrorEvent;

/**
 * Generate complete asset package with progress streaming
 * Uses Server-Sent Events (SSE) to receive real-time progress updates
 */
export async function generateCompletePackageWithProgress(
  brandGuidelines: BrandGuidelines,
  options: GenerationOptions,
  onProgress: (event: ProgressEvent) => void,
  onComplete: (data: AssetPackage) => void,
  onError: (error: string) => void
): Promise<void> {
  const params = new URLSearchParams();
  params.append('include_logos', String(options.include_logos));
  params.append('include_social', String(options.include_social));
  params.append('include_presentation', String(options.include_presentation));
  params.append('include_email', String(options.include_email));
  params.append('include_marketing', String(options.include_marketing));
  
  const url = `http://localhost:8000/api/generate/complete-package-stream?${params.toString()}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(brandGuidelines),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }
    
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete SSE events
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const eventData = JSON.parse(line.slice(6)) as StreamEvent;
            
            if (eventData.type === 'progress') {
              onProgress(eventData);
            } else if (eventData.type === 'complete') {
              onComplete(eventData.data);
            } else if (eventData.type === 'error') {
              onError(eventData.message);
            }
          } catch (parseError) {
            console.error('Failed to parse SSE event:', parseError);
          }
        }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    onError(message);
  }
}

export default api;
