const path = require('path');
const { promises: fs } = require('fs');

// File System Configuration
const QWEN_DIR = '.qwen';
const QWEN_CREDENTIAL_FILENAME = 'oauth_creds.json';

class QwenAuthManager {
  constructor() {
    this.credentialsPath = path.join(process.env.HOME || process.env.USERPROFILE, QWEN_DIR, QWEN_CREDENTIAL_FILENAME);
  }

  async loadCredentials() {
    try {
      console.log(`Loading credentials from: ${this.credentialsPath}`);
      const credentialsData = await fs.readFile(this.credentialsPath, 'utf8');
      const credentials = JSON.parse(credentialsData);
      console.log('Credentials loaded successfully');
      return credentials;
    } catch (error) {
      // File doesn't exist or is invalid
      console.error('Error loading credentials:', error.message);
      return null;
    }
  }

  async getValidAccessToken() {
    try {
      // Try to load existing credentials
      const credentials = await this.loadCredentials();
      
      if (!credentials) {
        throw new Error('No credentials found. Please authenticate with Qwen first.');
      }
      
      // Check if token exists
      if (credentials.access_token) {
        console.log('Access token found in credentials');
        return credentials.access_token;
      }
      
      throw new Error('No access token found in credentials.');
    } catch (error) {
      // Re-throw the error
      console.error('Error getting valid access token:', error.message);
      throw error;
    }
  }
}

module.exports = { QwenAuthManager };