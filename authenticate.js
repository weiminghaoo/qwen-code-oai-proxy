#!/usr/bin/env node

const { QwenAuthManager } = require('./src/qwen/auth.js');

async function authenticate() {
  console.log('Starting Qwen authentication flow...');
  
  try {
    const authManager = new QwenAuthManager();
    
    // Initiate device flow
    console.log('Initiating device flow...');
    const deviceFlow = await authManager.initiateDeviceFlow();
    
    // Display verification URI and user code
    console.log('\nPlease visit the following URL to authenticate:');
    console.log(deviceFlow.verification_uri_complete);
    console.log('\nOr visit:', deviceFlow.verification_uri);
    console.log('And enter the code:', deviceFlow.user_code);
    
    // Poll for token
    console.log('\nWaiting for authentication...');
    const token = await authManager.pollForToken(deviceFlow.device_code, deviceFlow.code_verifier);
    
    console.log('\nAuthentication successful!');
    console.log('Access token saved to ~/.qwen/oauth_creds.json');
    console.log('\nYou can now start the proxy server with: npm start');
  } catch (error) {
    console.error('Authentication failed:', error.message);
    process.exit(1);
  }
}

authenticate();