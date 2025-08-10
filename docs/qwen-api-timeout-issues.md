# Qwen API Timeout and Streaming Issues

## Overview

This document analyzes potential timeout and streaming issues that may occur when using the Qwen API through the OpenAI-compatible proxy. The information is based on analysis of both the proxy implementation and the qwen-code CLI tool source code.

## Known Issues

### 504 Gateway Timeout Errors

The error message you've encountered:
```
API Error (500 {"error":{"message":"Error from provider: {\"error\":{\"message\":\"Qwen API error: 504 \\\"stream timeout\\\"\",\"type\":\"internal_server_error\"}}Error: Error from provider: {\"error\":{\"message\":\"Qwen API error: 504 \\\"stream timeout\\\"\",\"type\":\"internal_server_error\"}}
```

This indicates that the Qwen API is experiencing timeout issues on their backend, particularly during streaming operations.

## Root Cause Analysis

Based on the source code analysis:

1. **Timeout Configuration**: The proxy sets a 5-minute timeout for API requests (300,000 ms) in both chat completions and embeddings endpoints.

2. **Streaming Complexity**: Streaming responses require maintaining long-lived connections, which are more susceptible to network interruptions and server-side timeouts.

3. **Qwen API Backend**: The 504 "stream timeout" error originates from Qwen's infrastructure, suggesting that their streaming endpoint has internal timeout limits.

## Error Handling in qwen-code

The qwen-code CLI tool has robust timeout handling:

1. **Timeout Detection**: The `OpenAIContentGenerator` class has comprehensive timeout detection that identifies various timeout indicators:
   - "timeout" in error message
   - "timed out" in error message
   - "connection timeout" in error message
   - ETIMEDOUT error codes
   - ESOCKETTIMEDOUT error codes

2. **Helpful Error Messages**: When timeouts occur, the system provides troubleshooting tips:
   - Reduce input length or complexity
   - Increase timeout configuration
   - Check network connectivity
   - Consider using non-streaming mode

3. **Streaming-Specific Handling**: Special handling for streaming timeouts with different troubleshooting guidance.

## Recommendations

### For Proxy Users

1. **Reduce Input Size**: Large prompts are more likely to trigger timeouts. Try breaking large requests into smaller chunks.

2. **Check Network Connectivity**: Ensure stable internet connection, especially for streaming requests.

3. **Retry Logic**: Implement client-side retry logic for transient timeout errors.

### For Proxy Configuration

1. **Adjust Timeout Settings**: Consider increasing the timeout value in the axios requests if your use case requires longer processing times.

2. **Better Error Handling**: Implement more specific handling for 504 errors to provide better user feedback.

3. **Streaming Fallback**: Consider implementing fallback logic that switches from streaming to non-streaming mode when timeouts occur.

## Implementation Notes

The current proxy implementation in `src/qwen/api.js` has basic error handling that captures HTTP status codes and error responses. However, it could be enhanced to:

1. Specifically detect and handle 504 Gateway Timeout errors
2. Provide more informative error messages to users
3. Implement retry logic for transient timeout issues
4. Add configuration options for timeout values

## Conclusion

The 504 "stream timeout" errors are server-side issues from Qwen's API infrastructure. While the proxy cannot prevent these errors, it can be enhanced to handle them more gracefully and provide better guidance to users on how to work around them.