# Playwright Claude Automation

Automated Playwright testing framework integrated with Claude AI.

## Setup Instructions

### 1. Install Dependencies

Root project:
npm install

Bridge service:
cd bridge-service
npm install

### 2. Configure Environment

Edit `bridge-service/.env` with your credentials

### 3. Initialize Git Repository

git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_REPO_URL
git push -u origin main

### 4. Start Bridge Service

npm run bridge

### 5. Send Test from Claude AI

Use Claude Desktop to send test code to:
http://localhost:3001/api/receive-test

## API Endpoints

- POST /api/receive-test - Receive test from Claude
- GET /api/test-status/:fileName - Get test status
- GET /health - Health check

## Directory Structure

- tests/ - Executed test files
- generated-tests/ - Incoming tests from Claude
- test-results/ - Test execution results
- artifacts/ - Screenshots and videos
- bridge-service/ - Node.js bridge service