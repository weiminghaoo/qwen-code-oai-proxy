# Qwen OpenAI-Compatible Proxy Server Plan

## Overview
Create a proxy server that exposes Qwen models through an OpenAI-compatible API endpoint with full function calling support. This will allow any application that works with OpenAI APIs to seamlessly use Qwen models with tool calling capabilities.

## Architecture

```
[OpenAI Client] → [Proxy Server] → [Qwen OAuth + API]
        ↓              ↓               ↓
   OpenAI Format   Translation    Qwen Models + Tools
```

## Key Components

### 1. Authentication Management
- **OAuth Flow Handler**: Implement Qwen's device authorization flow
- **Token Storage**: Securely store access and refresh tokens
- **Automatic Refresh**: Proactively refresh tokens before expiration
- **Token Validation**: Verify token validity before API calls

### 2. API Translation Layer
- **Request Conversion**: Translate OpenAI chat completions requests to Qwen API format
- **Response Conversion**: Convert Qwen responses to OpenAI format
- **Function Calling Bridge**: Translate between OpenAI function calling and Qwen tool system
- **Streaming Support**: Handle both regular and streaming responses

### 3. Tool/Function Management
- **Schema Translation**: Convert OpenAI function schemas to Qwen tool schemas
- **Tool Execution**: Execute tools based on model requests
- **Result Formatting**: Format tool results in OpenAI-compatible format

### 4. Server Implementation
- **HTTP Server**: Fastify/Express server with OpenAI-compatible endpoints
- **Rate Limiting**: Handle Qwen API rate limits gracefully
- **Error Handling**: Proper error responses in OpenAI format
- **CORS Support**: Enable cross-origin requests

## Implementation Plan

### Phase 1: Core Authentication
1. Implement Qwen OAuth device flow
2. Create token storage and refresh mechanism
3. Build token validation and automatic refresh

### Phase 2: API Translation
1. Implement request/response format conversion
2. Handle basic chat completions endpoint
3. Add support for parameters (temperature, max_tokens, etc.)

### Phase 3: Function Calling
1. Implement function schema translation
2. Handle function call requests from model
3. Execute tools and return results
4. Support streaming function calls

### Phase 4: Server & Integration
1. Build HTTP server with OpenAI-compatible endpoints
2. Add proper error handling and rate limiting
3. Implement logging and monitoring
4. Add configuration support

## Endpoints to Implement

### POST /v1/chat/completions
- **Input**: OpenAI chat completions request format
- **Output**: OpenAI chat completions response format
- **Features**: 
  - Support for messages, tools, tool_choice
  - Streaming responses (text/event-stream)
  - Function calling
  - All standard OpenAI parameters

### GET /v1/models
- **Output**: List of available Qwen models in OpenAI format

### POST /v1/embeddings
- **Input**: OpenAI embeddings request
- **Output**: OpenAI embeddings response

## Key Technical Details

### OAuth Integration
- Use Qwen's existing OAuth endpoints:
  - Device code: `https://chat.qwen.ai/api/v1/oauth2/device/code`
  - Token endpoint: `https://chat.qwen.ai/api/v1/oauth2/token`
- Implement token refresh with proactive renewal (30 seconds before expiration)

### Function Calling Translation
- **Incoming Tools**: Convert OpenAI `tools` array to Qwen `function_declarations`
- **Outgoing Calls**: Convert Qwen function calls to OpenAI `tool_calls` format
- **Results**: Format tool execution results as OpenAI function responses

### Response Format Mapping
- Qwen response → OpenAI response format
- Handle finish reasons, usage metadata, and streaming chunks
- Properly map Qwen-specific fields to OpenAI equivalents

## Configuration
- Qwen OAuth client credentials
- Default model selection
- Server port and host
- Token storage location
- Proxy settings (if needed)

## Usage
1. Start the proxy server
2. Configure any OpenAI-compatible application to use `http://localhost:PORT/v1` as the API endpoint
3. Use standard OpenAI API keys (handled internally by the proxy)
4. All OpenAI features should work, including function calling

## Benefits
- No need to modify existing OpenAI-compatible applications
- Full function calling support with tool execution
- Automatic token management
- Seamless integration with Qwen models
- Standard OpenAI API compliance

## Challenges & Considerations
- Rate limiting from Qwen API
- Token storage security
- Streaming response handling complexity
- Error mapping between Qwen and OpenAI formats
- Tool execution sandboxing for security