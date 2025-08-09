# Qwen OpenAI-Compatible Proxy Server

A proxy server that exposes Qwen models through an OpenAI-compatible API endpoint.

## Quick Start

1.  **Prerequisites**: Make sure you are authenticated with the Qwen CLI and have a `~/.qwen/oauth_creds.json` file.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Start the Server**:
    ```bash
    npm start
    ```
4.  **Use the Proxy**: Point your OpenAI-compatible client to `http://localhost:8080/v1`.

## Example Usage

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'fake-key', // Not used, but required by the OpenAI client
  baseURL: 'http://localhost:8080/v1'
});

async function main() {
  const response = await openai.chat.completions.create({
    model: 'qwen-coder-plus',
    messages: [
      { "role": "user", "content": "Hello!" }
    ]
  });

  console.log(response.choices[0].message.content);
}

main();
```

## Supported Endpoints

*   `POST /v1/chat/completions`
*   `POST /v1/embeddings`

For more detailed documentation, see the `docs/` directory.