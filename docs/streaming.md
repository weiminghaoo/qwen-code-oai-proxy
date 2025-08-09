# Streaming in `qwen-code`

This document explains how the `qwen-code` CLI tool implements streaming responses from the Qwen API.

## Overview

Streaming is a critical feature for large language models as it allows the user to see the response as it's being generated, rather than waiting for the entire response to complete. The `qwen-code` tool has a robust implementation of streaming that is handled across multiple layers of the application.

The key files involved in this process are:

*   `packages/core/src/core/client.ts`: The high-level client that manages the chat session.
*   `packages/core/src/qwen/qwenContentGenerator.ts`: The Qwen-specific content generator that handles API requests.
*   `packages/core/src/core/openaiContentGenerator.ts`: The base class that contains the core logic for interacting with OpenAI-compatible streaming APIs.

## How It Works

1.  **Initiation (`client.ts`)**: The process begins when the `sendMessageStream` method in `GeminiClient` is called. This method is an `async function*`, which means it returns an `AsyncGenerator`. This allows it to `yield` events as they happen.

2.  **Authentication and Request (`qwenContentGenerator.ts`)**: The `sendMessageStream` method calls down to the `generateContentStream` method in `QwenContentGenerator`. This class is responsible for:
    *   Ensuring a valid authentication token is available (including refreshing it if necessary).
    *   Calling the underlying `generateContentStream` method from its parent class, `OpenAIContentGenerator`.

3.  **Core Streaming Logic (`openaiContentGenerator.ts`)**: The `OpenAIContentGenerator` (which is not shown here but is the parent class) contains the core logic for handling the stream. It makes the actual `fetch` request to the Qwen API with the `stream: true` parameter. It then processes the `text/event-stream` response, parsing each chunk of data as it arrives.

4.  **Yielding Events**: As the `OpenAIContentGenerator` receives and parses chunks from the stream, it yields them back up the call stack. The `sendMessageStream` method in `GeminiClient` receives these events and can yield them further to the UI or other parts of the application.

## Key Code Snippets

### `client.ts`

The `sendMessageStream` method shows the high-level async generator pattern:

```typescript
// In packages/core/src/core/client.ts

async *sendMessageStream(
  request: PartListUnion,
  signal: AbortSignal,
  // ...
): AsyncGenerator<ServerGeminiStreamEvent, Turn> {
  // ...
  const resultStream = turn.run(request, signal);
  for await (const event of resultStream) {
    yield event;
  }
  // ...
}
```

### `qwenContentGenerator.ts`

The `generateContentStream` method shows how the authentication is handled before passing the request to the core streaming logic:

```typescript
// In packages/core/src/qwen/qwenContentGenerator.ts

async generateContentStream(
  request: GenerateContentParameters,
  userPromptId: string,
): Promise<AsyncGenerator<GenerateContentResponse>> {
  return this.withValidTokenForStream(async (token) => {
    // ...
    return await super.generateContentStream(request, userPromptId);
  });
}
```

This layered approach separates the concerns of session management, authentication, and the low-level details of handling a `text/event-stream`, resulting in a clean and maintainable implementation.