require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function sendEmail() {
  // ✅ Step 1: Generate Allure report
  try {
    execSync('npx allure generate allure-results --clean -o allure-report', { stdio: 'inherit' });
  } catch (e) {
    console.log('Allure report generation failed');
  }

  // ✅ Step 2: Zip Allure report
  const zipName = 'allure-report.zip';
  try {
    execSync(`zip -r ${zipName} allure-report`);
  } catch (e) {
    console.log('Zipping failed');
  }

  // ✅ Step 3: Read JSON results
  let passed = 0;
  let failed = 0;

  if (fs.existsSync('./test-results/results.json')) {
    const results = JSON.parse(fs.readFileSync('./test-results/results.json', 'utf-8'));

    results.suites.forEach(suite => {
      suite.specs.forEach(spec => {
        spec.tests.forEach(test => {
          if (test.status === 'PASSED') passed++;
          if (test.status === 'FAILED') failed++;
        });
      });
    });
  }

  const total = passed + failed;
  
const reportUrl = process.env.REPORT_URL || 'Not Available';

const summary = `
Playwright + Allure Report

Total: ${total}
Passed: ${passed}
Failed: ${failed}

🔗 Live Report:
${reportUrl}

Browser: Chromium + Firefox
Environment: GitHub Actions
`;

  // ✅ Step 4: Send Email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO,
    subject: `Test Report: ${failed > 0 ? 'FAILED ❌' : 'PASSED ✅'}`,
    text: summary,
    attachments: [
      // {
      //   filename: 'allure-report.zip',
      //   path: path.join(__dirname, zipName),
      // },
      {
        filename: 'html-report.html',
        path: path.join(__dirname, 'test-results/html-report/index.html'),
      }
    ],
  });

  console.log('✅ Email sent with Allure report!');
}

sendEmail();