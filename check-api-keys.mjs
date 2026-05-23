import fetch from 'node-fetch';

const API_KEYS = [
  { name: 'PDF_CHAT', key: 'AIzaSyDtWGW30z_EGA8b6fZRSQJOAtvyGLTcJ7o' },
  { name: 'PODCAST_1', key: 'AIzaSyAbB4a-l4-HWel-mS3wrD41ogth_Y6L3JA' },
  { name: 'PODCAST_2', key: 'AIzaSyAPDeI3wGRXwT_tVoGnl2vcf-ogh4raMEU' }
];

async function testGeminiApiKey(name, apiKey) {
  console.log(`\n🔍 Testing ${name}: ${apiKey.substring(0, 15)}...`);
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Say "OK" in one word.' }]
        }]
      })
    });

    const responseText = await response.text();
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response text';
      console.log(`✅ ${name}: WORKING - Response: "${generatedText.trim()}"`);
      return { name, status: 'working', response: generatedText.trim() };
    } else {
      console.log(`❌ ${name}: ERROR ${response.status}`);
      console.log(`Response: ${responseText}`);
      
      let errorType = 'unknown';
      if (response.status === 401) {
        errorType = 'unauthorized';
        console.log(`🔑 ${name}: Invalid or expired API key`);
      } else if (response.status === 403) {
        errorType = 'forbidden';
        console.log(`🚫 ${name}: API access forbidden`);
      } else if (response.status === 429) {
        errorType = 'quota_exceeded';
        console.log(`💸 ${name}: Quota exceeded or rate limited`);
      } else if (response.status === 400) {
        errorType = 'bad_request';
        console.log(`⚠️ ${name}: Bad request`);
      }
      
      return { name, status: 'error', errorType, statusCode: response.status, response: responseText };
    }
  } catch (error) {
    console.log(`❌ ${name}: NETWORK ERROR - ${error.message}`);
    return { name, status: 'network_error', error: error.message };
  }
}

async function checkAllKeys() {
  console.log('🚀 Checking Gemini API Keys Status...');
  console.log('='.repeat(50));
  
  const results = [];
  
  for (const { name, key } of API_KEYS) {
    const result = await testGeminiApiKey(name, key);
    results.push(result);
    
    // Wait 1 second between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 SUMMARY:');
  console.log('='.repeat(50));
  
  let workingCount = 0;
  let quotaExhaustedCount = 0;
  let errorCount = 0;
  
  results.forEach(result => {
    if (result.status === 'working') {
      workingCount++;
    } else if (result.errorType === 'quota_exceeded') {
      quotaExhaustedCount++;
    } else {
      errorCount++;
    }
  });
  
  console.log(`✅ Working: ${workingCount}/${API_KEYS.length}`);
  console.log(`💸 Quota Exhausted: ${quotaExhaustedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  
  if (workingCount === 0) {
    console.log('\n🚨 CRITICAL: No working API keys! All functionality will be broken.');
    console.log('🔧 Action needed: Get new API keys from https://aistudio.google.com/');
  } else if (quotaExhaustedCount > 0) {
    console.log('\n⚠️ WARNING: Some API keys have exhausted their quota');
    console.log(`🎯 Recommendation: ${workingCount} key(s) still working, but may need additional keys`);
  } else {
    console.log('\n🎉 SUCCESS: All API keys are working properly!');
  }
  
  return results;
}

checkAllKeys().catch(console.error);