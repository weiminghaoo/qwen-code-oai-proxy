# Qwen OpenAI-Compatible Proxy Server

## How It Works

This proxy server provides an OpenAI-compatible API interface for Qwen models. It translates OpenAI API requests to Qwen's API and returns responses in OpenAI format.

### Architecture

```
[OpenAI Client] → [Proxy Server] → [Qwen API]
        ↓              ↓             ↓
   OpenAI Format   Translation   Qwen Models
```

### Key Components

1. **Authentication Management**
   - Automatically loads credentials from `~/.qwen/oauth_creds.json`
   - Uses the same access token as the Qwen CLI tool
   - No separate authentication needed when credentials exist

2. **API Translation Layer**
   - Direct HTTP requests to Qwen's OpenAI-compatible endpoint using Axios
   - Proper handling of headers, including Authorization Bearer token
   - Correct parameter passing to Qwen API

3. **Server Implementation**
   - Express.js server with OpenAI-compatible endpoints
   - Proper error handling and logging
   - CORS support

## Setup and Usage

### Prerequisites

1. You must already be authenticated with Qwen CLI (have `~/.qwen/oauth_creds.json`)
2. Node.js installed

### Installation

```bash
npm install
```

### Starting the Server

```bash
npm start
```

The server will start on `http://localhost:8080` by default.

### Using with OpenAI Clients

Point any OpenAI-compatible client to `http://localhost:8080/v1`:

#### Python Example
```python
from openai import OpenAI

client = OpenAI(
    api_key="fake-key",  # Not used, but required by OpenAI client
    base_url="http://localhost:8080/v1"
)

response = client.chat.completions.create(
    model="qwen3-coder-plus",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)
```

#### JavaScript/Node.js Example
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'fake-key', // Not used, but required by OpenAI client
  baseURL: 'http://localhost:8080/v1'
});

const response = await openai.chat.completions.create({
  model: 'qwen3-coder-plus',
  messages: [
    {"role": "user", "content": "Hello!"}
  ]
});

console.log(response.choices[0].message.content);
```

## Supported Endpoints

- `POST /v1/chat/completions` - Chat completions with full parameter support
- `POST /v1/embeddings` - Text embeddings
- `GET /v1/models` - List models (may not work as Qwen API doesn't have this endpoint)
- `POST /auth/initiate` - Initiate device flow authentication
- `POST /auth/poll` - Poll for authentication token
- `GET /health` - Health check endpoint

## What's Not Fully Supported

- `GET /v1/models` - Qwen API doesn't have this endpoint, so it will return a 404 error
- Streaming responses - Not yet implemented
- Function calling - Not yet implemented

## What to Avoid

### 1. Don't Modify the qwen-code Directory
The `qwen-code/` directory has been removed because it's not needed for the proxy server. The proxy directly uses the Qwen API with the same authentication logic as the CLI tool.

### 2. Don't Try to Use qwen-code-core Package
The proxy doesn't use the `@qwen-code/qwen-code-core` package. It makes direct HTTP requests to Qwen's API endpoint using Axios.

### 3. Don't Run Authentication Again
If you already have `~/.qwen/oauth_creds.json`, you don't need to authenticate again. The proxy will automatically use your existing credentials.

### 4. Don't Use the Wrong Model Names
Use the correct Qwen model names:
- `qwen3-coder-plus` (recommended)
- Other Qwen models as available

### 5. Don't Forget to Start the Server
Make sure the proxy server is running before making requests to it.

## Troubleshooting

### "401 Incorrect API key provided" Error
This usually means:
1. You don't have `~/.qwen/oauth_creds.json` 
2. The credentials file is corrupted
3. The access token has expired (re-authenticate with Qwen CLI)

### "ECONNREFUSED" Error
This means the proxy server is not running. Start it with `npm start`.

### Slow Responses
Qwen API responses may be slow during peak usage times. The proxy has a 30-second timeout.

## Development

### Adding New Endpoints
To add new endpoints, modify `src/index.js` and add corresponding methods in `src/qwen/api.js`.

### Modifying Authentication Logic
Authentication logic is in `src/qwen/auth.js`. The proxy expects credentials in `~/.qwen/oauth_creds.json`.

### Configuration
The server can be configured using environment variables:
- `PORT` - Server port (default: 8080)
- `HOST` - Server host (default: localhost)
- `DEFAULT_MODEL` - Default Qwen model (default: qwen3-coder-plus)

### Testing
Run the test script with `npm test` or `node test-proxy.js`.

## How It Works Internally

### Authentication Flow
1. The proxy looks for credentials in `~/.qwen/oauth_creds.json`
2. It extracts the `access_token` from the credentials file
3. It uses this token in the Authorization header for all API requests

### API Request Flow
1. OpenAI client makes a request to the proxy server
2. The proxy extracts the request parameters
3. The proxy loads the access token from the credentials file
4. The proxy makes a direct HTTP request to Qwen's API using Axios
5. The proxy returns the response in OpenAI format

### Error Handling
1. All errors are caught and formatted in OpenAI error format
2. Authentication errors are handled separately
3. Network errors are logged with detailed information

## License

Apache 2.0