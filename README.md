# Qwen OpenAI-Compatible Proxy Server

A proxy server that exposes Qwen models through an OpenAI-compatible API endpoint.

## Quick Start

1.  **Prerequisites**: You need to authenticate with Qwen using the official `qwen-code` CLI tool to generate the required credentials file.
    *   Install the `qwen-code` CLI tool from [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code)
    *   Run `qwen-code auth` to authenticate with your Qwen account
    *   This will create the `~/.qwen/oauth_creds.json` file needed by the proxy server
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