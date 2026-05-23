// Test script to check Gemini API key status
import { GoogleGenerativeAI } from '@google/generative-ai';

// Read API keys from environment
const apiKeys = [
  {
    name: 'VITE_PDF_CHAT_GEMINI_API',
    key: process.env.VITE_PDF_CHAT_GEMINI_API || import.meta.env.VITE_PDF_CHAT_GEMINI_API
  },
  {
    name: 'VITE_PODCAST_GEMINI_API',
    key: process.env.VITE_PODCAST_GEMINI_API || import.meta.env.VITE_PODCAST_GEMINI_API
  },
  {
    name: 'VITE_PODCAST_GEMINI_API_2',
    key: process.env.VITE_PODCAST_GEMINI_API_2 || import.meta.env.VITE_PODCAST_GEMINI_API_2
  }
];

async function testApiKey(name, key) {
  if (!key) {
    console.log(`❌ ${name}: No API key provided`);
    return { name, status: 'missing', error: 'No API key configured' };
  }

  try {
    console.log(`🔍 Testing ${name}: ${key.substring(0, 10)}...${key.substring(key.length - 4)}`);
    
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Send a simple test request
    const prompt = "Say 'Hello' in one word.";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log(`✅ ${name}: Working - Response: "${text.trim()}"`);
    return { name, status: 'working', response: text.trim() };

  } catch (error) {
    console.error(`❌ ${name}: Error -`, error.message);
    
    // Check for specific error types
    let errorType = 'unknown';
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      errorType = 'unauthorized';
    } else if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('rate limit')) {
      errorType = 'quota_exceeded';
    } else if (error.message.includes('403')) {
      errorType = 'forbidden';
    }

    return { name, status: 'error', error: error.message, errorType };
  }
}

async function checkAllApiKeys() {
  console.log('🔍 Checking Gemini API Key Status...\n');
  
  const results = [];
  
  for (const { name, key } of apiKeys) {
    const result = await testApiKey(name, key);
    results.push(result);
    console.log(''); // Add spacing between tests
  }

  console.log('📊 Summary:');
  console.log('='.repeat(50));
  
  let workingCount = 0;
  let quotaExhaustedCount = 0;
  let errorCount = 0;
  
  results.forEach(result => {
    if (result.status === 'working') {
      console.log(`✅ ${result.name}: WORKING`);
      workingCount++;
    } else if (result.status === 'missing') {
      console.log(`❓ ${result.name}: NOT CONFIGURED`);
      errorCount++;
    } else if (result.errorType === 'quota_exceeded') {
      console.log(`💸 ${result.name}: QUOTA EXCEEDED`);
      quotaExhaustedCount++;
    } else if (result.errorType === 'unauthorized') {
      console.log(`🔑 ${result.name}: INVALID/EXPIRED`);
      errorCount++;
    } else {
      console.log(`❌ ${result.name}: ERROR - ${result.error}`);
      errorCount++;
    }
  });

  console.log('\n📈 Status:');
  console.log(`Working APIs: ${workingCount}/${apiKeys.length}`);
  console.log(`Quota Exhausted: ${quotaExhaustedCount}`);
  console.log(`Errors: ${errorCount}`);
  
  if (workingCount === 0) {
    console.log('\n🚨 CRITICAL: No working API keys available!');
  } else if (quotaExhaustedCount > 0) {
    console.log('\n⚠️ WARNING: Some API keys have exhausted their quota');
  } else {
    console.log('\n🎉 All configured API keys are working properly');
  }

  return results;
}

// Export for use in other modules
export { checkAllApiKeys, testApiKey };