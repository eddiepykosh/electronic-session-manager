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

async function getAvailableProfiles() {
  try {
    await ensureAWSCLI();
    
    const profiles = new Set(['default']);
    
    try {
      const credentialsContent = await fs.readFile(credentialsPath, 'utf8');
      const profileMatches = credentialsContent.match(/\[([^\]]+)\]/g);
      if (profileMatches) {
        profileMatches.forEach(match => {
          const profileName = match.slice(1, -1);
          if (profileName !== 'default') {
            profiles.add(profileName);
          }
        });
      }
    } catch (error) {
      console.log('No AWS credentials file found or unable to read');
    }

    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      const profileMatches = configContent.match(/\[profile ([^\]]+)\]/g);
      if (profileMatches) {
        profileMatches.forEach(match => {
          const profileName = match.slice(9, -1);
          profiles.add(profileName);
        });
      }
    } catch (error) {
      console.log('No AWS config file found or unable to read');
    }

    try {
      const { stdout } = await execAsync('aws configure list-profiles');
      const cliProfiles = stdout.trim().split('\n').filter(p => p.trim());
      cliProfiles.forEach(profile => profiles.add(profile));
    } catch (error) {
      console.log('Unable to list profiles via AWS CLI, using file-based detection');
    }

    return Array.from(profiles).sort();
  } catch (error) {
    console.error('Error getting available profiles:', error);
    return ['default'];
  }
}

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

async function createIAMProfile(profileName, { accessKeyId, secretAccessKey, sessionToken, region = 'us-east-1' }) {
  try {
    if (!profileName || !accessKeyId || !secretAccessKey) {
      throw new Error('Profile name, access key ID, and secret access key are required');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(profileName)) {
      throw new Error('Profile name can only contain letters, numbers, underscores, and hyphens');
    }

    const existsInFiles = await profileExistsInFiles(profileName);
    if (existsInFiles) {
      throw new Error(`Profile "${profileName}" already exists in AWS configuration files`);
    }

    const existingProfiles = await getAvailableProfiles();
    if (existingProfiles.includes(profileName)) {
      throw new Error(`Profile "${profileName}" already exists`);
    }

    let credentialsEntry = `[${profileName}]
aws_access_key_id = ${accessKeyId}
aws_secret_access_key = ${secretAccessKey}
`;
    
    if (sessionToken && sessionToken.trim()) {
      credentialsEntry += `aws_session_token = ${sessionToken}
`;
    }

    await appendToCredentialsFile(credentialsEntry);

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

async function createSSOProfile(profileName, { ssoStartUrl, ssoRegion, accountId, roleName, region = 'us-east-1' }) {
  try {
    if (!profileName || !ssoStartUrl || !ssoRegion || !accountId || !roleName) {
      throw new Error('Profile name, SSO start URL, SSO region, account ID, and role name are required');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(profileName)) {
      throw new Error('Profile name can only contain letters, numbers, underscores, and hyphens');
    }

    const existsInFiles = await profileExistsInFiles(profileName);
    if (existsInFiles) {
      throw new Error(`Profile "${profileName}" already exists in AWS configuration files`);
    }

    const existingProfiles = await getAvailableProfiles();
    if (existingProfiles.includes(profileName)) {
      throw new Error(`Profile "${profileName}" already exists`);
    }

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

async function removeFromCredentialsFile(profileName) {
  try {
    const content = await fs.readFile(credentialsPath, 'utf8');
    const lines = content.split('\n');
    const newLines = [];
    let skipSection = false;
    
    for (const line of lines) {
      if (line.trim() === `[${profileName}]`) {
        skipSection = true;
        continue;
      }
      
      if (skipSection && line.trim().startsWith('[') && line.trim().endsWith(']')) {
        skipSection = false;
      }
      
      if (!skipSection) {
        newLines.push(line);
      }
    }
    
    await fs.writeFile(credentialsPath, newLines.join('\n'));
  } catch (error) {
    console.log('Profile not found in credentials file or file does not exist');
  }
}

async function removeFromConfigFile(profileName) {
  try {
    const content = await fs.readFile(configPath, 'utf8');
    const lines = content.split('\n');
    const newLines = [];
    let skipSection = false;
    
    for (const line of lines) {
      if (line.trim() === `[profile ${profileName}]`) {
        skipSection = true;
        continue;
      }
      
      if (skipSection && line.trim().startsWith('[') && line.trim().endsWith(']')) {
        skipSection = false;
      }
      
      if (!skipSection) {
        newLines.push(line);
      }
    }
    
    await fs.writeFile(configPath, newLines.join('\n'));
  } catch (error) {
    console.log('Profile not found in config file or file does not exist');
  }
}

async function deleteProfile(profileName) {
  try {
    await ensureAWSCLI();
    
    if (!profileName) {
      throw new Error('Profile name is required');
    }

    const existingProfiles = await getAvailableProfiles();
    if (!existingProfiles.includes(profileName)) {
      throw new Error(`Profile "${profileName}" does not exist`);
    }

    if (profileName === 'default') {
      throw new Error('Cannot delete the default profile');
    }

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

async function performSSOLogin(profileName) {
  try {
    await ensureAWSCLI();
    
    if (!profileName) {
      throw new Error('Profile name is required');
    }

    const existingProfiles = await getAvailableProfiles();
    if (!existingProfiles.includes(profileName)) {
      throw new Error(`Profile "${profileName}" does not exist`);
    }

    const isSSO = await isSSOProfile(profileName);
    if (!isSSO) {
      throw new Error(`Profile "${profileName}" is not an SSO profile`);
    }

    console.log(`Starting SSO login for profile: ${profileName}`);
    
    const command = `aws sso login --profile ${profileName}`;
    console.log('SSO login command:', command);
    
    const { stdout, stderr } = await execAsync(command);
    
    console.log('SSO login stdout:', stdout);
    if (stderr) {
      console.log('SSO login stderr:', stderr);
    }
    
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

async function checkSSOLoginStatus(profileName) {
  try {
    await ensureAWSCLI();
    
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

async function getAllSSOLoginStatus() {
  try {
    const profiles = await getAvailableProfiles();
    const ssoProfiles = [];
    
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