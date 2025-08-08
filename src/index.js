const express = require('express');
const cors = require('cors');
const config = require('./config.js');
const { QwenAPI } = require('./qwen/api.js');
const { QwenAuthManager } = require('./qwen/auth.js');

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Qwen API client
const qwenAPI = new QwenAPI();
const authManager = new QwenAuthManager();

// Main proxy server
class QwenOpenAIProxy {
  async handleChatCompletion(req, res) {
    console.log('Received chat completion request');
    try {
      // Call Qwen API through our integrated client
      const response = await qwenAPI.chatCompletions({
        model: req.body.model || config.defaultModel,
        messages: req.body.messages,
        tools: req.body.tools,
        tool_choice: req.body.tool_choice,
        temperature: req.body.temperature,
        max_tokens: req.body.max_tokens,
        top_p: req.body.top_p,
      });
      
      console.log('Successfully received response from Qwen API');
      res.json(response);
    } catch (error) {
      console.error('Error processing request:', error);
      
      // Handle authentication errors
      if (error.message.includes('Not authenticated') || error.message.includes('access token')) {
        return res.status(401).json({
          error: {
            message: 'Not authenticated with Qwen. Please authenticate first.',
            type: 'authentication_error'
          }
        });
      }
      
      res.status(500).json({
        error: {
          message: error.message,
          type: 'internal_server_error'
        }
      });
    }
  }
  
  async handleModels(req, res) {
    console.log('Received models request');
    try {
      // Get models from Qwen
      const models = await qwenAPI.listModels();
      console.log('Successfully received models from Qwen API');
      res.json(models);
    } catch (error) {
      console.error('Error fetching models:', error);
      
      // Handle authentication errors
      if (error.message.includes('Not authenticated') || error.message.includes('access token')) {
        return res.status(401).json({
          error: {
            message: 'Not authenticated with Qwen. Please authenticate first.',
            type: 'authentication_error'
          }
        });
      }
      
      res.status(500).json({
        error: {
          message: error.message,
          type: 'internal_server_error'
        }
      });
    }
  }
  
  async handleEmbeddings(req, res) {
    console.log('Received embeddings request');
    try {
      // Call Qwen embeddings API
      const embeddings = await qwenAPI.createEmbeddings({
        model: req.body.model || 'text-embedding-v1',
        input: req.body.input,
      });
      
      console.log('Successfully received embeddings from Qwen API');
      res.json(embeddings);
    } catch (error) {
      console.error('Error processing embeddings request:', error);
      
      // Handle authentication errors
      if (error.message.includes('Not authenticated') || error.message.includes('access token')) {
        return res.status(401).json({
          error: {
            message: 'Not authenticated with Qwen. Please authenticate first.',
            type: 'authentication_error'
          }
        });
      }
      
      res.status(500).json({
        error: {
          message: error.message,
          type: 'internal_server_error'
        }
      });
    }
  }
  
  async handleAuthInitiate(req, res) {
    console.log('Received auth initiate request');
    try {
      // Initiate device flow
      const deviceFlow = await authManager.initiateDeviceFlow();
      
      res.json({
        verification_uri: deviceFlow.verification_uri,
        user_code: deviceFlow.user_code,
        device_code: deviceFlow.device_code,
        code_verifier: deviceFlow.code_verifier // This should be stored securely for polling
      });
    } catch (error) {
      console.error('Error initiating authentication:', error);
      res.status(500).json({
        error: {
          message: error.message,
          type: 'authentication_error'
        }
      });
    }
  }
  
  async handleAuthPoll(req, res) {
    console.log('Received auth poll request');
    try {
      const { device_code, code_verifier } = req.body;
      
      if (!device_code || !code_verifier) {
        return res.status(400).json({
          error: {
            message: 'Missing device_code or code_verifier',
            type: 'invalid_request'
          }
        });
      }
      
      // Poll for token
      const token = await authManager.pollForToken(device_code, code_verifier);
      
      res.json({
        access_token: token,
        message: 'Authentication successful'
      });
    } catch (error) {
      console.error('Error polling for token:', error);
      res.status(500).json({
        error: {
          message: error.message,
          type: 'authentication_error'
        }
      });
    }
  }
}

// Initialize proxy
const proxy = new QwenOpenAIProxy();

// Routes
app.post('/v1/chat/completions', (req, res) => proxy.handleChatCompletion(req, res));
app.get('/v1/models', (req, res) => proxy.handleModels(req, res));
app.post('/v1/embeddings', (req, res) => proxy.handleEmbeddings(req, res));

// Authentication routes
app.post('/auth/initiate', (req, res) => proxy.handleAuthInitiate(req, res));
app.post('/auth/poll', (req, res) => proxy.handleAuthPoll(req, res));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = config.port;
const HOST = config.host;

app.listen(PORT, HOST, () => {
  console.log(`Qwen OpenAI Proxy listening on http://${HOST}:${PORT}`);
  console.log(`OpenAI-compatible endpoint: http://${HOST}:${PORT}/v1`);
  console.log(`Authentication endpoint: http://${HOST}:${PORT}/auth/initiate`);
});