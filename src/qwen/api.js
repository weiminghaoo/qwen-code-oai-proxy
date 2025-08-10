const axios = require('axios');
const { QwenAuthManager } = require('./auth.js');

// Default Qwen configuration
const DEFAULT_QWEN_API_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const DEFAULT_MODEL = 'qwen3-coder-plus';

// List of known Qwen models
const QWEN_MODELS = [
  {
    id: 'qwen3-coder-plus',
    object: 'model',
    created: 1754686206,
    owned_by: 'qwen'
  },
  {
    id: 'qwen3-coder-turbo',
    object: 'model',
    created: 1754686206,
    owned_by: 'qwen'
  },
  {
    id: 'qwen3-plus',
    object: 'model',
    created: 1754686206,
    owned_by: 'qwen'
  },
  {
    id: 'qwen3-turbo',
    object: 'model',
    created: 1754686206,
    owned_by: 'qwen'
  }
];

/**
 * Check if an error is related to authentication/authorization
 */
function isAuthError(error) {
  if (!error) return false;

  const errorMessage = 
    error instanceof Error 
      ? error.message.toLowerCase() 
      : String(error).toLowerCase();

  // Define a type for errors that might have status or code properties
  const errorWithCode = error;
  const errorCode = errorWithCode?.response?.status || errorWithCode?.code;

  return (
    errorCode === 400 ||
    errorCode === 401 ||
    errorCode === 403 ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('forbidden') ||
    errorMessage.includes('invalid api key') ||
    errorMessage.includes('invalid access token') ||
    errorMessage.includes('token expired') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('access denied') ||
    (errorMessage.includes('token') && errorMessage.includes('expired')) ||
    // Also check for 504 errors which might be related to auth issues
    errorCode === 504 ||
    errorMessage.includes('504') ||
    errorMessage.includes('gateway timeout')
  );
}

class QwenAPI {
  constructor() {
    this.authManager = new QwenAuthManager();
  }

  async getApiEndpoint(credentials) {
    // Check if credentials contain a custom endpoint
    if (credentials && credentials.resource_url) {
      let endpoint = credentials.resource_url;
      // Ensure it has a scheme
      if (!endpoint.startsWith('http')) {
        endpoint = `https://${endpoint}`;
      }
      // Ensure it has the /v1 suffix
      if (!endpoint.endsWith('/v1')) {
        if (endpoint.endsWith('/')) {
          endpoint += 'v1';
        } else {
          endpoint += '/v1';
        }
      }
      return endpoint;
    } else {
      // Use default endpoint
      return DEFAULT_QWEN_API_BASE_URL;
    }
  }

  async chatCompletions(request) {
    // Get a valid access token (automatically refreshes if needed)
    const accessToken = await this.authManager.getValidAccessToken();
    const credentials = await this.authManager.loadCredentials();
    const apiEndpoint = await this.getApiEndpoint(credentials);
    
    // Make API call
    const url = `${apiEndpoint}/chat/completions`;
    const payload = {
      model: request.model || DEFAULT_MODEL,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
      tools: request.tools,
      tool_choice: request.tool_choice
    };
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'QwenOpenAIProxy/1.0.0 (linux; x64)'
    };
    
    try {
      const response = await axios.post(url, payload, { headers, timeout: 300000 }); // 5 minute timeout
      return response.data;
    } catch (error) {
      // Check if this is an authentication error that might benefit from a retry
      if (isAuthError(error)) {
        console.log('\x1b[33m%s\x1b[0m', `Detected auth error (${error.response?.status || 'N/A'}), attempting token refresh and retry...`);
        try {
          // Force refresh the token and retry once
          await this.authManager.performTokenRefresh(credentials);
          const newAccessToken = await this.authManager.getValidAccessToken();
          
          // Retry the request with the new token
          console.log('\x1b[36m%s\x1b[0m', 'Retrying request with refreshed token...');
          const retryHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newAccessToken}`,
            'User-Agent': 'QwenOpenAIProxy/1.0.0 (linux; x64)'
          };
          
          const retryResponse = await axios.post(url, payload, { headers: retryHeaders, timeout: 300000 });
          console.log('\x1b[32m%s\x1b[0m', 'Request succeeded after token refresh');
          return retryResponse.data;
        } catch (retryError) {
          console.error('\x1b[31m%s\x1b[0m', 'Request failed even after token refresh');
          // If retry fails, throw the original error with additional context
          throw new Error(`Qwen API error (after token refresh attempt): ${error.response?.status || 'N/A'} ${JSON.stringify(error.response?.data || error.message)}`);
        }
      }
      
      if (error.response) {
        // The request was made and the server responded with a status code
        throw new Error(`Qwen API error: ${error.response.status} ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error(`Qwen API request failed: No response received`);
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(`Qwen API request failed: ${error.message}`);
      }
    }
  }

  async listModels() {
    console.log('Returning mock models list');
    
    // Return a mock list of Qwen models since Qwen API doesn't have this endpoint
    return {
      object: 'list',
      data: QWEN_MODELS
    };
  }

  async createEmbeddings(request) {
    // Get a valid access token (automatically refreshes if needed)
    const accessToken = await this.authManager.getValidAccessToken();
    const credentials = await this.authManager.loadCredentials();
    const apiEndpoint = await this.getApiEndpoint(credentials);
    
    // Make API call
    const url = `${apiEndpoint}/embeddings`;
    const payload = {
      model: request.model || 'text-embedding-v1',
      input: request.input
    };
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'QwenOpenAIProxy/1.0.0 (linux; x64)'
    };
    
    try {
      const response = await axios.post(url, payload, { headers, timeout: 300000 }); // 5 minute timeout
      return response.data;
    } catch (error) {
      // Check if this is an authentication error that might benefit from a retry
      if (isAuthError(error)) {
        console.log('\x1b[33m%s\x1b[0m', `Detected auth error (${error.response?.status || 'N/A'}), attempting token refresh and retry...`);
        try {
          // Force refresh the token and retry once
          await this.authManager.performTokenRefresh(credentials);
          const newAccessToken = await this.authManager.getValidAccessToken();
          
          // Retry the request with the new token
          console.log('\x1b[36m%s\x1b[0m', 'Retrying request with refreshed token...');
          const retryHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newAccessToken}`,
            'User-Agent': 'QwenOpenAIProxy/1.0.0 (linux; x64)'
          };
          
          const retryResponse = await axios.post(url, payload, { headers: retryHeaders, timeout: 300000 });
          console.log('\x1b[32m%s\x1b[0m', 'Request succeeded after token refresh');
          return retryResponse.data;
        } catch (retryError) {
          console.error('\x1b[31m%s\x1b[0m', 'Request failed even after token refresh');
          // If retry fails, throw the original error with additional context
          throw new Error(`Qwen API error (after token refresh attempt): ${error.response?.status || 'N/A'} ${JSON.stringify(error.response?.data || error.message)}`);
        }
      }
      
      if (error.response) {
        // The request was made and the server responded with a status code
        throw new Error(`Qwen API error: ${error.response.status} ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error(`Qwen API request failed: No response received`);
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(`Qwen API request failed: ${error.message}`);
      }
    }
  }
}

module.exports = { QwenAPI };