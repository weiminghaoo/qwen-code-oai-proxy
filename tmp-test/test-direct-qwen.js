const axios = require('axios');

async function testDirectQwen() {
  console.log('Testing direct Qwen API call...');
  
  try {
    // Read credentials
    const fs = require('fs');
    const path = require('path');
    const credsPath = path.join(process.env.HOME, '.qwen', 'oauth_creds.json');
    const credentials = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    
    // Get API endpoint
    let endpoint = credentials.resource_url || 'dashscope.aliyuncs.com/compatible-mode/v1';
    if (!endpoint.startsWith('http')) {
      endpoint = 'https://' + endpoint;
    }
    if (!endpoint.endsWith('/v1')) {
      endpoint = endpoint.endsWith('/') ? endpoint + 'v1' : endpoint + '/v1';
    }
    
    console.log('API Endpoint:', endpoint);
    
    // Make a simple API call
    const response = await axios.post(
      `${endpoint}/chat/completions`,
      {
        model: 'qwen3-coder-plus',
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        max_tokens: 100
      },
      {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Success! Response:', response.data.choices[0].message.content);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testDirectQwen();