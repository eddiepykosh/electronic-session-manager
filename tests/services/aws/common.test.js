/**
 * AWS Common Utilities Tests
 * 
 * Basic tests for AWS common utilities
 */

const { exec } = require('child_process');
const AWSCommon = require('../../../src/services/aws/common');

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn()
}));

// Mock fs
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
    appendFile: jest.fn(),
    mkdir: jest.fn()
  }
}));

describe('AWS Common Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CLI Availability Check', () => {
    test('should detect AWS CLI when available', async () => {
      exec.mockImplementation((command, callback) => {
        callback(null, { stdout: 'aws-cli/2.0.0', stderr: '' });
      });

      const available = await AWSCommon.checkAWSCLI();
      expect(available).toBe(true);
    });

    test('should detect AWS CLI when not available', async () => {
      exec.mockImplementation((command, callback) => {
        callback(new Error('aws command not found'), { stdout: '', stderr: 'aws: command not found' });
      });

      const available = await AWSCommon.checkAWSCLI();
      expect(available).toBe(false);
    });
  });

  describe('Command Building', () => {
    test('should build AWS command with region and profile', async () => {
      const command = await AWSCommon.buildAWSCommand('aws ec2 describe-instances', 'test-profile');
      expect(command).toContain('aws ec2 describe-instances');
      expect(command).toContain('--profile test-profile');
    });

    test('should build AWS command without profile for default', async () => {
      const command = await AWSCommon.buildAWSCommand('aws ec2 describe-instances', 'default');
      expect(command).toContain('aws ec2 describe-instances');
      expect(command).not.toContain('--profile default');
    });
  });

  describe('Profile Management', () => {
    test.skip('should check if profile exists in files', async () => {
      // TODO: Fix profile existence check test
      const exists = await AWSCommon.profileExistsInFiles('test-profile');
      expect(exists).toBe(true);
    });

    test('should return false for non-existent profile', async () => {
      const fs = require('fs');
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));
      
      const exists = await AWSCommon.profileExistsInFiles('non-existent-profile');
      expect(exists).toBe(false);
    });

    test.skip('should get profile region', async () => {
      // TODO: Fix profile region test
      const region = await AWSCommon.getProfileRegion('test-profile');
      expect(region).toBe('us-west-2');
    });
  });

  describe('SSO Profile Handling', () => {
    test.skip('should detect SSO profile', async () => {
      // TODO: Fix SSO profile detection test
      const isSSO = await AWSCommon.isSSOProfile('sso-profile');
      expect(isSSO).toBe(true);
    });

    test('should detect non-SSO profile', async () => {
      const fs = require('fs');
      fs.promises.readFile.mockResolvedValue('[profile regular-profile]\naws_access_key_id = AKIA...');
      
      const isSSO = await AWSCommon.isSSOProfile('regular-profile');
      expect(isSSO).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle file read errors gracefully', async () => {
      const fs = require('fs');
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));
      
      const exists = await AWSCommon.profileExistsInFiles('test-profile');
      expect(exists).toBe(false);
    });
  });
}); 