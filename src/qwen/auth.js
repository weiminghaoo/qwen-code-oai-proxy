const path = require('path');
const { promises: fs } = require('fs');
const { fetch } = require('undici');
const crypto = require('crypto');
const open = require('open');
const qrcode = require('qrcode-terminal');

// File System Configuration
const QWEN_DIR = '.qwen';
const QWEN_CREDENTIAL_FILENAME = 'oauth_creds.json';

// OAuth Configuration (from qwen-code analysis)
const QWEN_OAUTH_BASE_URL = 'https://chat.qwen.ai';
const QWEN_OAUTH_DEVICE_CODE_ENDPOINT = `${QWEN_OAUTH_BASE_URL}/api/v1/oauth2/device/code`;
const QWEN_OAUTH_TOKEN_ENDPOINT = `${QWEN_OAUTH_BASE_URL}/api/v1/oauth2/token`;
const QWEN_OAUTH_CLIENT_ID = 'f0304373b74a44d2b584a3fb70ca9e56';
const QWEN_OAUTH_SCOPE = 'openid profile email model.completion';
const QWEN_OAUTH_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:device_code';
const TOKEN_REFRESH_BUFFER_MS = 30 * 1000; // 30 seconds

/**
 * Generate a random code verifier for PKCE
 * @returns A random string of 43-128 characters
 */
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate a code challenge from a code verifier using SHA-256
 * @param codeVerifier The code verifier string
 * @returns The code challenge string
 */
function generateCodeChallenge(codeVerifier) {
  const hash = crypto.createHash('sha256');
  hash.update(codeVerifier);
  return hash.digest('base64url');
}

/**
 * Generate PKCE code verifier and challenge pair
 * @returns Object containing code_verifier and code_challenge
 */
function generatePKCEPair() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  return { code_verifier: codeVerifier, code_challenge: codeChallenge };
}

class QwenAuthManager {
  constructor() {
    this.credentialsPath = path.join(process.env.HOME || process.env.USERPROFILE, QWEN_DIR, QWEN_CREDENTIAL_FILENAME);
    this.credentials = null;
    this.refreshPromise = null;
  }

  async loadCredentials() {
    if (this.credentials) {
      return this.credentials;
    }
    try {
      const credentialsData = await fs.readFile(this.credentialsPath, 'utf8');
      this.credentials = JSON.parse(credentialsData);
      return this.credentials;
    } catch (error) {
      return null;
    }
  }

  async saveCredentials(credentials) {
    try {
      const credString = JSON.stringify(credentials, null, 2);
      await fs.writeFile(this.credentialsPath, credString);
      this.credentials = credentials;
    } catch (error) {
      console.error('Error saving credentials:', error.message);
    }
  }

  isTokenValid(credentials) {
    if (!credentials || !credentials.expiry_date) {
      return false;
    }
    return Date.now() < credentials.expiry_date - TOKEN_REFRESH_BUFFER_MS;
  }

