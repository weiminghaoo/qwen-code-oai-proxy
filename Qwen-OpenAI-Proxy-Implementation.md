# Qwen OpenAI-Compatible Proxy Server Implementation

This document details the implementation of a proxy server that makes Qwen models accessible through an OpenAI-compatible API endpoint with full function calling support.

## Project Structure

```
qwen-openai-proxy/
├── src/
│   ├── auth/
│   │   ├── qwenOAuthClient.ts     # Qwen OAuth implementation
│   │   └── tokenManager.ts        # Token storage and refresh
│   ├── api/
│   │   ├── openaiServer.ts        # HTTP server with OpenAI endpoints
│   │   ├── requestTranslator.ts   # OpenAI → Qwen request conversion
│   │   └── responseTranslator.ts  # Qwen → OpenAI response conversion
│   ├── tools/
│   │   ├── toolExecutor.ts        # Tool execution engine
│   │   └── toolRegistry.ts        # Tool schema management
│   ├── config/
│   │   └── config.ts              # Configuration management
│   └── index.ts                   # Main entry point
├── package.json
└── README.md
```

## Core Components Implementation

### 1. Qwen OAuth Client

```typescript
// src/auth/qwenOAuthClient.ts
import { QwenCredentials, DeviceAuthorizationData } from './types';

export class QwenOAuthClient {
  private credentials: QwenCredentials | null = null;
  
  async initiateDeviceFlow(): Promise<DeviceAuthorizationData> {
    // Request device code from Qwen OAuth server
    // Return verification URI for user authorization
  }
  
  async pollForToken(deviceCode: string): Promise<QwenCredentials> {
    // Poll Qwen OAuth server for access token
    // Return credentials when authorized
  }
  
  async refreshAccessToken(refreshToken: string): Promise<QwenCredentials> {
    // Refresh access token using refresh token
  }
  
  getValidToken(): Promise<string> {
    // Return valid access token, refreshing if needed
  }
}
```

### 2. Token Manager

```typescript
// src/auth/tokenManager.ts
import { QwenCredentials } from './types';

export class TokenManager {
  private credentials: QwenCredentials | null = null;
  
  async loadCredentials(): Promise<void> {
    // Load credentials from secure storage
  }
  
  async saveCredentials(credentials: QwenCredentials): Promise<void> {
    // Save credentials to secure storage
  }
  
  async getValidToken(): Promise<string> {
    // Return valid token, refreshing if necessary
  }
  
  isTokenExpiringSoon(): boolean {
    // Check if token expires within threshold
  }
}
```

### 3. OpenAI Server

```typescript
// src/api/openaiServer.ts
import express from 'express';
import { OpenAIRequest, OpenAIResponse } from './types';

export class OpenAIServer {
  private app = express();
  
  constructor() {
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  private setupMiddleware(): void {
    this.app.use(express.json());
    // Add CORS, rate limiting, etc.
  }
  
  private setupRoutes(): void {
    this.app.post('/v1/chat/completions', this.handleChatCompletion.bind(this));
    this.app.get('/v1/models', this.handleListModels.bind(this));
    this.app.post('/v1/embeddings', this.handleEmbeddings.bind(this));
  }
  
  private async handleChatCompletion(req: express.Request, res: express.Response): Promise<void> {
    // Handle OpenAI chat completion request
    // Translate to Qwen format, call Qwen API, translate response back
  }
}
```

### 4. Request Translator

```typescript
// src/api/requestTranslator.ts
import { 
  OpenAIChatRequest, 
  QwenChatRequest,
  OpenAIFunctionDeclaration
} from './types';

export class RequestTranslator {
  translateChatRequest(openaiRequest: OpenAIChatRequest): QwenChatRequest {
    // Convert OpenAI request format to Qwen format
    // Handle message format, tools, parameters, etc.
    
    return {
      model: openaiRequest.model,
      contents: this.translateMessages(openaiRequest.messages),
      tools: this.translateTools(openaiRequest.tools),
      config: this.translateConfig(openaiRequest)
    };
  }
  
  private translateTools(tools: OpenAIFunctionDeclaration[] | undefined) {
    // Convert OpenAI function declarations to Qwen tool format
  }
}
```

