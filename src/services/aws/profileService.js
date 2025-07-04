/**
 * AWS Profile Service - Electronic Session Manager
 * 
 * This file provides comprehensive AWS profile management services.
 * It handles profile creation, validation, deletion, and SSO authentication
 * for both IAM and SSO profile types.
 * 
 * Key Responsibilities:
 * - Manages AWS profile lifecycle (create, test, delete)
 * - Handles IAM profile creation with access keys
 * - Manages SSO profile setup and authentication
 * - Validates profile credentials and permissions
 * - Provides profile discovery and listing
 * - Manages AWS configuration files
 * 
 * Architecture Role:
 * - Acts as the AWS profile management service layer
 * - Coordinates between application and AWS configuration files
 * - Provides profile validation and testing capabilities
 * - Handles SSO authentication workflows
 * - Manages profile file I/O operations
 * 
 * Profile Types Supported:
 * - IAM Profiles: Access key/secret key based authentication
 * - SSO Profiles: Single Sign-On based authentication
 * - Default Profile: System default AWS profile
 * 
 * Profile Operations:
 * - Profile discovery from files and CLI
 * - Profile creation (IAM and SSO)
 * - Profile validation and testing
 * - Profile deletion and cleanup
 * - SSO login and status checking
 * 
 * File Management:
 * - AWS credentials file manipulation
 * - AWS config file manipulation
 * - Safe profile section removal
 * - Configuration file parsing
 * 
 * Security Features:
 * - Profile name validation
 * - Credential secure handling
 * - SSO session management
 * - Profile existence checking
 * 
 * Dependencies:
 * - common.js: For AWS CLI utilities and file operations
 * - Node.js fs: For file system operations
 * - AWS CLI: For profile operations and SSO
 */

const fs = require('fs').promises;
const {
  execAsync,
  credentialsPath,
  configPath,
  ensureAWSCLI,
  buildAWSCommand,
  appendToCredentialsFile,
  appendToConfigFile,
  profileExistsInFiles,
  isSSOProfile,
} = require('./common');

/**
 * Retrieves all available AWS profiles from configuration files and CLI
 * Discovers profiles from credentials file, config file, and AWS CLI
 * @returns {Promise<Array>} Array of available profile names
 */
async function getAvailableProfiles() {
  try {
    await ensureAWSCLI();
    
    // Start with default profile
    const profiles = new Set(['default']);
    
    // Read profiles from credentials file
    try {
      const credentialsContent = await fs.readFile(credentialsPath, 'utf8');
      const profileMatches = credentialsContent.match(/\[([^\]]+)\]/g);
      if (profileMatches) {
        profileMatches.forEach(match => {
          const profileName = match.slice(1, -1).trim();
          if (profileName !== 'default') {
            profiles.add(profileName);
          }
        });
      }
    } catch (error) {
      console.log('No AWS credentials file found or unable to read');
    }

    // Read profiles from config file
    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      const profileMatches = configContent.match(/\[profile ([^\]]+)\]/g);
      if (profileMatches) {
        profileMatches.forEach(match => {
          const profileName = match.slice(9, -1).trim();
          profiles.add(profileName);
        });
      }
    } catch (error) {
      console.log('No AWS config file found or unable to read');
    }

    // Get profiles from AWS CLI
    try {
      const { stdout } = await execAsync('aws configure list-profiles');
      const cliProfiles = stdout.trim().split('\n').map(p => p.trim()).filter(p => p);
      cliProfiles.forEach(profile => profiles.add(profile));
    } catch (error) {
      console.log('Unable to list profiles via AWS CLI, using file-based detection');
    }

    // Ensure all names are trimmed and deduplicated
    const normalizedProfiles = Array.from(profiles).map(p => p.trim());
    // Remove accidental duplicates after normalization
    return Array.from(new Set(normalizedProfiles)).sort();
  } catch (error) {
    console.error('Error getting available profiles:', error);
    return ['default'];
  }
}

