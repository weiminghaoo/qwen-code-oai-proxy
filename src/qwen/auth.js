const path = require('path');
const { promises: fs } = require('fs');
const { fetch } = require('undici');

// File System Configuration
const QWEN_DIR = '.qwen';
const QWEN_CREDENTIAL_FILENAME = 'oauth_creds.json';

// OAuth Configuration (from qwen-code analysis)
const QWEN_OAUTH_BASE_URL = 'https://chat.qwen.ai';
const QWEN_OAUTH_TOKEN_ENDPOINT = `${QWEN_OAUTH_BASE_URL}/api/v1/oauth2/token`;
const QWEN_OAUTH_CLIENT_ID = 'f0304373b74a44d2b584a3fb70ca9e56';
const TOKEN_REFRESH_BUFFER_MS = 30 * 1000; // 30 seconds

class QwenAuthManager {
  constructor() {
    this.credentialsPath = path.join(process.env.HOME || process.env.USERPROFILE, QWEN_DIR, QWEN_CREDENTIAL_FILENAME);
    this.credentials = null;
  }

  async loadCredentials() {
    if (this.credentials) {
      return this.credentials;
    }
    try {
      console.log(`Loading credentials from: ${this.credentialsPath}`);
      const credentialsData = await fs.readFile(this.credentialsPath, 'utf8');
      this.credentials = JSON.parse(credentialsData);
      console.log('Credentials loaded successfully');
      return this.credentials;
    } catch (error) {
      console.error('Error loading credentials:', error.message);
      return null;
    }
  }

  async saveCredentials(credentials) {
    try {
      const credString = JSON.stringify(credentials, null, 2);
      await fs.writeFile(this.credentialsPath, credString);
      this.credentials = credentials;
      console.log('Credentials saved successfully.');
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
    if (!credentials || !credentials.refresh_token) {
      throw new Error('No refresh token available. Please re-authenticate with the Qwen CLI.');
    }

    console.log('Access token expired or invalid, attempting to refresh...');
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
      };

      await this.saveCredentials(newCredentials);
      console.log('Access token refreshed and saved successfully.');
      return newCredentials;
    } catch (error) {
      console.error('An error occurred during token refresh:', error.message);
      // If refresh fails, the user likely needs to re-auth completely.
      throw new Error('Failed to refresh access token. Please re-authenticate with the Qwen CLI.');
    }
  }

  async getValidAccessToken() {
    let credentials = await this.loadCredentials();

    if (!credentials) {
      throw new Error('No credentials found. Please authenticate with Qwen CLI first.');
    }

    if (this.isTokenValid(credentials)) {
      console.log('Existing access token is valid.');
      return credentials.access_token;
    }

    const newCredentials = await this.refreshAccessToken(credentials);
    return newCredentials.access_token;
  }
}

module.exports = { QwenAuthManager };