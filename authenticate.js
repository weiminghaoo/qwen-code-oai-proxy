#!/usr/bin/env node

const { QwenAuthManager } = require('./src/qwen/auth.js');
const qrcode = require('qrcode-terminal');
const open = require('open');

async function authenticate() {
  console.log('Starting Qwen authentication flow...');
  
  try {
    const authManager = new QwenAuthManager();
    
    // Check if credentials already exist and are valid
    console.log('Checking for existing credentials...');
    const existingCredentials = await authManager.loadCredentials();
    
    if (existingCredentials && authManager.isTokenValid(existingCredentials)) {
      console.log('\n✅ Valid credentials already exist!');
      console.log('Access token is still valid and will be used by the proxy server.');
      console.log('\nYou can start the proxy server with: npm start');
      return;
    }
    
    if (existingCredentials) {
      console.log('Existing credentials found but they are expired or invalid.');
      console.log('Attempting to refresh the access token...');
      
      try {
        const refreshedCredentials = await authManager.refreshAccessToken(existingCredentials);
        console.log('\n✅ Token refreshed successfully!');
        console.log('Access token has been updated and will be used by the proxy server.');
        console.log('\nYou can start the proxy server with: npm start');
        return;
      } catch (refreshError) {
        console.log('Failed to refresh token:', refreshError.message);
        console.log('Proceeding with new authentication flow...');
      }
    }
    
    // Initiate device flow
    console.log('\nInitiating device flow...');
    const deviceFlow = await authManager.initiateDeviceFlow();
    
    // Display verification URI and user code
    console.log('\n=== Qwen OAuth Device Authorization ===');
    console.log('Please visit the following URL to authenticate:');
    console.log(`\n${deviceFlow.verification_uri_complete}\n`);
    
    // Generate and display QR code
    console.log('Or scan the QR code below:');
    qrcode.generate(deviceFlow.verification_uri_complete, { small: true }, (qrCode) => {
      console.log(qrCode);
    });
    
    console.log('User code:', deviceFlow.user_code);
    console.log('(Press Ctrl+C to cancel)');
    
    // Try to open the URL in the browser
    try {
      await open(deviceFlow.verification_uri_complete);
      console.log('\nBrowser opened automatically. If not, please visit the URL above.');
    } catch (openError) {
      console.log('\nPlease visit the URL above in your browser to authenticate.');
    }
    
    // Poll for token
    console.log('\nWaiting for authentication...');
    const token = await authManager.pollForToken(deviceFlow.device_code, deviceFlow.code_verifier);
    
    console.log('\n🎉 Authentication successful!');
    console.log('Access token saved to ~/.qwen/oauth_creds.json');
    console.log('\nYou can now start the proxy server with: npm start');
  } catch (error) {
    console.error('Authentication failed:', error.message);
    process.exit(1);
  }
}

authenticate();