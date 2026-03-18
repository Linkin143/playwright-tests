const { exec } = require('child_process');
const path = require('path');
const resultProcessor = require('./resultProcessor');

function execute(fileName, PATHS) {
  return new Promise((resolve, reject) => {
    const projectRoot = path.join(__dirname, '../..');
    const command = `npx playwright test ${fileName} --reporter=json --headed --project=firefox`;

    console.log(`\n🚀 Executing test: ${fileName}`);
    console.log(`📂 Working directory: ${projectRoot}`);

    const childProcess = exec(command, {
      cwd: projectRoot,
      maxBuffer: 10 * 1024 * 1024
    }, async (error, stdout, stderr) => {

      if (stderr) {
        console.log('⚠️  STDERR:', stderr);
      }

      if (stdout) {
        console.log('📋 STDOUT:', stdout);
      }

      if (error && error.code !== 0 && error.code !== 1) {
        console.error('❌ Execution error:', error);
      }

      console.log('✅ Test execution completed');

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