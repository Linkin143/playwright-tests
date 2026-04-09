require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function sendEmail() {
  // ✅ Generate Allure report
  try {
    execSync('npx allure generate allure-results --clean -o allure-report', { stdio: 'inherit' });
  } catch (e) {
    console.log('Allure report generation failed');
  }

  let passed = 0;
  let failed = 0;
  let failedTests = [];
  let totalDuration = 0;
  let attachments = [];

  function getFailureReason(errorMsg = '') {
    if (errorMsg.includes('Timeout')) return '⏱ Timeout';
    if (errorMsg.includes('expect')) return '❌ Assertion';
    if (errorMsg.includes('locator')) return '🔍 Element Issue';
    return '⚠️ Other';
  }

  function extractResults(data) {
    function walk(suite) {
      if (suite.specs) {
        suite.specs.forEach(spec => {
          spec.tests.forEach(test => {
            if (test.results && test.results.length > 0) {
              const lastResult = test.results[test.results.length - 1];

              // ✅ Status
              if (lastResult.status === 'passed') passed++;

              if (lastResult.status === 'failed') {
                failed++;

                const errorMsg = lastResult.error?.message || '';
                const reason = getFailureReason(errorMsg);

                failedTests.push(`❌ ${spec.title} (${reason})`);

                // 📸 Attach screenshots if exist
                if (lastResult.attachments) {
                  lastResult.attachments.forEach(att => {
                    if (att.path && att.contentType?.includes('image')) {
                      attachments.push({
                        filename: path.basename(att.path),
                        path: att.path
                      });
                    }
                  });
                }
              }

              totalDuration += lastResult.duration || 0;
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
  const durationSec = (totalDuration / 1000).toFixed(2);
  const passPercent = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

  const reportUrl = process.env.REPORT_URL || '#';

  const failedList = failedTests.length > 0
    ? failedTests.slice(0, 10).join('<br/>')
    : 'None 🎉';

  const htmlBody = `

  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>🧪 Playwright Test Report</h2>

<p><strong>Total:</strong> ${total}</p>
<p style="color: green;"><strong>Passed:</strong> ${passed}</p>
<p style="color: red;"><strong>Failed:</strong> ${failed}</p>
<p><strong>Pass %:</strong> ${passPercent}%</p>
<p><strong>Duration:</strong> ${durationSec} sec</p>

<hr/>

<h3>❌ Failed Tests</h3>
<div style="background:#f6f6f6;padding:10px;border-radius:5px;">
  ${failedList}
</div>

<br/>

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
    html: htmlBody,
    attachments: attachments.slice(0, 5) // limit attachments
  });

  console.log('✅ Email sent with screenshots & failure details!');
}

sendEmail();
