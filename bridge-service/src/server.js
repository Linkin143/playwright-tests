require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fileWatcher = require('./fileWatcher');
const claudeClient = require('./claudeClient');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../src')));

const PATHS = {
  generatedTests: path.join(__dirname, '../../generated-tests'),
  tests: path.join(__dirname, '../../tests'),
  results: path.join(__dirname, '../../test-results/results.json'),
  artifacts: path.join(__dirname, '../../artifacts'),
};

app.post('/api/receive-test', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.BRIDGE_API_KEY) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }

    const { fileName, testCode } = req.body;

    if (!fileName || !testCode) {
      return res.status(400).json({ 
        success: false, 
        error: 'fileName and testCode are required' 
      });
    }

    const fs = require('fs').promises;
    const filePath = path.join(PATHS.generatedTests, fileName);
    await fs.writeFile(filePath, testCode, 'utf8');

    console.log(`✅ Test file received: ${fileName}`);
    console.log(`📁 Saved to: ${filePath}`);

    res.json({ 
      success: true, 
      message: 'Test received and queued for execution',
      filePath: filePath
    });

  } catch (error) {
    console.error('❌ Error receiving test:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/api/test-status/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const fs = require('fs').promises;
    
    const resultsPath = PATHS.results;
    const resultsExist = await fs.access(resultsPath).then(() => true).catch(() => false);
    
    if (!resultsExist) {
      return res.json({ 
        status: 'pending', 
        message: 'Test not yet executed' 
      });
    }

    const resultsData = await fs.readFile(resultsPath, 'utf-8');
    const results = JSON.parse(resultsData);

    res.json({ 
      status: 'completed', 
      results: results 
    });

  } catch (error) {
    console.error('❌ Error fetching test status:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'running', 
    timestamp: new Date().toISOString(),
    paths: PATHS
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web-interface.html'));
});


app.listen(PORT, async () => {
  console.log(`🟢 Bridge Service running on http://localhost:${PORT}`);
  console.log(`📡 API Endpoint: http://localhost:${PORT}/api/receive-test`);
  console.log(`👀 Watching directory: ${PATHS.generatedTests}`);
  
  await claudeClient.initialize();
  
  fileWatcher.start(PATHS);
});