# Qwen Code Authentication and API Analysis

## Authentication System

The Qwen CLI tool uses OAuth 2.0 Device Authorization Flow for authentication with Qwen services.

### OAuth Endpoints
- **Device Code Endpoint**: `https://chat.qwen.ai/api/v1/oauth2/device/code`
- **Token Endpoint**: `https://chat.qwen.ai/api/v1/oauth2/token`
- **Client ID**: `f0304373b74a44d2b584a3fb70ca9e56`
- **Scope**: `openid profile email model.completion`
- **Grant Type**: `urn:ietf:params:oauth:grant-type:device_code`

### PKCE (Proof Key for Code Exchange)
The authentication flow uses PKCE for security:
1. Generate code verifier (random string)
2. Create code challenge (SHA-256 hash of verifier)
3. Send challenge with device code request
4. Send verifier with token request

### Credential Storage
- **Location**: `~/.qwen/oauth_creds.json`
- **Contents**:
  - `access_token`: Bearer token for API requests
  - `refresh_token`: Token for refreshing access token
  - `id_token`: ID token with user information
  - `expiry_date`: Token expiration timestamp
  - `token_type`: Usually "Bearer"
  - `resource_url`: Optional custom API endpoint

### Token Refresh
- Tokens are automatically refreshed 30 seconds before expiration
- Refresh uses the token endpoint with grant_type=refresh_token
- New tokens are saved to the credentials file

## Qwen API Endpoints

Qwen provides an OpenAI-compatible API endpoint:

### Base URL
- **Default**: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- **Custom**: Can be overridden with `resource_url` from credentials

### Supported Endpoints
1. **Chat Completions**
   - **Method**: POST
   - **Path**: `/chat/completions`
   - **Headers**: 
     - `Authorization: Bearer {access_token}`
     - `Content-Type: application/json`
   - **Parameters**: Standard OpenAI chat completion parameters

2. **Embeddings**
   - **Method**: POST
   - **Path**: `/embeddings`
   - **Headers**: 
     - `Authorization: Bearer {access_token}`
     - `Content-Type: application/json`
   - **Parameters**: Standard OpenAI embeddings parameters

### Unsupported Endpoints
- **Models**: Qwen API does not have a `/models` endpoint like OpenAI
- **Files**: No file management endpoints
- **Fine-tuning**: No fine-tuning endpoints

## API Request Flow

1. **Load Credentials**: Read `~/.qwen/oauth_creds.json`
2. **Validate Token**: Check if access_token is valid and not expired
3. **Refresh if Needed**: Use refresh_token to get new access_token if expired
4. **Make API Call**: 
   - Set Authorization header with Bearer token
   - Use correct endpoint URL (default or custom from credentials)
   - Send request with appropriate parameters
5. **Handle Response**: Return response in OpenAI-compatible format

## Error Handling

Common error responses from Qwen API:
- **401**: Invalid or expired access token
- **403**: Insufficient permissions
- **429**: Rate limiting
- **500**: Server errors

Authentication errors trigger automatic token refresh flow.

## Key Insights for Proxy Implementation

1. **No Models Endpoint**: Don't implement `/v1/models` as Qwen doesn't support it
2. **Direct API Calls**: Can make direct HTTP requests to Qwen API without SDK
3. **Token Management**: Handle token refresh automatically
4. **Endpoint Flexibility**: Support custom endpoints from credentials
5. **OpenAI Compatibility**: Qwen already provides OpenAI-compatible responses