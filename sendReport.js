require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');
const { execSync } = require('child_process');

async function sendEmail() {
  // ✅ Generate Allure report
  try {
    execSync('npx allure generate allure-results --clean -o allure-report', { stdio: 'inherit' });
  } catch (e) {
    console.log('Allure report generation failed');
  }

  // ✅ Extract results
  let passed = 0;
  let failed = 0;

  function extractResults(data) {
    function walk(suite) {
      if (suite.specs) {
        suite.specs.forEach(spec => {
          spec.tests.forEach(test => {
            if (test.results && test.results.length > 0) {
              const lastResult = test.results[test.results.length - 1];
              if (lastResult.status === 'passed') passed++;
              if (lastResult.status === 'failed') failed++;
            }
          });
        });
      }
      if (suite.suites) {
        suite.suites.forEach(child => walk(child));
      }
    }
    walk(data);
  }

  if (fs.existsSync('./test-results/results.json')) {
    const results = JSON.parse(
      fs.readFileSync('./test-results/results.json', 'utf-8')
    );
    extractResults(results);
  }

  const total = passed + failed;
  const reportUrl = process.env.REPORT_URL || '#';

  // ✅ HTML Email Template
  const htmlBody = `

  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>🧪 Playwright Test Report</h2>

<p><strong>Total:</strong> ${total}</p>
<p style="color: green;"><strong>Passed:</strong> ${passed}</p>
<p style="color: red;"><strong>Failed:</strong> ${failed}</p>

<hr/>

<p>🔗 View Full Allure Report:</p>

<a href="${reportUrl}" 
   style="display:inline-block;padding:10px 20px;background:#007bff;color:#fff;
   text-decoration:none;border-radius:5px;">
   Open Report
</a>

<br/><br/>

<small>
  Browser: Chromium + Firefox <br/>
  Environment: GitHub Actions
</small>
  </div>
  `;

  // ✅ Email setup
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
    html: htmlBody, // ✅ HTML instead of text
  });

  console.log('✅ HTML Email sent successfully!');
}

sendEmail();