  async refreshAccessToken(credentials) {
    console.log('\x1b[33m%s\x1b[0m', 'Refreshing Qwen access token...');
    
    if (!credentials || !credentials.refresh_token) {
      throw new Error('No refresh token available. Please re-authenticate with the Qwen CLI.');
    }

    const bodyData = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: credentials.refresh_token,
      client_id: QWEN_OAUTH_CLIENT_ID,
    });

    try {
      const response = await fetch(QWEN_OAUTH_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: bodyData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Token refresh failed: ${errorData.error} - ${errorData.error_description}`);
      }

      const tokenData = await response.json();
      const newCredentials = {
        ...credentials,
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        refresh_token: tokenData.refresh_token || credentials.refresh_token,
        expiry_date: Date.now() + tokenData.expires_in * 1000,
      }

      await this.saveCredentials(newCredentials);
      console.log('\x1b[32m%s\x1b[0m', 'Qwen access token refreshed successfully');
      return newCredentials;
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', 'Failed to refresh Qwen access token');
      // If refresh fails, the user likely needs to re-auth completely.
      throw new Error('Failed to refresh access token. Please re-authenticate with the Qwen CLI.');
    }
  }

  async getValidAccessToken() {
    // If there's already a refresh in progress, wait for it
    if (this.refreshPromise) {
      console.log('\x1b[36m%s\x1b[0m', 'Waiting for ongoing token refresh...');
      return this.refreshPromise;
    }

    try {
      let credentials = await this.loadCredentials();

      if (!credentials) {
        throw new Error('No credentials found. Please authenticate with Qwen CLI first.');
      }

      // Check if token is valid
      if (this.isTokenValid(credentials)) {
        console.log('\x1b[32m%s\x1b[0m', 'Using valid Qwen access token');
        return credentials.access_token;
      } else {
        console.log('\x1b[33m%s\x1b[0m', 'Qwen access token expired or expiring soon, refreshing...');
      }

      // Token needs refresh, start refresh operation
      this.refreshPromise = this.performTokenRefresh(credentials);
      
      try {
        const newCredentials = await this.refreshPromise;
        return newCredentials.access_token;
      } finally {
        this.refreshPromise = null;
      }
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  async performTokenRefresh(credentials) {
    try {
      const newCredentials = await this.refreshAccessToken(credentials);
      return newCredentials;
    } catch (error) {
      throw new Error(`${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async initiateDeviceFlow() {
    // Generate PKCE code verifier and challenge
    const { code_verifier, code_challenge } = generatePKCEPair();

    const bodyData = new URLSearchParams({
      client_id: QWEN_OAUTH_CLIENT_ID,
      scope: QWEN_OAUTH_SCOPE,
      code_challenge: code_challenge,
      code_challenge_method: 'S256',
    });

    try {
      const response = await fetch(QWEN_OAUTH_DEVICE_CODE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: bodyData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Device authorization failed: ${response.status} ${response.statusText}. Response: ${errorData}`);
      }

      const result = await response.json();
      
      // Check if the response indicates success
      if (!result.device_code) {
        throw new Error(`Device authorization failed: ${result.error || 'Unknown error'} - ${result.error_description || 'No details provided'}`);
      }

      // Add the code_verifier to the result so it can be used later for polling
      return {
        ...result,
        code_verifier: code_verifier
      };
    } catch (error) {
      console.error('Device authorization flow failed:', error.message);
      throw error;
    }
  }

  async pollForToken(device_code, code_verifier) {
    let pollInterval = 5000; // 5 seconds
    const maxAttempts = 60; // 5 minutes max

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const bodyData = new URLSearchParams({
        grant_type: QWEN_OAUTH_GRANT_TYPE,
        client_id: QWEN_OAUTH_CLIENT_ID,
        device_code: device_code,
        code_verifier: code_verifier,
      });

      try {
        const response = await fetch(QWEN_OAUTH_TOKEN_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: bodyData,
        });

        if (!response.ok) {
          // Parse the response as JSON to check for OAuth RFC 8628 standard errors
          try {
            const errorData = await response.json();

            // According to OAuth RFC 8628, handle standard polling responses
            if (response.status === 400 && errorData.error === 'authorization_pending') {
              // User has not yet approved the authorization request. Continue polling.
              console.log(`Polling attempt ${attempt + 1}/${maxAttempts}...`);
              await new Promise(resolve => setTimeout(resolve, pollInterval));
              continue;
            }

            if (response.status === 400 && errorData.error === 'slow_down') {
              // Client is polling too frequently. Increase poll interval.
              pollInterval = Math.min(pollInterval * 1.5, 10000); // Increase by 50%, max 10 seconds
              console.log(`Server requested to slow down, increasing poll interval to ${pollInterval}ms`);
              await new Promise(resolve => setTimeout(resolve, pollInterval));
              continue;
            }

            if (response.status === 400 && errorData.error === 'expired_token') {
              throw new Error('Device code expired. Please restart the authentication process.');
            }

            if (response.status === 400 && errorData.error === 'access_denied') {
              throw new Error('Authorization denied by user. Please restart the authentication process.');
            }

            // For other errors, throw with proper error information
            throw new Error(`Device token poll failed: ${errorData.error || 'Unknown error'} - ${errorData.error_description || 'No details provided'}`);
          } catch (_parseError) {
            // If JSON parsing fails, fall back to text response
            const errorData = await response.text();
            throw new Error(`Device token poll failed: ${response.status} ${response.statusText}. Response: ${errorData}`);
          }
        }

        const tokenData = await response.json();
        
        // Convert to QwenCredentials format and save
        const credentials = {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || undefined,
          token_type: tokenData.token_type,
          expiry_date: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : undefined,
        };

        await this.saveCredentials(credentials);
        
        return credentials;
      } catch (error) {
        // Handle specific error cases
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // If we get a specific OAuth error that should stop polling, throw it
        if (errorMessage.includes('expired_token') || 
            errorMessage.includes('access_denied') || 
            errorMessage.includes('Device authorization failed')) {
          throw error;
        }
        
        // For other errors, continue polling
        console.log(`Polling attempt ${attempt + 1}/${maxAttempts} failed:`, errorMessage);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error('Authentication timeout. Please restart the authentication process.');
  }
}

module.exports = { QwenAuthManager };