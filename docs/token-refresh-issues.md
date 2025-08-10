# Token Refresh Issues and Solutions

## Problem Description

The Qwen OpenAI-Compatible Proxy was experiencing intermittent 504 Gateway Timeout errors that would resolve temporarily after restarting the proxy server. This document explains the root cause and the solution.

## Root Cause Analysis

### Current Implementation Issues

1. **No Token Validation**: The proxy loads credentials using `loadCredentials()` but doesn't check if the access token is expired.

2. **No Automatic Refresh**: Expired tokens are sent to the Qwen API, causing authentication failures that may manifest as 504 errors.

3. **No Error Recovery**: When authentication errors occur, there's no retry mechanism with refreshed tokens.

4. **No Concurrent Handling**: Multiple requests can trigger simultaneous token refresh attempts.

### Why Rebooting Fixes the Issue

When the proxy is restarted:
- Fresh credentials are loaded from the file system
- Tokens are likely still valid (if recently refreshed by qwen-code CLI)
- All problematic internal state is cleared
- HTTP connection pools are reset

However, this is only a temporary fix as tokens will eventually expire again.

## How qwen-code CLI Handles Token Refresh

The official qwen-code CLI implements robust token management:

1. **Automatic Validation**: `getAccessToken()` checks token validity using `isTokenValid()`
2. **Proactive Refresh**: Refreshes tokens 30 seconds before expiration
3. **Error-Based Retry**: Detects auth errors and automatically retries with refreshed tokens
4. **Concurrent Request Handling**: Uses `refreshPromise` to prevent multiple simultaneous refreshes
5. **Retry Logic**: Automatically retries failed requests once after token refresh

## Solution Implementation

### Required Changes

1. **Enhanced Auth Manager**: Add `getValidAccessToken()` method that validates and refreshes tokens automatically
2. **Error Detection**: Implement `isAuthError()` to detect authentication-related failures
3. **Retry Logic**: Add automatic retry mechanism for auth errors
4. **Concurrent Handling**: Implement refresh promise management

### Benefits

- Eliminates 504 timeout errors caused by expired tokens
- Improves reliability and user experience
- Aligns with official qwen-code CLI behavior
- Reduces need for manual proxy restarts

## Implementation Plan

1. Update `src/qwen/auth.js` to add token validation and automatic refresh
2. Update `src/qwen/api.js` to use validated tokens and implement retry logic
3. Add proper error handling for authentication failures
4. Test with expired tokens to verify the fix