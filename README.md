# Qwen OpenAI Proxy

A proxy server that exposes Qwen models through an OpenAI-compatible API endpoint with full function calling support.

## Features

- OpenAI-compatible API endpoints
- Full function calling support
- Integrated Qwen OAuth authentication (same as Qwen CLI)
- Automatic token refresh
- Streaming response support
- Rate limiting handling

## Installation

```bash
npm install
```

## Authentication

The proxy server uses the same authentication flow as the Qwen CLI tool. You need to authenticate with your Qwen account first:

```bash
# Authenticate with Qwen (follow the prompts)
npm run auth
```

This will initiate the device flow authentication and save your credentials to `~/.qwen/oauth_creds.json`.

## Usage

```bash
# Start the proxy server
npm start

# The server will be available at http://localhost:8080/v1
```

## Configuration

You can configure the server port and host:

```env
# Server configuration
PORT=8080
HOST=localhost
```

## OpenAI-Compatible Endpoints

- `POST /v1/chat/completions` - Chat completions with function calling
- `GET /v1/models` - List available models
- `POST /v1/embeddings` - Text embeddings

## Authentication Endpoints

- `POST /auth/initiate` - Initiate device flow authentication
- `POST /auth/poll` - Poll for authentication token

## Using with OpenAI Client Libraries

### Python

```python
from openai import OpenAI

client = OpenAI(
    api_key="fake-key",  # Not used, but required by OpenAI client
    base_url="http://localhost:8080/v1"
)

response = client.chat.completions.create(
    model="qwen-coder-plus",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)
```

### JavaScript/Node.js

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'fake-key', // Not used, but required by OpenAI client
  baseURL: 'http://localhost:8080/v1'
});

const response = await openai.chat.completions.create({
  model: 'qwen-coder-plus',
  messages: [
    {"role": "user", "content": "Hello!"}
  ]
});

console.log(response.choices[0].message.content);
```

## Function Calling

The proxy supports OpenAI-style function calling:

```javascript
const response = await openai.chat.completions.create({
  model: 'qwen-coder-plus',
  messages: [
    {"role": "user", "content": "What's the weather like in Boston?"}
  ],
  tools: [{
    "type": "function",
    "function": {
      "name": "get_current_weather",
      "description": "Get the current weather in a given location",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "The city and state, e.g. San Francisco, CA"
          }
        },
        "required": ["location"]
      }
    }
  }]
});
```

## How It Works

1. The proxy server implements OpenAI-compatible endpoints
2. Authentication is handled through the same device flow as the Qwen CLI
3. Credentials are automatically refreshed when needed
4. Requests are sent to the Qwen API using the authenticated credentials
5. Responses from Qwen are returned in OpenAI-compatible format
6. The response is sent back to the client

This allows any application that works with OpenAI APIs to seamlessly use Qwen models with function calling capabilities, while maintaining the same authentication flow as the Qwen CLI tool.