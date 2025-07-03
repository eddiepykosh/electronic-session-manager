
/**
 * AWS Common Utilities - Electronic Session Manager
 * 
 * This file provides common utilities and helper functions for AWS operations
 * across the application. It handles AWS CLI availability checking, profile
 * management, configuration file operations, and command building.
 * 
 * Key Responsibilities:
 * - Checks AWS CLI availability and installation
 * - Manages AWS configuration and credentials files
 * - Provides profile validation and region detection
 * - Builds AWS CLI commands with proper parameters
 * - Handles SSO profile detection
 * - Manages AWS configuration directory structure
 * 
 * Architecture Role:
 * - Acts as a shared utility layer for AWS operations
 * - Provides common functionality used by other AWS services
 * - Manages AWS configuration file I/O operations
 * - Ensures AWS CLI availability before operations
 * - Provides profile and region management utilities
 * 
 * File Management:
 * - AWS credentials file (~/.aws/credentials)
 * - AWS config file (~/.aws/config)
 * - Automatic directory creation
 * - Safe file appending and writing
 * 
 * Profile Operations:
 * - Profile existence checking
 * - Profile region detection
 * - SSO profile identification
 * - Profile configuration parsing
 * 
 * Command Building:
 * - Automatic region injection
 * - Profile parameter addition
 * - Command validation and formatting
 * 
 * Dependencies:
 * - Node.js child_process: For AWS CLI execution
 * - Node.js fs: For file system operations
 * - Node.js path: For path manipulation
 * - Node.js util: For promisification
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

// Promisify exec for async/await usage
const execAsync = promisify(exec);

// Define AWS configuration file paths
const credentialsPath = path.join(process.env.HOME || process.env.USERPROFILE, '.aws', 'credentials');
const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.aws', 'config');

// Track AWS CLI availability status
let awsCliAvailable = false;

/**
 * Checks if AWS CLI is installed and available in PATH
 * @returns {Promise<boolean>} True if AWS CLI is available, false otherwise
 */
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

/**
 * Ensures AWS CLI is available, throws error if not found
 * @throws {Error} If AWS CLI is not available
 */
async function ensureAWSCLI() {
  if (!awsCliAvailable) {
    const available = await checkAWSCLI();
    if (!available) {
      throw new Error('AWS CLI is required but not found. Please install AWS CLI and ensure it is in your PATH.');
    }
  }
}

/**
 * Builds AWS CLI command with proper profile and region parameters
 * @param {string} baseCommand - Base AWS CLI command
 * @param {string} profile - AWS profile name
 * @returns {Promise<string>} Complete AWS CLI command
 */
async function buildAWSCommand(baseCommand, profile) {
  let command = baseCommand;
  
  // Add region if not already present in command
  if (!command.includes('--region') && !command.includes('--region=')) {
    const region = await getProfileRegion(profile || 'default');
    command = `${command} --region ${region}`;
  }
  
  // Add profile if specified and not default
  if (profile && profile !== 'default') {
    command = `${command} --profile ${profile}`;
  }
  
  return command;
}

/**
 * Ensures AWS configuration directory exists
 * Creates the directory if it doesn't exist
 */
async function ensureConfigDirectory() {
  const configDir = path.dirname(credentialsPath);
  try {
    await fs.access(configDir);
  } catch (error) {
    await fs.mkdir(configDir, { recursive: true });
  }
}

/**
 * Appends content to AWS credentials file
 * Creates file if it doesn't exist
 * @param {string} content - Content to append to credentials file
 */
async function appendToCredentialsFile(content) {
  try {
    await ensureConfigDirectory();
    
    // Read existing content if file exists
    let existingContent = '';
    try {
      existingContent = await fs.readFile(credentialsPath, 'utf8');
    } catch (error) {
      // File doesn't exist, that's fine
    }
    
    // Prepare content to write (add newline if file has content)
    let contentToWrite = content;
    if (existingContent.trim()) {
      contentToWrite = '\n' + content;
    }
    
    await fs.appendFile(credentialsPath, contentToWrite);
  } catch (error) {
    // If append fails, try to write the file directly
    if (error.code === 'ENOENT') {
      await fs.writeFile(credentialsPath, content);
    } else {
      throw error;
    }
  }
}

/**
 * Appends content to AWS config file
 * Creates file if it doesn't exist
 * @param {string} content - Content to append to config file
 */
async function appendToConfigFile(content) {
  try {
    await ensureConfigDirectory();
    
    // Read existing content if file exists
    let existingContent = '';
    try {
      existingContent = await fs.readFile(configPath, 'utf8');
    } catch (error) {
      // File doesn't exist, that's fine
    }
    
    // Prepare content to write (add newline if file has content)
    let contentToWrite = content;
    if (existingContent.trim()) {
      contentToWrite = '\n' + content;
    }
    
    await fs.appendFile(configPath, contentToWrite);
  } catch (error) {
    // If append fails, try to write the file directly
    if (error.code === 'ENOENT') {
      await fs.writeFile(configPath, content);
    } else {
      throw error;
    }
  }
}

/**
 * Checks if a profile exists in AWS configuration files
 * @param {string} profileName - Name of the profile to check
 * @returns {Promise<boolean>} True if profile exists, false otherwise
 */
async function profileExistsInFiles(profileName) {
  try {
    // Check credentials file for profile
    try {
      const credentialsContent = await fs.readFile(credentialsPath, 'utf8');
      if (credentialsContent.includes(`[${profileName}]`)) {
        return true;
      }
    } catch (error) {
      // File doesn't exist, that's fine
    }

    // Check config file for profile
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

/**
 * Gets the region configured for a specific profile
 * @param {string} profileName - Name of the profile
 * @returns {Promise<string>} Region name or default region
 */
async function getProfileRegion(profileName) {
  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    const lines = configContent.split('\n');
    let inProfileSection = false;
    
    // Parse config file line by line
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if we're entering the target profile section
      if (trimmedLine === `[profile ${profileName}]`) {
        inProfileSection = true;
        continue;
      }
      
      // If we're in the profile section, look for region setting
      if (inProfileSection) {
        // Exit if we hit another profile section
        if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
          break;
        }
        
        // Extract region if found
        if (trimmedLine.startsWith('region = ')) {
          return trimmedLine.split('=')[1].trim();
        }
      }
    }
    
    // If no region found in config, try to get from environment or use default
    return process.env.AWS_DEFAULT_REGION || 'us-east-1';
  } catch (error) {
    console.error('Error getting profile region:', error);
    return process.env.AWS_DEFAULT_REGION || 'us-east-1';
  }
}

/**
 * Checks if a profile is an SSO profile
 * @param {string} profileName - Name of the profile to check
 * @returns {Promise<boolean>} True if profile is SSO, false otherwise
 */
async function isSSOProfile(profileName) {
  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    const lines = configContent.split('\n');
    let inProfileSection = false;
    
    // Parse config file line by line
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if we're entering the target profile section
      if (trimmedLine === `[profile ${profileName}]`) {
        inProfileSection = true;
        continue;
      }
      
      // If we're in the profile section, look for SSO settings
      if (inProfileSection) {
        // Exit if we hit another profile section
        if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
          break;
        }
        
        // Check for SSO-related settings
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

// Export all utility functions
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
  getProfileRegion,
}; 