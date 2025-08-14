const { DebugLogger } = require('./src/utils/logger.js');

async function testLogger() {
  const logger = new DebugLogger();
  
  // Test logging with a mock request object
  const mockRequest = {
    method: 'POST',
    url: '/v1/chat/completions',
    headers: {
      'content-type': 'application/json',
      'authorization': 'Bearer token123'
    },
    body: {
      model: 'qwen3-coder-plus',
      messages: [{ role: 'user', content: 'Hello' }]
    },
    query: {}
  };
  
  const mockResponse = {
    id: 'chatcmpl-123',
    choices: [{
      message: { role: 'assistant', content: 'Hello! How can I help you today?' }
    }]
  };
  
  // Test logging
  await logger.logApiCall('/v1/chat/completions', mockRequest, mockResponse);
  
  console.log('Logger test completed');
}

testLogger().catch(console.error);