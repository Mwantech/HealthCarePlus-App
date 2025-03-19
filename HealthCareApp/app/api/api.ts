// api.ts

/**
 * Base configuration for API requests
 */
export const BASE_URL = 'http://192.168.150.185:3001/api';

/**
 * Interface for HTTP request options
 */
interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  body?: any;
  timeout?: number;
}

/**
 * Handles API error responses
 */
class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Formats URL with query parameters
 */
const formatUrl = (endpoint: string, params?: Record<string, string | number | boolean>): string => {
  const url = new URL(`${BASE_URL}${endpoint}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  
  return url.toString();
};

/**
 * Core fetch function with error handling
 */
const fetchWithConfig = async <T>(
  endpoint: string,
  method: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { headers = {}, params, body, timeout = 30000 } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const url = formatUrl(endpoint, params);
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new ApiError(
        `API Error: ${response.status} ${response.statusText}`,
        response.status,
        data
      );
    }
    
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408);
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * HTTP request methods
 */
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => 
    fetchWithConfig<T>(endpoint, 'GET', options),
    
  post: <T>(endpoint: string, body: any, options?: RequestOptions) => 
    fetchWithConfig<T>(endpoint, 'POST', { ...options, body }),
    
  put: <T>(endpoint: string, body: any, options?: RequestOptions) => 
    fetchWithConfig<T>(endpoint, 'PUT', { ...options, body }),
    
  patch: <T>(endpoint: string, body: any, options?: RequestOptions) => 
    fetchWithConfig<T>(endpoint, 'PATCH', { ...options, body }),
    
  delete: <T>(endpoint: string, options?: RequestOptions) => 
    fetchWithConfig<T>(endpoint, 'DELETE', options),
};

/**
 * Export base URL for use in other files
 */
export const getBaseUrl = () => BASE_URL;

export default api;