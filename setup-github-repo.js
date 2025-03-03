/**
 * GitHub Repository Setup Script
 * 
 * This script helps with setting up a GitHub repository for the Car Exchange Module.
 * It guides you through the process of creating a new repository and pushing your code.
 */

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to execute commands
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return null;
  }
}

// Check if git is installed
function checkGitInstalled() {
  try {
    execSync('git --version', { encoding: 'utf8' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if the directory is a git repository
function isGitRepository() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { encoding: 'utf8' });
    return true;
  } catch (error) {
    return false;
  }
}

// Main function
async function main() {
  console.log('='.repeat(50));
  console.log('GitHub Repository Setup for Car Exchange Module');
  console.log('='.repeat(50));
  console.log('\n');

  // Check if Git is installed
  if (!checkGitInstalled()) {
    console.error('Git is not installed or not in your PATH. Please install Git and try again.');
    process.exit(1);
  }

  // Check if we're in a git repository
  const isRepo = isGitRepository();
  
  if (!isRepo) {
    console.log('This directory is not a Git repository. Initializing...');
    runCommand('git init');
    console.log('Git repository initialized.');
  } else {
    console.log('This directory is already a Git repository.');
  }

  // Ask for GitHub username
  const username = await new Promise(resolve => {
    rl.question('Enter your GitHub username: ', answer => {
      resolve(answer.trim());
    });
  });

  // Ask for repository name
  const repoName = await new Promise(resolve => {
    rl.question('Enter the repository name (default: car-exchange-module): ', answer => {
      resolve(answer.trim() || 'car-exchange-module');
    });
  });

  // Ask for repository visibility
  const visibility = await new Promise(resolve => {
    rl.question('Should the repository be public or private? (public/private, default: private): ', answer => {
      const response = answer.trim().toLowerCase();
      resolve(response === 'public' ? 'public' : 'private');
    });
  });

  console.log('\nSummary:');
  console.log(`- GitHub Username: ${username}`);
  console.log(`- Repository Name: ${repoName}`);
  console.log(`- Visibility: ${visibility}`);

  const confirm = await new Promise(resolve => {
    rl.question('\nDo you want to proceed with these settings? (yes/no): ', answer => {
      resolve(answer.trim().toLowerCase() === 'yes' || answer.trim().toLowerCase() === 'y');
    });
  });

  if (!confirm) {
    console.log('Setup cancelled. Exiting...');
    rl.close();
    return;
  }

  console.log('\nNext steps:');
  console.log('1. Go to GitHub and create a new repository with these settings:');
  console.log(`   - Name: ${repoName}`);
  console.log(`   - Visibility: ${visibility}`);
  console.log('   - Do NOT initialize with README, .gitignore, or license');
  
  const created = await new Promise(resolve => {
    rl.question('\nHave you created the repository on GitHub? (yes/no): ', answer => {
      resolve(answer.trim().toLowerCase() === 'yes' || answer.trim().toLowerCase() === 'y');
    });
  });

  if (!created) {
    console.log('Please create the repository on GitHub before continuing.');
    rl.close();
    return;
  }

  // Set up remote
  console.log('\nSetting up remote...');
  const remoteUrl = `https://github.com/${username}/${repoName}.git`;
  
  // Check if remote already exists
  try {
    const remotes = runCommand('git remote -v');
    if (remotes && remotes.includes('origin')) {
      const changeRemote = await new Promise(resolve => {
        rl.question('Remote "origin" already exists. Do you want to update it? (yes/no): ', answer => {
          resolve(answer.trim().toLowerCase() === 'yes' || answer.trim().toLowerCase() === 'y');
        });
      });
      
      if (changeRemote) {
        runCommand(`git remote set-url origin ${remoteUrl}`);
        console.log(`Remote "origin" updated to ${remoteUrl}`);
      } else {
        console.log('Remote not changed.');
      }
    } else {
      runCommand(`git remote add origin ${remoteUrl}`);
      console.log(`Remote "origin" added: ${remoteUrl}`);
    }
  } catch (error) {
    runCommand(`git remote add origin ${remoteUrl}`);
    console.log(`Remote "origin" added: ${remoteUrl}`);
  }

  // Add all files
  console.log('\nAdding files to git...');
  runCommand('git add .');
  
  // Commit if needed
  try {
    const status = runCommand('git status --porcelain');
    if (status && status.trim() !== '') {
      const commitMsg = await new Promise(resolve => {
        rl.question('Enter commit message (default: "Prepare for GitHub deployment"): ', answer => {
          resolve(answer.trim() || 'Prepare for GitHub deployment');
        });
      });
      
      runCommand(`git commit -m "${commitMsg}"`);
      console.log('Changes committed.');
    } else {
      console.log('No changes to commit.');
    }
  } catch (error) {
    console.log('Error checking git status.');
  }

  // Push to GitHub
  console.log('\nPushing to GitHub...');
  console.log('You may be prompted for your GitHub credentials.');
  
  const pushConfirm = await new Promise(resolve => {
    rl.question('Ready to push to GitHub? (yes/no): ', answer => {
      resolve(answer.trim().toLowerCase() === 'yes' || answer.trim().toLowerCase() === 'y');
    });
  });

  if (pushConfirm) {
    try {
      runCommand('git push -u origin master');
      console.log('\nSuccess! Your code has been pushed to GitHub.');
      console.log(`Repository URL: https://github.com/${username}/${repoName}`);
    } catch (error) {
      console.error('Error pushing to GitHub. Please check your credentials and try again.');
    }
  } else {
    console.log('\nPush cancelled. You can push your code later with:');
    console.log('git push -u origin master');
  }

  console.log('\nSetup complete!');
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error('An error occurred:', error);
  rl.close();
});
