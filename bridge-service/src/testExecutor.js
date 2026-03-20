const { exec } = require('child_process');
const path = require('path');
const resultProcessor = require('./resultProcessor');

function execute(fileName, PATHS) {
  return new Promise((resolve, reject) => {
    const projectRoot = path.join(__dirname, '../..');
    const command = `npx playwright test ${fileName} --headed --project=chromium`;

    console.log(`\n🚀 Executing test: ${fileName}`);
    console.log(`📂 Working directory: ${projectRoot}`);
    console.log(`🎭 Running in HEADED mode - browser will be visible`);

    const childProcess = exec(command, { 
      cwd: projectRoot,
      maxBuffer: 10 * 1024 * 1024
    }, async (error, stdout, stderr) => {
      
      console.log('\n📋 Test Output:');
      if (stdout) {
        console.log(stdout);
      }

      if (stderr && !stderr.includes('DeprecationWarning')) {
        console.log('⚠️  Errors/Warnings:');
        console.log(stderr);
      }

      console.log('\n✅ Test execution completed');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await resultProcessor.process(fileName, PATHS);
      resolve();
    });

    childProcess.on('error', (error) => {
      console.error('❌ Child process error:', error);
      reject(error);
    });
  });
}

module.exports = { execute };