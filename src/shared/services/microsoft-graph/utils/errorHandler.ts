import { GraphError } from '../types';

export class GraphApiError extends Error {
  public code: string;
  public innerError?: any;
  public requestId?: string;
  public timestamp?: string;

  constructor(error: GraphError) {
    super(error.message);
    this.name = 'GraphApiError';
    this.code = error.code;
    this.innerError = error.innerError;
    this.requestId = error.innerError?.['request-id'];
    this.timestamp = error.innerError?.date;
  }
}

export const graphErrorHandler = {
  // Handle common Graph API errors
  handleError: (error: any): never => {
    console.error('Microsoft Graph API Error:', error);

    if (error.code) {
      switch (error.code) {
        case 'Unauthorized':
        case 'InvalidAuthenticationToken':
          throw new GraphApiError({
            code: 'AUTHENTICATION_FAILED',
            message: 'Authentication failed. Please sign in again.',
            innerError: error.innerError
          });

        case 'Forbidden':
        case 'InsufficientPermissions':
          throw new GraphApiError({
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to access this resource.',
            innerError: error.innerError
          });

        case 'NotFound':
          throw new GraphApiError({
            code: 'RESOURCE_NOT_FOUND',
            message: 'The requested resource was not found.',
            innerError: error.innerError
          });

        case 'TooManyRequests':
        case 'ThrottledRequest':
          throw new GraphApiError({
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please try again later.',
            innerError: error.innerError
          });

        case 'ServiceUnavailable':
          throw new GraphApiError({
            code: 'SERVICE_UNAVAILABLE',
            message: 'Microsoft Graph service is temporarily unavailable.',
            innerError: error.innerError
          });

        case 'BadRequest':
          throw new GraphApiError({
            code: 'BAD_REQUEST',
            message: error.message || 'Invalid request parameters.',
            innerError: error.innerError
          });

        case 'ConflictError':
          throw new GraphApiError({
            code: 'CONFLICT',
            message: 'The request conflicts with the current state of the resource.',
            innerError: error.innerError
          });

        default:
          throw new GraphApiError({
            code: error.code,
            message: error.message || 'An unknown error occurred.',
            innerError: error.innerError
          });
      }
    }

    // Handle network errors
    if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
      throw new GraphApiError({
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your internet connection.',
        innerError: error
      });
    }

    // Handle timeout errors
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      throw new GraphApiError({
        code: 'TIMEOUT',
        message: 'Request timed out. Please try again.',
        innerError: error
      });
    }

    // Generic error
    throw new GraphApiError({
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred.',
      innerError: error
    });
  },

  // Check if error is retryable
  isRetryableError: (error: GraphApiError): boolean => {
    const retryableCodes = [
      'RATE_LIMITED',
      'SERVICE_UNAVAILABLE',
      'TIMEOUT',
      'NETWORK_ERROR'
    ];
    return retryableCodes.includes(error.code);
  },

  // Get retry delay for rate limiting
  getRetryDelay: (error: GraphApiError): number => {
    if (error.code === 'RATE_LIMITED') {
      // Check for Retry-After header in the error
      const retryAfter = error.innerError?.headers?.['Retry-After'];
      if (retryAfter) {
        return parseInt(retryAfter) * 1000; // Convert to milliseconds
      }
      return 60000; // Default 1 minute
    }
    
    if (error.code === 'SERVICE_UNAVAILABLE') {
      return 30000; // 30 seconds
    }
    
    if (error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') {
      return 5000; // 5 seconds
    }
    
    return 0; // No retry
  }
};

export const formatGraphError = (error: GraphApiError): string => {
  let message = `${error.code}: ${error.message}`;
  
  if (error.requestId) {
    message += ` (Request ID: ${error.requestId})`;
  }
  
  if (error.timestamp) {
    message += ` (Time: ${error.timestamp})`;
  }
  
  return message;
};

// Retry wrapper for Graph API calls
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: GraphApiError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const graphError = error instanceof GraphApiError ? error : new GraphApiError({
        code: 'UNKNOWN_ERROR',
        message: error?.message || 'Unknown error'
      });
      
      lastError = graphError;
      
      // Don't retry on the last attempt or if error is not retryable
      if (attempt === maxRetries || !graphErrorHandler.isRetryableError(graphError)) {
        break;
      }
      
      // Calculate delay (exponential backoff with jitter)
      const retryDelay = graphErrorHandler.getRetryDelay(graphError);
      const exponentialDelay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 1000; // Add up to 1 second of jitter
      const delay = Math.max(retryDelay, exponentialDelay) + jitter;
      
      console.warn(`Graph API call failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${Math.round(delay)}ms...`, graphError);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}; 