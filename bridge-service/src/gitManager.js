const simpleGit = require('simple-git');
const path = require('path');

async function pushToGitHub(fileName, status, PATHS) {
  try {
    console.log('\n📦 Preparing Git operations...');
    
    const testsDir = path.resolve(PATHS.tests);
    
    console.log(`🔍 Working in directory: ${testsDir}`);
    console.log(`📄 File to commit: ${fileName}`);
    console.log(`🎯 Target repo: ${process.env.GITHUB_REPO_URL}`);

    const git = simpleGit({
      baseDir: testsDir,
      binary: 'git',
      maxConcurrentProcesses: 1,
    });

    await git.addConfig('user.name', process.env.GITHUB_USERNAME || 'Playwright Bot', false, 'local');
    await git.addConfig('user.email', process.env.GITHUB_EMAIL || 'bot@playwright.com', false, 'local');

    await git.add(fileName);
    console.log(`✅ Added to git: ${fileName}`);

    const commitMessage = `✅ Add: ${fileName} - ${status}`;
    await git.commit(commitMessage);
    console.log(`✅ Committed: ${commitMessage}`);

    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO_URL) {
      console.log('⚠️  GitHub credentials not configured. Skipping push.');
      console.log('    Local commit created successfully in tests/ folder');
      return;
    }

    const remoteUrl = process.env.GITHUB_REPO_URL.replace(
      'https://',
      `https://${process.env.GITHUB_USERNAME}:${process.env.GITHUB_TOKEN}@`
    );

    const remotes = await git.getRemotes(false);
    const originExists = remotes.some(r => r.name === 'origin');

    if (!originExists) {
      await git.addRemote('origin', remoteUrl);
      console.log('✅ Remote origin added');
    } else {
      await git.remote(['set-url', 'origin', remoteUrl]);
      console.log('✅ Remote origin updated');
    }

    const branches = await git.branchLocal();
    const currentBranch = branches.current || 'main';
    
    console.log(`📤 Pushing to: ${process.env.GITHUB_REPO_URL}`);
    console.log(`📤 Branch: ${currentBranch}`);

    try {
      await git.push('origin', currentBranch);
      console.log('🚀 Pushed to GitHub successfully!');
    } catch (pushError) {
      if (pushError.message.includes('rejected') || pushError.message.includes('fetch first')) {
        console.log('⚠️  Remote has changes, pulling first...');
        
        try {
          await git.pull('origin', currentBranch, {'--rebase': 'true'});
          await git.push('origin', currentBranch);
          console.log('🚀 Pushed to GitHub successfully (after rebase)!');
        } catch (pullError) {
          console.error('❌ Pull/rebase failed:', pullError.message);
          console.log('⚠️  Attempting force push...');
          await git.push('origin', currentBranch, ['--force']);
          console.log('🚀 Force pushed to GitHub!');
        }
      } else if (pushError.message.includes('no upstream') || pushError.message.includes('does not match any')) {
        await git.push('origin', currentBranch, ['--set-upstream']);
        console.log('🚀 Pushed to GitHub successfully (set upstream)!');
      } else {
        throw pushError;
      }
    }

  } catch (error) {
    console.error('❌ Git operation failed:', error.message);
    console.error('    Working directory:', PATHS.tests);
    console.error('    Target repository:', process.env.GITHUB_REPO_URL);
    console.error('    File:', fileName);
  }
}

module.exports = { pushToGitHub };