const axios = require('axios');

// Comprehensive test script to verify temperature parameter is working
async function testTemperature() {
  const proxyUrl = 'http://localhost:8080/v1/chat/completions';
  
  // Test message
  const testMessage = {
    model: "qwen3-coder-plus",
    messages: [
      {
        role: "user",
        content: "Generate a creative random number between 1 and 100. Just give me the number."
      }
    ],
    max_tokens: 10
  };
  
  try {
    console.log('Testing temperature parameter with Qwen proxy...\n');
    
    // Test 1: Low temperature (0.1) - should be more deterministic
    console.log('Test 1: Low temperature (0.1) - Running 3 requests');
    const lowTempResults = [];
    const lowTempRequest = { ...testMessage, temperature: 0.1 };
    
    for (let i = 0; i < 3; i++) {
      const response = await axios.post(proxyUrl, lowTempRequest, {
        headers: { 'Content-Type': 'application/json' }
      });
      const result = response.data.choices[0].message.content.trim();
      lowTempResults.push(result);
      console.log(`  Request ${i+1}: ${result}`);
    }
    console.log(`  Results: [${lowTempResults.join(', ')}]\n`);
    
    // Test 2: High temperature (0.9) - should be more random
    console.log('Test 2: High temperature (0.9) - Running 3 requests');
    const highTempResults = [];
    const highTempRequest = { ...testMessage, temperature: 0.9 };
    
    for (let i = 0; i < 3; i++) {
      const response = await axios.post(proxyUrl, highTempRequest, {
        headers: { 'Content-Type': 'application/json' }
      });
      const result = response.data.choices[0].message.content.trim();
      highTempResults.push(result);
      console.log(`  Request ${i+1}: ${result}`);
    }
    console.log(`  Results: [${highTempResults.join(', ')}]\n`);
    
    // Test 3: Very high temperature (1.5) - should be even more random
    console.log('Test 3: Very high temperature (1.5) - Running 3 requests');
    const veryHighTempResults = [];
    const veryHighTempRequest = { ...testMessage, temperature: 1.5 };
    
    for (let i = 0; i < 3; i++) {
      const response = await axios.post(proxyUrl, veryHighTempRequest, {
        headers: { 'Content-Type': 'application/json' }
      });
      const result = response.data.choices[0].message.content.trim();
      veryHighTempResults.push(result);
      console.log(`  Request ${i+1}: ${result}`);
    }
    console.log(`  Results: [${veryHighTempResults.join(', ')}]\n`);
    
    // Analysis
    console.log('Analysis:');
    console.log('- Low temperature (0.1): Results should be more consistent/repeated');
    console.log('- High temperature (0.9): Results should be more varied');
    console.log('- Very high temperature (1.5): Results should be the most varied/random');
    
    // Check for variability
    const lowTempUnique = [...new Set(lowTempResults)].length;
    const highTempUnique = [...new Set(highTempResults)].length;
    const veryHighTempUnique = [...new Set(veryHighTempResults)].length;
    
    console.log(`\nUniqueness count:`);
    console.log(`- Low temperature: ${lowTempUnique}/3 unique responses`);
    console.log(`- High temperature: ${highTempUnique}/3 unique responses`);
    console.log(`- Very high temperature: ${veryHighTempUnique}/3 unique responses`);
    
    if (highTempUnique > lowTempUnique || veryHighTempUnique > lowTempUnique) {
      console.log('\n✅ Temperature parameter is working! Higher temperatures produce more varied results.');
    } else {
      console.log('\n⚠️  Temperature effect is not clearly visible in this test. This can happen with short responses.');
    }
    
  } catch (error) {
    console.error('Error testing temperature parameter:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testTemperature();