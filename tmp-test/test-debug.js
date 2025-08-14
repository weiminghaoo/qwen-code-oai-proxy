const OpenAI = require('openai');

async function testDebug() {
  console.log('Testing with a simpler request...');
  
  // Create OpenAI client pointing to our proxy
  const openai = new OpenAI({
    apiKey: 'fake-api-key',
    baseURL: 'http://localhost:8080/v1'
  });
  
  try {
    // Test with a much simpler request
    const chatCompletion = await openai.chat.completions.create({
      model: 'qwen3-coder-plus',
      messages: [
        {"role": "user", "content": "Hello"}
      ],
      max_tokens: 100 // Much smaller than 32000
    });
    
    console.log('Success! Response:', chatCompletion.choices[0].message.content);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testDebug();