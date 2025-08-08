# Qwen OpenAI Proxy - Proof of Concept

This is a minimal implementation to demonstrate the core concepts of the Qwen to OpenAI proxy.

## Installation

```bash
npm init -y
npm install express openai
```

## Basic Implementation

```javascript
// qwen-openai-proxy.js
const express = require('express');
const OpenAI = require('openai');

const app = express();
app.use(express.json());

// In a real implementation, this would be managed by the QwenOAuthClient
let QWEN_ACCESS_TOKEN = null;

// Mock Qwen OAuth client
class QwenOAuthClient {
  async getValidToken() {
    // In a real implementation, this would handle the full OAuth flow
    // and token refresh automatically
    if (!QWEN_ACCESS_TOKEN) {
      throw new Error('Not authenticated with Qwen. Please run authentication flow.');
    }
    return QWEN_ACCESS_TOKEN;
  }
}

// Translation layer between OpenAI and Qwen formats
class RequestTranslator {
  translateChatRequest(openaiRequest) {
    // Convert OpenAI format to Qwen format
    const qwenRequest = {
      model: openaiRequest.model || 'qwen-coder-plus',
      contents: openaiRequest.messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: [{ text: msg.content }]
      })),
      // Convert OpenAI tools to Qwen format
      tools: openaiRequest.tools ? [{
        functionDeclarations: openaiRequest.tools
          .filter(tool => tool.type === 'function')
          .map(tool => ({
            name: tool.function.name,
            description: tool.function.description,
            parameters: tool.function.parameters
          }))
      }] : undefined
    };
    
    return qwenRequest;
  }
}

class ResponseTranslator {
  translateChatResponse(qwenResponse, model) {
    // Convert Qwen response to OpenAI format
    const candidate = qwenResponse.candidates?.[0];
    if (!candidate) {
      throw new Error('Invalid response from Qwen API');
    }
    
    const openaiResponse = {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: candidate.content?.parts?.[0]?.text || '',
        },
        finish_reason: this.mapFinishReason(candidate.finishReason)
      }],
      usage: {
        prompt_tokens: qwenResponse.usageMetadata?.promptTokenCount || 0,
        completion_tokens: qwenResponse.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: qwenResponse.usageMetadata?.totalTokenCount || 0
      }
    };
    
    return openaiResponse;
  }
  
  mapFinishReason(qwenReason) {
    // Map Qwen finish reasons to OpenAI equivalents
    const reasonMap = {
      'STOP': 'stop',
      'MAX_TOKENS': 'length',
      // Add other mappings as needed
    };
    return reasonMap[qwenReason] || 'stop';
  }
}

// Main proxy server
class QwenOpenAIProxy {
  constructor() {
    this.oauthClient = new QwenOAuthClient();
    this.requestTranslator = new RequestTranslator();
    this.responseTranslator = new ResponseTranslator();
  }
  
  async handleChatCompletion(req, res) {
    try {
      // Get valid Qwen access token
      const token = await this.oauthClient.getValidToken();
      
      // Translate OpenAI request to Qwen format
      const qwenRequest = this.requestTranslator.translateChatRequest(req.body);
      
      // In a real implementation, this would call the Qwen API
      // For this POC, we'll simulate a response
      console.log('Would call Qwen API with request:', JSON.stringify(qwenRequest, null, 2));
      
      // Simulate Qwen API response
      const qwenResponse = {
        candidates: [{
          content: {
            parts: [{
              text: "Hello! I'm Qwen Coder Plus. I can help you with programming tasks."
            }]
          },
          finishReason: 'STOP'
        }],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 20,
          totalTokenCount: 30
        }
      };
      
      // Translate Qwen response to OpenAI format
      const openaiResponse = this.responseTranslator.translateChatResponse(
        qwenResponse, 
        qwenRequest.model
      );
      
      res.json(openaiResponse);
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({
        error: {
          message: error.message,
          type: 'internal_server_error'
        }
      });
    }
  }
}

// Initialize proxy
const proxy = new QwenOpenAIProxy();

// Routes
app.post('/v1/chat/completions', (req, res) => proxy.handleChatCompletion(req, res));

app.get('/v1/models', (req, res) => {
  // Return list of available Qwen models
  res.json({
    object: 'list',
    data: [
      {
        id: 'qwen-coder-plus',
        object: 'model',
        created: 1677610602,
        owned_by: 'qwen'
      },
      {
        id: 'qwen-coder-turbo',
        object: 'model',
        created: 1677610602,
        owned_by: 'qwen'
      }
    ]
  });
});

// For demo purposes, we'll set a mock token
QWEN_ACCESS_TOKEN = 'mock-qwen-access-token';

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Qwen OpenAI Proxy listening on port ${PORT}`);
  console.log(`OpenAI-compatible endpoint: http://localhost:${PORT}/v1`);
});

module.exports = app;
```

## Usage Example

```bash
# Start the proxy server
node qwen-openai-proxy.js

# In another terminal, test with curl
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-api-key" \
  -d '{
    "model": "qwen-coder-plus",
    "messages": [
      {"role": "user", "content": "Hello, Qwen!"}
    ]
  }'
```

## Testing with OpenAI Client

```javascript
// test-client.js
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: 'fake-api-key', // Not actually used, but required by OpenAI client
  baseURL: 'http://localhost:8080/v1' // Point to our proxy
});

async function main() {
  const chatCompletion = await openai.chat.completions.create({
    model: 'qwen-coder-plus',
    messages: [
      {"role": "user", "content": "Write a simple JavaScript function to add two numbers"}
    ]
  });
  
  console.log(chatCompletion.choices[0].message.content);
}

main();
```

## Key Concepts Demonstrated

1. **OpenAI-Compatible API**: The proxy implements the same endpoints and response formats as OpenAI
2. **Request Translation**: Converts OpenAI requests to Qwen format
3. **Response Translation**: Converts Qwen responses to OpenAI format
4. **Token Management**: Handles Qwen authentication (simplified in this POC)
5. **Error Handling**: Proper error responses in OpenAI format

## Next Steps for Full Implementation

1. Implement the full Qwen OAuth flow
2. Add proper token storage and refresh mechanisms
3. Integrate with the actual Qwen API
4. Implement function calling translation
5. Add streaming response support
6. Add proper configuration and CLI interface
7. Implement security measures for token storage
8. Add comprehensive error handling and logging