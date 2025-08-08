const axios = require('axios');
const { QwenAuthManager } = require('./auth.js');

// Default Qwen configuration
const DEFAULT_QWEN_API_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const DEFAULT_MODEL = 'qwen3-coder-plus';

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
    console.log('Making chat completions request to Qwen API');
    console.log('Request model:', request.model);
    console.log('Request messages:', JSON.stringify(request.messages, null, 2));
    
    // Get a valid access token
    const credentials = await this.authManager.loadCredentials();
    if (!credentials || !credentials.access_token) {
      throw new Error('Not authenticated with Qwen. Please run authentication flow first.');
    }
    
    const accessToken = credentials.access_token;
    const apiEndpoint = await this.getApiEndpoint(credentials);
    
    console.log('Using API endpoint:', apiEndpoint);
    console.log('Access token length:', accessToken.length);
    
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
      console.log('Making request to:', url);
      const response = await axios.post(url, payload, { headers, timeout: 30000 });
      console.log('Received response from Qwen API');
      return response.data;
    } catch (error) {
      console.error('Error from Qwen API:');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
      
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
    console.log('Listing models from Qwen API');
    
    // Get a valid access token
    const credentials = await this.authManager.loadCredentials();
    if (!credentials || !credentials.access_token) {
      throw new Error('Not authenticated with Qwen. Please run authentication flow first.');
    }
    
    const accessToken = credentials.access_token;
    const apiEndpoint = await this.getApiEndpoint(credentials);
    
    // Make API call
    const url = `${apiEndpoint}/models`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'QwenOpenAIProxy/1.0.0 (linux; x64)'
    };
    
    try {
      console.log('Making request to:', url);
      const response = await axios.get(url, { headers, timeout: 30000 });
      console.log('Received response from Qwen API');
      return response.data;
    } catch (error) {
      console.error('Error from Qwen API:');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
      
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

  async createEmbeddings(request) {
    console.log('Creating embeddings with Qwen API');
    
    // Get a valid access token
    const credentials = await this.authManager.loadCredentials();
    if (!credentials || !credentials.access_token) {
      throw new Error('Not authenticated with Qwen. Please run authentication flow first.');
    }
    
    const accessToken = credentials.access_token;
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
      console.log('Making request to:', url);
      const response = await axios.post(url, payload, { headers, timeout: 30000 });
      console.log('Received response from Qwen API');
      return response.data;
    } catch (error) {
      console.error('Error from Qwen API:');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
      
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