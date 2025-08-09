# Qwen OpenAI-Compatible Proxy Server - Context Summary

## Project Goal
Create an OpenAI-compatible API proxy server that allows any OpenAI-compatible application to use Qwen models with full function calling support. This enables tools like Roo code to work with Qwen models without modification.

## Project Structure
```
/home/vscode/proj/qwen-openai-proxy/
├── src/                      # Main proxy server code
│   ├── index.js             # Express.js server entry point
│   ├── config.js            # Server configuration
│   └── qwen/                # Qwen API integration
│       ├── api.js           # Qwen API client implementation
│       └── auth.js          # Authentication management
├── qwen-code/               # Qwen CLI tool source code (reference only)
│   └── packages/
│       └── core/            # Core Qwen functionality
└── docs/                    # Documentation
```

## Key Components

### 1. Proxy Server (Main Implementation)
- **Location**: `/home/vscode/proj/qwen-openai-proxy/src/`
- **Technology**: Node.js with Express.js
- **Purpose**: Translate OpenAI API requests to Qwen API requests
- **Endpoints**:
  - `POST /v1/chat/completions` - Chat completions with function calling
  - `POST /v1/embeddings` - Text embeddings
  - `GET /v1/models` - Mock models endpoint (Qwen doesn't have this)
  - Authentication endpoints for OAuth flow

### 2. Qwen CLI Tool Source Code (Reference Only)
- **Location**: `/home/vscode/proj/qwen-openai-proxy/qwen-code/`
- **Purpose**: Reference for understanding Qwen's authentication and API usage
- **Note**: This directory is NOT needed for the proxy server and has been removed

### 3. Authentication System
- **Credentials Location**: `~/.qwen/oauth_creds.json` (shared with Qwen CLI)
- **OAuth Flow**: Device authorization flow with PKCE
- **Token Management**: Automatic refresh before expiration

## Recent Issue and Fix

### Problem
Roo code sends extremely large requests (up to 10MB+) containing massive system prompts with all tool documentation. This was causing "PayloadTooLargeError" because Express.js has a default 100KB body parser limit.

### Solution
Increased Express.js body parser limits in `src/index.js`:
```javascript
// Before (default limits)
app.use(express.json());

// After (increased limits)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

## How It Works

1. **Authentication**: Loads credentials from `~/.qwen/oauth_creds.json`
2. **Request Translation**: Converts OpenAI format requests to Qwen API format
3. **API Communication**: Makes direct HTTP requests to Qwen's OpenAI-compatible endpoint
4. **Response Translation**: Converts Qwen responses to OpenAI format
5. **Token Management**: Automatically refreshes tokens when needed

## Key Files

- **Main Server**: `src/index.js`
- **Qwen API Client**: `src/qwen/api.js`
- **Authentication**: `src/qwen/auth.js`
- **Configuration**: `src/config.js`

## Usage

1. Ensure you're authenticated with Qwen CLI (has `~/.qwen/oauth_creds.json`)
2. Start server: `npm start`
3. Point OpenAI-compatible applications to `http://localhost:8080/v1`

## Recent Changes

- **Commit**: "Increase body parser limits to handle large requests from Roo code"
- **Issue Fixed**: PayloadTooLargeError when Roo sends massive system prompts
- **Solution**: Increased Express.js body parser limits to 10MB