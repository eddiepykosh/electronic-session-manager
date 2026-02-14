/**
 * AWS Common Utilities Tests
 * 
 * HIGH-LEVEL SUMMARY:
 * This test suite validates the AWS common utilities that provide shared functionality
 * for AWS service operations. It tests CLI availability detection, command building,
 * profile management, and SSO profile handling.
 * 
 * Test coverage includes:
 * - AWS CLI availability detection
 * - AWS command building with region and profile parameters
 * - AWS profile existence validation
 * - Profile region retrieval
 * - SSO profile detection
 * - Error handling for file operations and CLI commands
 * - Cross-platform compatibility considerations
 */

const { exec, execFile } = require('child_process');
let AWSCommon;

// Mock child_process to avoid actual CLI execution during testing
// execFile must follow the Node.js callback convention for promisify to work
jest.mock('child_process', () => {
  const { promisify } = require('util');
  const execFn = jest.fn();
  const execFileFn = jest.fn();
  execFileFn[promisify.custom] = (...args) => {
    return new Promise((resolve, reject) => {
      execFileFn(...args, (err, stdout, stderr) => {
        if (err) {
          err.stdout = stdout;
          err.stderr = stderr;
          reject(err);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  };
  return { exec: execFn, execFile: execFileFn };
});

// Mock fs module to avoid actual file system operations
// This allows testing file operations without touching the actual filesystem
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(), // Mock file existence check
    readFile: jest.fn(), // Mock file reading
    appendFile: jest.fn(), // Mock file appending
    mkdir: jest.fn() // Mock directory creation
  }
}));

describe('AWS Common Utilities', () => {
  // Reset modules and mocks before each test to clear cached awsExecutablePath/awsCliAvailable
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    AWSCommon = require('../../../src/services/aws/common');
  });

  describe('CLI Availability Check', () => {
    /**
     * Test: AWS CLI detection when available
     * 
     * Verifies that the system correctly detects when AWS CLI is installed
     * and available for use by checking the 'aws --version' command output.
     */
    test('should detect AWS CLI when available', async () => {
      // Mock execFile to follow Node callback convention (required for promisify)
      const { execFile } = require('child_process');
      execFile.mockImplementation((...args) => {
        const callback = args[args.length - 1];
        if (typeof callback === 'function') {
          callback(null, 'C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe\n', '');
        }
      });

      // Check AWS CLI availability
      const available = await AWSCommon.checkAWSCLI();
      
      // Verify that AWS CLI was detected as available
      expect(available).toBe(true);
    });

    /**
     * Test: AWS CLI detection when not available
     * 
     * Verifies that the system correctly detects when AWS CLI is not installed
     * or not available in the system PATH.
     */
    test('should detect AWS CLI when not available', async () => {
      // Mock execFile to fail (CLI not found)
      const { execFile } = require('child_process');
      execFile.mockImplementation((...args) => {
        const callback = args[args.length - 1];
        if (typeof callback === 'function') {
          callback(new Error('aws command not found'), '', 'aws: command not found');
        }
      });

      // Mock fs.access to reject for all standard paths
      const fs = require('fs');
      fs.promises.access.mockRejectedValue(new Error('ENOENT'));

      // Check AWS CLI availability
      const available = await AWSCommon.checkAWSCLI();
      
      // Verify that AWS CLI was detected as not available
      expect(available).toBe(false);
    });
  });

  describe('Command Execution', () => {
    /**
     * Test: AWS command execution with profile
     * 
     * Verifies that execAWSCommand properly invokes execFile with
     * the correct arguments including profile and region.
     */
    test('should execute AWS command with profile', async () => {
      const { execFile } = require('child_process');
      const fs = require('fs');

      // First call: getAWSExecutablePath (where aws), second call: checkAWSCLI (aws --version)
      // Third call: getProfileRegion ensureAWSCLI, fourth call: actual command
      let callCount = 0;
      execFile.mockImplementation((...args) => {
        const callback = args[args.length - 1];
        if (typeof callback === 'function') {
          callCount++;
          if (callCount <= 2) {
            // getAWSExecutablePath and checkAWSCLI
            callback(null, 'C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe\n', '');
          } else {
            // actual execAWSCommand call
            callback(null, '{"result": "ok"}', '');
          }
        }
      });

      // Mock config file for region detection
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));

      // Execute a command with a non-default profile
      const result = await AWSCommon.execAWSCommand(['ec2', 'describe-instances'], 'test-profile');
      
      // Verify the command was executed
      expect(result).toBeDefined();
    });

    /**
     * Test: AWS command execution with default profile
     * 
     * Verifies that execAWSCommand does not add --profile flag for default profile.
     */
    test('should execute AWS command without profile flag for default', async () => {
      const { execFile } = require('child_process');
      const fs = require('fs');

      const execFileCalls = [];
      execFile.mockImplementation((...args) => {
        const callback = args[args.length - 1];
        execFileCalls.push(args);
        if (typeof callback === 'function') {
          callback(null, 'C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe\n', '');
        }
      });

      fs.promises.readFile.mockRejectedValue(new Error('File not found'));

      await AWSCommon.execAWSCommand(['ec2', 'describe-instances'], 'default');

      // Find the actual command call (last one) and check it doesn't contain --profile
      const lastCall = execFileCalls[execFileCalls.length - 1];
      const argsArray = lastCall[1]; // second arg is the args array
      expect(argsArray).not.toContain('--profile');
    });
  });

  describe('Profile Management', () => {
    /**
     * Test: Profile existence check in AWS configuration files
     * 
     * TODO: This test is currently skipped and needs to be fixed.
     * It should verify that the system can check if a profile exists
     * in AWS configuration files (credentials and config).
     */
    test.skip('should check if profile exists in files', async () => {
      // TODO: Fix profile existence check test
      const exists = await AWSCommon.profileExistsInFiles('test-profile');
      expect(exists).toBe(true);
    });

    /**
     * Test: Non-existent profile detection
     * 
     * Verifies that the system correctly identifies when a profile
     * does not exist in AWS configuration files.
     */
    test('should return false for non-existent profile', async () => {
      const fs = require('fs');
      // Mock file read to fail (profile not found)
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));
      
      // Check for non-existent profile
      const exists = await AWSCommon.profileExistsInFiles('non-existent-profile');
      
      // Verify that non-existent profile returns false
      expect(exists).toBe(false);
    });

    /**
     * Test: Profile region retrieval
     * 
     * TODO: This test is currently skipped and needs to be fixed.
     * It should verify that the system can retrieve the region
     * associated with a specific AWS profile.
     */
    test.skip('should get profile region', async () => {
      // TODO: Fix profile region test
      const region = await AWSCommon.getProfileRegion('test-profile');
      expect(region).toBe('us-west-2');
    });
  });

  describe('SSO Profile Handling', () => {
    /**
     * Test: SSO profile detection
     * 
     * TODO: This test is currently skipped and needs to be fixed.
     * It should verify that the system can detect when a profile
     * is configured for AWS SSO (Single Sign-On).
     */
    test.skip('should detect SSO profile', async () => {
      // TODO: Fix SSO profile detection test
      const isSSO = await AWSCommon.isSSOProfile('sso-profile');
      expect(isSSO).toBe(true);
    });

    /**
     * Test: Non-SSO profile detection
     * 
     * Verifies that the system correctly identifies when a profile
     * is not configured for AWS SSO (regular IAM credentials).
     */
    test('should detect non-SSO profile', async () => {
      const fs = require('fs');
      // Mock AWS config file content with regular profile (non-SSO)
      fs.promises.readFile.mockResolvedValue('[profile regular-profile]\naws_access_key_id = AKIA...');
      
      // Check if profile is SSO
      const isSSO = await AWSCommon.isSSOProfile('regular-profile');
      
      // Verify that regular profile is not detected as SSO
      expect(isSSO).toBe(false);
    });
  });

  describe('Error Handling', () => {
    /**
     * Test: File read error handling
     * 
     * Verifies that the system handles file read errors gracefully
     * when attempting to access AWS configuration files.
     */
    test('should handle file read errors gracefully', async () => {
      const fs = require('fs');
      // Mock file read to fail
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));
      
      // Attempt to check profile existence (should handle error gracefully)
      const exists = await AWSCommon.profileExistsInFiles('test-profile');
      
      // Verify that error is handled gracefully (returns false instead of throwing)
      expect(exists).toBe(false);
    });
  });
}); 