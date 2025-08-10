# Project Goal and Architecture

## Goal

The primary goal of this project is to create an OpenAI-compatible API proxy server that allows any application designed to work with OpenAI's APIs to seamlessly use Qwen models from qwen oauth sub of qwen-code cli  . This includes full support for streaming and so on . 

the source code of qwen-code cli is in ./qwen-code . its been added to .gitignore but llm should find and search it learn more . 

The core problem this solves is the "cold start" issue for new models. By exposing Qwen's capabilities through a widely-adopted API standard (OpenAI's), we can leverage the vast ecosystem of existing tools and applications, making Qwen's models immediately useful to a broad audience.

in simple terms it is a drop and replacement for qwen-code for broad use case 
qwen api -- > qwen code cli --- > works only in termianl for  coding 
            (checks auth and refresh )
qwen api -- > proxxy ---> open ai OpenAI-compatible api --> any tools that uses openai api
            (checks auth and refresh)
## Architecture

The proxy server sits between an OpenAI-compatible client and the Qwen API, translating requests and responses in real-time.

```
[OpenAI Client] <--> [Proxy Server] <--> [Qwen API]
      |                   |                  |
OpenAI Format      Translation Layer      Qwen Models
```

### Key Components:

1.  **API Translation Layer**: This is the heart of the proxy. It converts incoming OpenAI-formatted requests into the format expected by the Qwen API, and then translates the Qwen API's response back into the OpenAI format.

2.  **Authentication Management**: The proxy is designed to be user-friendly by automatically using the same authentication credentials as the official Qwen CLI tool. It reads the `oauth_creds.json` file, uses the access token, and handles token refreshes automatically. This means that if a user is already logged into the Qwen CLI, the proxy works out-of-the-box without requiring a separate login. For a detailed explanation of the authentication process, see `authentication.md`.

3.  **Server Implementation**: The proxy is built as a Node.js server using the Express.js framework. It exposes the necessary OpenAI-compatible endpoints, such as `/v1/chat/completions` and `/v1/embeddings`.