### 5. Response Translator

```typescript
// src/api/responseTranslator.ts
import { 
  QwenChatResponse, 
  OpenAIChatResponse,
  QwenToolCall
} from './types';

export class ResponseTranslator {
  translateChatResponse(qwenResponse: QwenChatResponse): OpenAIChatResponse {
    // Convert Qwen response format to OpenAI format
    // Handle message format, tool calls, finish reasons, usage, etc.
    
    return {
      id: this.generateResponseId(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: qwenResponse.model,
      choices: this.translateChoices(qwenResponse),
      usage: this.translateUsage(qwenResponse.usageMetadata)
    };
  }
  
  private translateToolCalls(toolCalls: QwenToolCall[]) {
    // Convert Qwen tool calls to OpenAI format
  }
}
```

### 6. Tool Executor

```typescript
// src/tools/toolExecutor.ts
import { OpenAIToolCall, ToolResult } from './types';

export class ToolExecutor {
  async executeToolCall(toolCall: OpenAIToolCall): Promise<ToolResult> {
    // Parse function arguments
    // Execute the appropriate tool
    // Return result in OpenAI function response format
    
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);
    
    // Execute tool based on name and arguments
    // Return standardized result
  }
}
```

## Key Implementation Details

### OAuth Flow Implementation
1. **Device Authorization**: Request device code from Qwen OAuth server
2. **User Authorization**: Present verification URI to user for authorization
3. **Token Polling**: Poll for token until user authorizes or timeout
4. **Token Storage**: Securely store credentials (access token, refresh token, expiry)
5. **Auto-refresh**: Proactively refresh token before expiration

### Function Calling Translation
1. **Schema Conversion**: 
   - OpenAI: `{"type": "function", "function": {...}}`
   - Qwen: `{"functionDeclarations": [...]}`

2. **Call Execution**:
   - Receive Qwen tool call request
   - Execute appropriate tool/function
   - Format result as OpenAI function response

3. **Response Integration**:
   - Send tool results back to model
   - Continue conversation with model's next response

### Streaming Support
- Handle server-sent events for streaming responses
- Properly format streaming chunks in OpenAI format
- Support streaming function calls

### Error Handling
- Map Qwen API errors to appropriate OpenAI error format
- Handle authentication errors with re-authentication flow
- Provide meaningful error messages to clients

## Configuration

```typescript
// src/config/config.ts
interface ProxyConfig {
  // Server settings
  port: number;
  host: string;
  
  // Qwen OAuth settings
  qwenClientId: string;
  qwenOAuthBaseURL: string;
  
  // Token storage
  tokenStoragePath: string;
  
  // Default model
  defaultModel: string;
  
  // Rate limiting
  rateLimitRequests: number;
  rateLimitWindowMs: number;
}
```

## Usage Example

```bash
# Start the proxy server
npm start

# Server runs on http://localhost:8080/v1

# Use with any OpenAI-compatible client
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-api-key" \
  -d '{
    "model": "qwen-coder-plus",
    "messages": [{"role": "user", "content": "Hello!"}],
    "tools": [{
      "type": "function",
      "function": {
        "name": "get_current_weather",
        "description": "Get the current weather",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {"type": "string"}
          }
        }
      }
    }]
  }'
```

## Benefits of This Approach

1. **Full OpenAI Compatibility**: Works with any OpenAI-compatible application
2. **Automatic Token Management**: No manual authentication needed after initial setup
3. **Function Calling Support**: Complete tool calling capabilities
4. **Standard Compliance**: Follows OpenAI API specifications
5. **Extensible**: Easy to add new tools or features
6. **Secure**: Proper token storage and handling

## Next Steps

1. Implement core authentication components
2. Build request/response translation layer
3. Create HTTP server with OpenAI endpoints
4. Add tool execution capabilities
5. Implement configuration and CLI interface
6. Add logging and monitoring
7. Create documentation and examples