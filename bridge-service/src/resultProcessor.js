const fs = require('fs').promises;
const path = require('path');
const claudeClient = require('./claudeClient');
const gitManager = require('./gitManager');

async function process(fileName, PATHS) {
  try {
    console.log(`\n📊 Processing results for: ${fileName}`);

    await new Promise(resolve => setTimeout(resolve, 3000));

    const resultsExist = await fs.access(PATHS.results).then(() => true).catch(() => false);
    
    if (!resultsExist) {
      console.error('❌ Results file not found at:', PATHS.results);
      console.error('   Test may have failed to execute properly');
      return;
    }

    const resultsData = await fs.readFile(PATHS.results, 'utf-8');
    
    if (!resultsData || resultsData.trim() === '') {
      console.error('❌ Results file is empty');
      console.error('   Test may have crashed or not generated output');
      return;
    }

    let results;
    try {
      results = JSON.parse(resultsData);
    } catch (parseError) {
      console.error('❌ Invalid JSON in results file');
      console.error('   Parse error:', parseError.message);
      return;
    }

    console.log('🔍 Debugging JSON structure...');
    console.log('   Has suites?', !!results.suites);
    console.log('   Suites length:', results.suites?.length);
    
    let testResult = null;
    let status = 'UNKNOWN';
    let duration = 0;
    let error = null;

    if (results.suites && results.suites.length > 0) {
      for (const suite of results.suites) {
        if (suite.specs && suite.specs.length > 0) {
          for (const spec of suite.specs) {
            if (spec.tests && spec.tests.length > 0) {
              for (const test of spec.tests) {
                if (test.results && test.results.length > 0) {
                  testResult = test.results[0];
                  status = testResult.status === 'passed' ? 'PASSED' : 'FAILED';
                  duration = testResult.duration || 0;
                  error = testResult.error?.message || null;
                  break;
                }
              }
              if (testResult) break;
            }
          }
          if (testResult) break;
        }
      }
    }

    if (!testResult) {
      console.log('⚠️  Could not find test results in standard structure');
      console.log('   Checking alternative formats...');
      
      if (results.stats) {
        const passed = results.stats.expected || 0;
        const failed = results.stats.unexpected || 0;
        
        if (passed > 0 && failed === 0) {
          status = 'PASSED';
          duration = results.stats.duration || 0;
        } else if (failed > 0) {
          status = 'FAILED';
          duration = results.stats.duration || 0;
          error = 'Test failed - check console output';
        }
      }
      
      if (status === 'UNKNOWN') {
        console.error('❌ Unable to determine test status');
        console.error('   Full JSON structure:');
        console.error(JSON.stringify(results, null, 2));
        return;
      }
    }

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
      console.log('\n✅ Test PASSED - proceeding with Git commit and push');
      await gitManager.pushToGitHub(fileName, status, PATHS);
    } else {
      console.log('\n❌ Test FAILED - skipping Git commit and push');
      console.log('   Failed test remains local only in tests/ folder');
      console.log('   Review and fix the test, then resubmit');
    }

  } catch (error) {
    console.error('❌ Error processing results:', error.message);
    console.error('   Stack:', error.stack);
  }
}

module.exports = { process };