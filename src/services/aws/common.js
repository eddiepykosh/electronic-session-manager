const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

const credentialsPath = path.join(process.env.HOME || process.env.USERPROFILE, '.aws', 'credentials');
const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.aws', 'config');

let awsCliAvailable = false;

async function checkAWSCLI() {
  try {
    await execAsync('aws --version');
    console.log('AWS CLI is available');
    awsCliAvailable = true;
    return true;
  } catch (error) {
    console.error('AWS CLI is not installed or not in PATH');
    awsCliAvailable = false;
    return false;
  }
}

async function ensureAWSCLI() {
  if (!awsCliAvailable) {
    const available = await checkAWSCLI();
    if (!available) {
      throw new Error('AWS CLI is required but not found. Please install AWS CLI and ensure it is in your PATH.');
    }
  }
}

function buildAWSCommand(baseCommand, profile) {
  if (profile && profile !== 'default') {
    return `${baseCommand} --profile ${profile}`;
  }
  return baseCommand;
}

async function ensureConfigDirectory() {
  const configDir = path.dirname(credentialsPath);
  try {
    await fs.access(configDir);
  } catch (error) {
    await fs.mkdir(configDir, { recursive: true });
  }
}

async function appendToCredentialsFile(content) {
  try {
    await ensureConfigDirectory();
    
    let existingContent = '';
    try {
      existingContent = await fs.readFile(credentialsPath, 'utf8');
    } catch (error) {
      // File doesn't exist, that's fine
    }
    
    let contentToWrite = content;
    if (existingContent.trim()) {
      contentToWrite = '\n' + content;
    }
    
    await fs.appendFile(credentialsPath, contentToWrite);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(credentialsPath, content);
    } else {
      throw error;
    }
  }
}

async function appendToConfigFile(content) {
  try {
    await ensureConfigDirectory();
    
    let existingContent = '';
    try {
      existingContent = await fs.readFile(configPath, 'utf8');
    } catch (error) {
      // File doesn't exist, that's fine
    }
    
    let contentToWrite = content;
    if (existingContent.trim()) {
      contentToWrite = '\n' + content;
    }
    
    await fs.appendFile(configPath, contentToWrite);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(configPath, content);
    } else {
      throw error;
    }
  }
}

async function profileExistsInFiles(profileName) {
  try {
    try {
      const credentialsContent = await fs.readFile(credentialsPath, 'utf8');
      if (credentialsContent.includes(`[${profileName}]`)) {
        return true;
      }
    } catch (error) {
      // File doesn't exist, that's fine
    }

    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      if (configContent.includes(`[profile ${profileName}]`)) {
        return true;
      }
    } catch (error) {
      // File doesn't exist, that's fine
    }

    return false;
  } catch (error) {
    console.error('Error checking if profile exists in files:', error);
    return false;
  }
}

async function isSSOProfile(profileName) {
  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    const lines = configContent.split('\n');
    let inProfileSection = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === `[profile ${profileName}]`) {
        inProfileSection = true;
        continue;
      }
      
      if (inProfileSection) {
        if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
          break;
        }
        
        if (trimmedLine.startsWith('sso_')) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if profile is SSO:', error);
    return false;
  }
}

module.exports = {
  execAsync,
  credentialsPath,
  configPath,
  checkAWSCLI,
  ensureAWSCLI,
  buildAWSCommand,
  appendToCredentialsFile,
  appendToConfigFile,
  profileExistsInFiles,
  isSSOProfile,
}; 