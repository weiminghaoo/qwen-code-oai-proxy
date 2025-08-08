# Qwen OpenAI-Compatible Proxy Server

A proxy server that exposes Qwen models through an OpenAI-compatible API endpoint.

## Features

- OpenAI-compatible API endpoints
- No separate authentication needed (uses existing Qwen CLI credentials)
- Direct integration with Qwen's API
- Full parameter support (temperature, max_tokens, etc.)
- Works with any OpenAI-compatible client

## Quick Start

1. Make sure you're authenticated with Qwen CLI (have `~/.qwen/oauth_creds.json`)
2. Install dependencies: `npm install`
3. Start the server: `npm start`
4. Point your OpenAI client to `http://localhost:8080/v1`

## Documentation

See [docs/README.md](docs/README.md) for detailed documentation.

## Example Usage

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

- `POST /v1/chat/completions` - Chat completions
- `POST /v1/embeddings` - Text embeddings

## License

Apache 2.0