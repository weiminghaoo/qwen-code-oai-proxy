# Project TODO List

This file tracks the features of the `qwen-code` CLI tool and compares them to the current state of our proxy server, outlining the work that still needs to be done.

## `qwen-code` CLI Features (Reference)

*   **Full OAuth 2.0 Device Flow**: Implements the complete device authorization flow for initial user authentication.
*   **PKCE Security**: Uses Proof Key for Code Exchange (PKCE) for a more secure OAuth flow.
*   **Automatic Token Refresh**: Checks for token expiration before API calls and uses the `refresh_token` to get a new `access_token` automatically.
*   **Streaming and Embedding Support**: Has full support for streaming responses and making embedding requests.
*   **Secure Credential Caching**: Stores credentials securely in `~/.qwen/oauth_creds.json`.
*   **Robust Error Handling**: Handles various OAuth errors, such as expired tokens, rate limiting, and user cancellation.

## Proxy Server - Current State

*   **Credential Loading**: Loads credentials from the `~/.qwen/oauth_creds.json` file.
*   **Access Token Retrieval**: Reads the `access_token` from the loaded credentials.
*   **Basic API Proxy**: Forwards requests to the Qwen API using the retrieved token.
*   **Missing Token Validation**: Does **not** check if the `access_token` is expired.
*   **Missing Token Refresh**: Does **not** have any logic to refresh an expired token.
*   **Missing Streaming and Embeddings**: Does **not** support streaming or embeddings.

## Proxy Server - Needed Features (In Order of Priority)

1.  **Authentication Overhaul**:
    *   **[ ] Implement Token Expiration Check**: Before using the `access_token`, check its `expiry_date` to see if it's still valid.
    *   **[ ] Implement Token Refresh Logic**: If the token is expired or close to expiring, use the `refresh_token` to fetch a new `access_token` from the Qwen OAuth endpoint.
    *   **[ ] Update Credentials File**: After a successful token refresh, update the `~/.qwen/oauth_creds.json` file with the new token information.
    *   **[ ] Add Robust Error Handling**: Handle cases where the token refresh fails (e.g., the refresh token itself has expired).

2.  **Streaming and Embeddings**:
    *   **[ ] Implement Streaming Support**: Add the necessary logic to handle `text/event-stream` responses from the Qwen API and stream them back to the client.
    *   **[ ] Implement Embeddings Endpoint**: Add a `/v1/embeddings` endpoint to the proxy to handle embedding requests.

3.  **First-Time User Experience**:
    *   **[ ] (Optional) Implement Full Device Authorization Flow**: Add endpoints to the proxy to allow users who have not authenticated with the Qwen CLI to do so through the proxy itself.