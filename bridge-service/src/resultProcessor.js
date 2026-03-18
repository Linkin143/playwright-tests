const fs = require('fs').promises;
const claudeClient = require('./claudeClient');
const gitManager = require('./gitManager');

async function process(fileName, PATHS) {
  try {
    console.log(`\n📊 Processing results for: ${fileName}`);

    const resultsExist = await fs.access(PATHS.results).then(() => true).catch(() => false);
    
    if (!resultsExist) {
      console.log('⚠️  No results file found yet');
      return;
    }

    const resultsData = await fs.readFile(PATHS.results, 'utf-8');
    const results = JSON.parse(resultsData);

    const testSuite = results.suites?.[0];
    const testSpec = testSuite?.specs?.[0];
    const testResult = testSpec?.tests?.[0]?.results?.[0];

    const status = testResult?.status === 'passed' ? 'PASSED' : 'FAILED';
    const duration = testResult?.duration || 0;
    const error = testResult?.error?.message || null;

    console.log(`\n📈 Test Results:`);
    console.log(`   File: ${fileName}`);
    console.log(`   Status: ${status}`);
    console.log(`   Duration: ${duration}ms`);
    if (error) {
      console.log(`   Error: ${error}`);
    }

    const testData = {
      fileName,
      status,
      duration,
      error,
      timestamp: new Date().toISOString()
    };

    await claudeClient.sendResults(testData);

    if (status === 'PASSED') {
      await gitManager.pushToGitHub(fileName, status, PATHS);
    } else {
      console.log('\n⚠️  Test failed - skipping Git commit');
    }

  } catch (error) {
    console.error('❌ Error processing results:', error);
  }
}

module.exports = { process };