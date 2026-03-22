const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs').promises;
const testExecutor = require('./testExecutor');

function start(PATHS) {
  const watcher = chokidar.watch(PATHS.generatedTests, {
    persistent: true,
    ignoreInitial: true
  });

  watcher.on('add', async (filePath) => {
    console.log(`\n📄 New test file detected: ${path.basename(filePath)}`);

    console.log('⏳ Waiting for file to stabilize (no changes)...');
    await waitForFileStability(filePath, 10000, 30000);

    await processNewTest(filePath, PATHS);
  });

  watcher.on('error', (error) => {
    console.error('❌ File watcher error:', error);
  });

  console.log(`👁️  File watcher started`);
}

async function processNewTest(filePath, PATHS) {
  const fileName = path.basename(filePath);
  const destPath = path.join(PATHS.tests, fileName);

  try {
    await fs.copyFile(filePath, destPath);
    console.log(`✅ Test file copied to: ${destPath}`);

    console.log('⏳ Ensuring file is still stable before execution...');
    await waitForFileStability(destPath, 5000, 15000);

    await testExecutor.execute(fileName, PATHS);

  } catch (error) {
    console.error('❌ Error processing test:', error);
  }
}

// 🔥 Smart stability checker
async function waitForFileStability(filePath, checkInterval = 5000, stableDuration = 30000) {
  let lastSize = -1;
  let stableTime = 0;

  while (true) {
    try {
      const stats = await fs.stat(filePath);
      const currentSize = stats.size;

      if (currentSize === lastSize) {
        stableTime += checkInterval;
        console.log(`⏳ File stable for ${stableTime / 1000}s`);

        if (stableTime >= stableDuration) {
          console.log('✅ File is stable, proceeding...');
          break;
        }
      } else {
        stableTime = 0;
        lastSize = currentSize;
        console.log('🔄 File still changing...');
      }

    } catch (err) {
      console.log('⚠️ Waiting for file to be accessible...');
    }

    await delay(checkInterval);
  }
}

// helper delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { start };