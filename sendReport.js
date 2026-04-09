require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function sendEmail() {
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let failedTests = [];
  let totalDuration = 0;
  let attachments = [];

  function getFailureReason(errorMsg = '') {
    if (errorMsg.includes('Timeout') || errorMsg.includes('timeout')) return '⏱ Timeout';
    if (errorMsg.includes('expect') || errorMsg.includes('assert'))   return '❌ Assertion';
    if (errorMsg.includes('locator') || errorMsg.includes('element')) return '🔍 Element Issue';
    if (errorMsg.includes('net::ERR') || errorMsg.includes('navigation')) return '🌐 Navigation';
    if (errorMsg.includes('login') || errorMsg.includes('auth'))      return '🔐 Auth Failure';
    return '⚠️ Other';
  }

  function extractResults(data) {
    function walk(suite) {
      if (suite.specs) {
        suite.specs.forEach(spec => {
          spec.tests.forEach(test => {
            if (test.results && test.results.length > 0) {
              const lastResult = test.results[test.results.length - 1];

              if (lastResult.status === 'passed')  passed++;
              if (lastResult.status === 'skipped') skipped++;

              if (lastResult.status === 'failed') {
                failed++;
                const errorMsg = lastResult.error?.message || '';
                const reason = getFailureReason(errorMsg);
                const browser = test.projectName || 'chromium';
                failedTests.push({
                  title: spec.title,
                  reason,
                  browser,
                  error: errorMsg.split('\n')[0].slice(0, 120),
                });

                // 📸 Attach screenshots if exist
                if (lastResult.attachments) {
                  lastResult.attachments.forEach(att => {
                    if (att.path && att.contentType?.includes('image')) {
                      if (fs.existsSync(att.path)) {
                        attachments.push({
                          filename: path.basename(att.path),
                          path: att.path,
                        });
                      }
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
    const results = JSON.parse(fs.readFileSync('./test-results/results.json', 'utf-8'));
    extractResults(results);
  }

  const total       = passed + failed + skipped;
  const durationSec = (totalDuration / 1000).toFixed(2);
  const durationMin = (totalDuration / 60000).toFixed(1);
  const passPercent = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  const statusEmoji = failed > 0 ? '❌' : '✅';
  const statusColor = failed > 0 ? '#dc3545' : '#28a745';
  const statusLabel = failed > 0 ? 'FAILED' : 'PASSED';

  const reportUrl = process.env.REPORT_URL || '#';
  const runNumber = process.env.GITHUB_RUN_NUMBER || 'N/A';
  const branch    = process.env.GITHUB_REF_NAME   || 'N/A';
  const actor     = process.env.GITHUB_ACTOR      || 'N/A';
  const repo      = process.env.GITHUB_REPOSITORY || 'N/A';
  const commitSha = (process.env.GITHUB_SHA       || '').slice(0, 7);
  const runUrl    = process.env.GITHUB_RUN_ID
    ? `https://github.com/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : '#';

  // ✅ Attach CSV if it exists — named with run number for easy identification
  const csvPath = './test-results/allure-summary.csv';
  if (fs.existsSync(csvPath)) {
    attachments.push({
      filename: `test-results-run-${runNumber}.csv`,
      path: csvPath,
      contentType: 'text/csv',
    });
    console.log(`📎 CSV attached: test-results-run-${runNumber}.csv`);
  } else {
    console.log('⚠️ CSV not found, skipping CSV attachment');
  }

  // ✅ Attach up to 5 screenshots (after CSV so CSV is always first)
  const screenshotAttachments = attachments.filter(a => a.contentType !== 'text/csv');
  const csvAttachments        = attachments.filter(a => a.contentType === 'text/csv');
  attachments = [...csvAttachments, ...screenshotAttachments.slice(0, 5)];

  const failedRows = failedTests.length > 0
    ? failedTests.slice(0, 10).map(t => `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;">${t.title}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;white-space:nowrap;">${t.reason}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;white-space:nowrap;">${t.browser}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;color:#888;font-size:11px;">${t.error}</td>
        </tr>`).join('')
    : `<tr><td colspan="4" style="padding:10px;text-align:center;color:green;">None 🎉 All tests passed!</td></tr>`;

  const htmlBody = `
  <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px;color:#333;">

    <!-- Header -->
    <div style="background:${statusColor};color:#fff;padding:16px 20px;border-radius:8px 8px 0 0;">
      <h2 style="margin:0;font-size:20px;">
        ${statusEmoji} Playwright Test Report — ${statusLabel}
      </h2>
      <p style="margin:4px 0 0;font-size:13px;opacity:0.9;">
        Run #${runNumber} &nbsp;|&nbsp; Branch: ${branch} &nbsp;|&nbsp; Commit: ${commitSha}
      </p>
    </div>

    <!-- Summary cards -->
    <div style="display:flex;gap:0;border:1px solid #ddd;border-top:none;">
      <div style="flex:1;padding:14px;text-align:center;border-right:1px solid #ddd;">
        <div style="font-size:26px;font-weight:bold;">${total}</div>
        <div style="font-size:12px;color:#888;">Total</div>
      </div>
      <div style="flex:1;padding:14px;text-align:center;border-right:1px solid #ddd;background:#f0fff4;">
        <div style="font-size:26px;font-weight:bold;color:#28a745;">${passed}</div>
        <div style="font-size:12px;color:#888;">Passed</div>
      </div>
      <div style="flex:1;padding:14px;text-align:center;border-right:1px solid #ddd;background:#fff5f5;">
        <div style="font-size:26px;font-weight:bold;color:#dc3545;">${failed}</div>
        <div style="font-size:12px;color:#888;">Failed</div>
      </div>
      <div style="flex:1;padding:14px;text-align:center;border-right:1px solid #ddd;background:#fffbe6;">
        <div style="font-size:26px;font-weight:bold;color:#e6a817;">${skipped}</div>
        <div style="font-size:12px;color:#888;">Skipped</div>
      </div>
      <div style="flex:1;padding:14px;text-align:center;background:#f8f9fa;">
        <div style="font-size:26px;font-weight:bold;">${passPercent}%</div>
        <div style="font-size:12px;color:#888;">Pass Rate</div>
      </div>
    </div>

    <!-- Meta info -->
    <div style="background:#f8f9fa;padding:12px 16px;border:1px solid #ddd;border-top:none;font-size:13px;">
      ⏱ Duration: <strong>${durationSec}s (${durationMin} min)</strong>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      👤 Triggered by: <strong>${actor}</strong>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      🖥️ Environment: <strong>GitHub Actions</strong>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      🌐 Browsers: <strong>Chromium + Firefox</strong>
    </div>

    <!-- Failed tests table -->
    <div style="margin-top:20px;">
      <h3 style="font-size:15px;margin-bottom:8px;">❌ Failed Tests ${failed > 0 ? `(${failed})` : ''}</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #ddd;">
        <thead>
          <tr style="background:#f1f1f1;">
            <th style="padding:8px;text-align:left;border-bottom:2px solid #ddd;">Test Name</th>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #ddd;">Reason</th>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #ddd;">Browser</th>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #ddd;">Error</th>
          </tr>
        </thead>
        <tbody>${failedRows}</tbody>
      </table>
      ${failedTests.length > 10 ? `<p style="font-size:12px;color:#888;">...and ${failedTests.length - 10} more. See full report.</p>` : ''}
    </div>

    <!-- CSV note -->
    <div style="margin-top:16px;padding:10px 14px;background:#f0f7ff;border:1px solid #cce0ff;border-radius:6px;font-size:13px;">
      📎 <strong>Attached:</strong> Full test results as <code>test-results-run-${runNumber}.csv</code>
      — open in Excel or Google Sheets for detailed analysis.
    </div>

    <!-- CTA buttons -->
    <div style="margin-top:24px;display:flex;gap:12px;">
      <a href="${reportUrl}"
         style="display:inline-block;padding:12px 24px;background:#007bff;color:#fff;
                text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;">
        📊 Open Allure 3 Report
      </a>
      <a href="${runUrl}"
         style="display:inline-block;padding:12px 24px;background:#6c757d;color:#fff;
                text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;">
        ⚙️ View GitHub Actions Run
      </a>
    </div>

    <hr style="margin:24px 0;border:none;border-top:1px solid #eee;"/>
    <p style="font-size:11px;color:#aaa;margin:0;">
      Auto-generated by Playwright + Allure 3 &nbsp;|&nbsp; ${repo} &nbsp;|&nbsp; Run #${runNumber}
    </p>

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
    subject: `${statusEmoji} Playwright Report #${runNumber} — ${statusLabel} (${passed}/${total} passed)`,
    html: htmlBody,
    attachments,
  });

  console.log('✅ Email sent — Allure 3 report link + CSV attached!');
}

sendEmail();