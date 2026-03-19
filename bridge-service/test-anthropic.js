require('dotenv').config();

async function test() {
  console.log('Testing Anthropic API...');
  console.log('API Key:', process.env.ANTHROPIC_API_KEY ? 'Found (length: ' + process.env.ANTHROPIC_API_KEY.length + ')' : 'Missing');
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not found in .env file');
    return;
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: "Say 'API key is working!'"
      }],
    });

    console.log('✅ Success!');
    console.log('Response:', msg.content[0].text);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

test();