/**
 * Tests a profile's validity by attempting to get caller identity
 * @param {string} profile - Profile name to test
 * @returns {Promise<Object>} Object containing validation result and identity info
 */
async function testProfile(profile) {
  try {
    await ensureAWSCLI();
    const command = await buildAWSCommand('aws sts get-caller-identity --output json', profile);
    const { stdout } = await execAsync(command);
    const data = JSON.parse(stdout);
    return {
      valid: true,
      accountId: data.Account,
      userId: data.UserId,
      arn: data.Arn
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Creates an IAM profile with access key credentials
 * @param {string} profileName - Name for the new profile
 * @param {Object} credentials - IAM credentials object
 * @param {string} credentials.accessKeyId - AWS access key ID
 * @param {string} credentials.secretAccessKey - AWS secret access key
 * @param {string} credentials.sessionToken - Optional session token
 * @param {string} credentials.region - AWS region (default: us-east-1)
 * @returns {Promise<Object>} Object containing creation result
 */
async function createIAMProfile(profileName, { accessKeyId, secretAccessKey, sessionToken, region = 'us-east-1' }) {
  try {
    // Validate required parameters
    if (!profileName || !accessKeyId || !secretAccessKey) {
      throw new Error('Profile name, access key ID, and secret access key are required');
    }

    // Validate profile name format
    if (!/^[a-zA-Z0-9_-]+$/.test(profileName)) {
      throw new Error('Profile name can only contain letters, numbers, underscores, and hyphens');
    }

    // Check if profile already exists
    const existsInFiles = await profileExistsInFiles(profileName);
    if (existsInFiles) {
      throw new Error(`Profile "${profileName}" already exists in AWS configuration files`);
    }

    const existingProfiles = await getAvailableProfiles();
    if (existingProfiles.includes(profileName)) {
      throw new Error(`Profile "${profileName}" already exists`);
    }

    // Create credentials file entry
    let credentialsEntry = `[${profileName}]
aws_access_key_id = ${accessKeyId}
aws_secret_access_key = ${secretAccessKey}
`;
    
    // Add session token if provided
    if (sessionToken && sessionToken.trim()) {
      credentialsEntry += `aws_session_token = ${sessionToken}
`;
    }

    await appendToCredentialsFile(credentialsEntry);

    // Create config file entry
    const configEntry = `[profile ${profileName}]
region = ${region}
output = json
`;

    await appendToConfigFile(configEntry);

    console.log(`IAM profile "${profileName}" created successfully`);
    return {
      success: true,
      profileName,
      profileType: 'iam',
      message: `IAM profile "${profileName}" created successfully`
    };
  } catch (error) {
    console.error('Error creating IAM profile:', error);
    throw error;
  }
}

/**
 * Creates an SSO profile with SSO configuration
 * @param {string} profileName - Name for the new profile
 * @param {Object} ssoConfig - SSO configuration object
 * @param {string} ssoConfig.ssoStartUrl - SSO start URL
 * @param {string} ssoConfig.ssoRegion - SSO region
 * @param {string} ssoConfig.accountId - AWS account ID
 * @param {string} ssoConfig.roleName - SSO role name
 * @param {string} ssoConfig.region - AWS region (default: us-east-1)
 * @returns {Promise<Object>} Object containing creation result
 */
async function createSSOProfile(profileName, { ssoStartUrl, ssoRegion, accountId, roleName, region = 'us-east-1' }) {
  try {
    // Validate required parameters
    if (!profileName || !ssoStartUrl || !ssoRegion || !accountId || !roleName) {
      throw new Error('Profile name, SSO start URL, SSO region, account ID, and role name are required');
    }

    // Validate profile name format
    if (!/^[a-zA-Z0-9_-]+$/.test(profileName)) {
      throw new Error('Profile name can only contain letters, numbers, underscores, and hyphens');
    }

    // Check if profile already exists
    const existsInFiles = await profileExistsInFiles(profileName);
    if (existsInFiles) {
      throw new Error(`Profile "${profileName}" already exists in AWS configuration files`);
    }

    const existingProfiles = await getAvailableProfiles();
    if (existingProfiles.includes(profileName)) {
      throw new Error(`Profile "${profileName}" already exists`);
    }

    // Create config file entry for SSO profile
    const configEntry = `[profile ${profileName}]
sso_start_url = ${ssoStartUrl}
sso_region = ${ssoRegion}
sso_account_id = ${accountId}
sso_role_name = ${roleName}
region = ${region}
output = json
`;

    await appendToConfigFile(configEntry);

    console.log(`SSO profile "${profileName}" created successfully`);
    return {
      success: true,
      profileName,
      profileType: 'sso',
      message: `SSO profile "${profileName}" created successfully`
    };
  } catch (error) {
    console.error('Error creating SSO profile:', error);
    throw error;
  }
}

/**
 * Creates a profile of the specified type
 * @param {string} profileName - Name for the new profile
 * @param {string} profileType - Type of profile ('iam' or 'sso')
 * @param {Object} profileData - Profile configuration data
 * @returns {Promise<Object>} Object containing creation result
 */
async function createProfile(profileName, profileType, profileData) {
  try {
    await ensureAWSCLI();
    
    if (profileType === 'iam') {
      return await createIAMProfile(profileName, profileData);
    } else if (profileType === 'sso') {
      return await createSSOProfile(profileName, profileData);
    } else {
      throw new Error('Invalid profile type. Must be "iam" or "sso"');
    }
  } catch (error) {
    console.error('Error creating profile:', error);
    throw new Error(`Failed to create profile: ${error.message}`);
  }
}

/**
 * Removes a profile section from the credentials file
 * @param {string} profileName - Name of the profile to remove
 */
async function removeFromCredentialsFile(profileName) {
  try {
    const content = await fs.readFile(credentialsPath, 'utf8');
    const lines = content.split('\n');
    const newLines = [];
    let skipSection = false;
    
    // Parse file line by line, skipping the target profile section
    for (const line of lines) {
      if (line.trim() === `[${profileName}]`) {
        skipSection = true;
        continue;
      }
      
      // Stop skipping when we hit another profile section
      if (skipSection && line.trim().startsWith('[') && line.trim().endsWith(']')) {
        skipSection = false;
      }
      
      // Only add lines that are not in the skipped section
      if (!skipSection) {
        newLines.push(line);
      }
    }
    
    await fs.writeFile(credentialsPath, newLines.join('\n'));
  } catch (error) {
    console.log('Profile not found in credentials file or file does not exist');
  }
}

/**
 * Removes a profile section from the config file
 * @param {string} profileName - Name of the profile to remove
 */
async function removeFromConfigFile(profileName) {
  try {
    const content = await fs.readFile(configPath, 'utf8');
    const lines = content.split('\n');
    const newLines = [];
    let skipSection = false;
    
    // Parse file line by line, skipping the target profile section
    for (const line of lines) {
      if (line.trim() === `[profile ${profileName}]`) {
        skipSection = true;
        continue;
      }
      
      // Stop skipping when we hit another profile section
      if (skipSection && line.trim().startsWith('[') && line.trim().endsWith(']')) {
        skipSection = false;
      }
      
      // Only add lines that are not in the skipped section
      if (!skipSection) {
        newLines.push(line);
      }
    }
    
    await fs.writeFile(configPath, newLines.join('\n'));
  } catch (error) {
    console.log('Profile not found in config file or file does not exist');
  }
}

/**
 * Deletes a profile from AWS configuration files
 * @param {string} profileName - Name of the profile to delete
 * @returns {Promise<Object>} Object containing deletion result
 */
async function deleteProfile(profileName) {
  try {
    await ensureAWSCLI();
    
    // Validate profile name
    if (!profileName) {
      throw new Error('Profile name is required');
    }

    // Check if profile exists
    const existingProfiles = await getAvailableProfiles();
    if (!existingProfiles.includes(profileName)) {
      throw new Error(`Profile "${profileName}" does not exist`);
    }

    // Prevent deletion of default profile
    if (profileName === 'default') {
      throw new Error('Cannot delete the default profile');
    }

    // Remove profile from both files
    await removeFromCredentialsFile(profileName);
    await removeFromConfigFile(profileName);

    console.log(`Profile "${profileName}" deleted successfully`);
    return {
      success: true,
      profileName,
      message: `Profile "${profileName}" deleted successfully`
    };
  } catch (error) {
    console.error('Error deleting profile:', error);
    throw new Error(`Failed to delete profile: ${error.message}`);
  }
}

/**
 * Performs SSO login for a profile
 * @param {string} profileName - Name of the SSO profile to login
 * @returns {Promise<Object>} Object containing login result
 */
async function performSSOLogin(profileName) {
  try {
    await ensureAWSCLI();
    
    // Validate profile name
    if (!profileName) {
      throw new Error('Profile name is required');
    }

    // Check if profile exists
    const existingProfiles = await getAvailableProfiles();
    if (!existingProfiles.includes(profileName)) {
      throw new Error(`Profile "${profileName}" does not exist`);
    }

    // Verify it's an SSO profile
    const isSSO = await isSSOProfile(profileName);
    if (!isSSO) {
      throw new Error(`Profile "${profileName}" is not an SSO profile`);
    }

    console.log(`Starting SSO login for profile: ${profileName}`);
    
    // Execute SSO login command
    const command = `aws sso login --profile ${profileName}`;
    console.log('SSO login command:', command);
    
    const { stdout, stderr } = await execAsync(command);
    
    console.log('SSO login stdout:', stdout);
    if (stderr) {
      console.log('SSO login stderr:', stderr);
    }
    
    // Check login status after completion
    const loginStatus = await checkSSOLoginStatus(profileName);
    
    return {
      success: true,
      profileName,
      message: `SSO login completed for profile "${profileName}"`,
      loginStatus
    };
  } catch (error) {
    console.error('Error performing SSO login:', error);
    throw new Error(`Failed to perform SSO login: ${error.message}`);
  }
}

/**
 * Checks the SSO login status for a profile
 * @param {string} profileName - Name of the SSO profile to check
 * @returns {Promise<Object>} Object containing login status
 */
async function checkSSOLoginStatus(profileName) {
  try {
    await ensureAWSCLI();
    
    // Test the profile to check authentication status
    const profileInfo = await testProfile(profileName);
    
    return {
      authenticated: profileInfo.valid,
      profileName,
      accountId: profileInfo.accountId,
      userId: profileInfo.userId,
      arn: profileInfo.arn,
      error: profileInfo.error
    };
  } catch (error) {
    console.error('Error checking SSO login status:', error);
    return {
      authenticated: false,
      profileName,
      error: error.message
    };
  }
}

/**
 * Gets SSO login status for all SSO profiles
 * @returns {Promise<Array>} Array of SSO profile status objects
 */
async function getAllSSOLoginStatus() {
  try {
    const profiles = await getAvailableProfiles();
    const ssoProfiles = [];
    
    // Check each profile to see if it's SSO and get its status
    for (const profile of profiles) {
      const isSSO = await isSSOProfile(profile);
      if (isSSO) {
        const loginStatus = await checkSSOLoginStatus(profile);
        ssoProfiles.push({
          profileName: profile,
          ...loginStatus
        });
      }
    }
    
    return ssoProfiles;
  } catch (error) {
    console.error('Error getting all SSO login status:', error);
    throw new Error(`Failed to get SSO login status: ${error.message}`);
  }
}

// Export all profile service functions
module.exports = {
  getAvailableProfiles,
  testProfile,
  createProfile,
  createIAMProfile,
  createSSOProfile,
  deleteProfile,
  performSSOLogin,
  checkSSOLoginStatus,
  getAllSSOLoginStatus,
}; 