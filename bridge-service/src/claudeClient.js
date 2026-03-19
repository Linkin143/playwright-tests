require('dotenv').config();

let anthropic = null;
let Anthropic = null;

async function initialize() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('⚠️  ANTHROPIC_API_KEY not found in environment variables');
    console.log('⚠️  Claude AI integration disabled. Tests will still run and commit to Git.');
    return false;
  }

  if (process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
    console.log('⚠️  ANTHROPIC_API_KEY is not configured');
    console.log('⚠️  Claude AI integration disabled. Tests will still run and commit to Git.');
    return false;
  }

  try {
    if (!Anthropic) {
      const module = await import('@anthropic-ai/sdk');
      Anthropic = module.default;
    }
    
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    console.log('✅ Claude AI client initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Claude AI client:', error.message);
    return false;
  }
}

async function sendResults(testData) {
  if (!anthropic) {
    const initialized = await initialize();
    if (!initialized) {
      console.log('⚠️  Skipping Claude AI notification (API key not configured)');
      return null;
    }
  }

  if (!anthropic) {
    console.log('⚠️  Anthropic client not initialized, skipping notification');
    return null;
  }

  try {
    console.log('\n📤 Sending results to Claude AI...');

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Test execution completed:

File: ${testData.fileName}
Status: ${testData.status}
Duration: ${testData.duration}ms
Timestamp: ${testData.timestamp}
${testData.error ? `Error: ${testData.error}` : ''}

${testData.status === 'PASSED' 
  ? '✅ Test passed successfully! The test has been committed to GitHub.' 
  : '❌ Test failed. Please review the error and make necessary corrections.'}
`
      }]
    });

    console.log('✅ Results sent to Claude AI');
    console.log('💬 Claude response:', message.content[0].text);

    return message.content[0].text;

  } catch (error) {
    console.error('❌ Error communicating with Claude:', error.message);
    if (error.status) {
      console.error(`   Status: ${error.status}`);
    }
    return null;
  }
}

module.exports = { sendResults, initialize };