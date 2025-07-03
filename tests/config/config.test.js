/**
 * Configuration Management Tests
 * 
 * Basic tests for the configuration management system
 */

const fs = require('fs');
const Config = require('../../src/config/config');

// Mock fs.promises
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn()
  }
}));

describe('Configuration Management', () => {
  let config;

  beforeEach(() => {
    jest.clearAllMocks();
    config = new Config();
  });

  describe('Configuration Initialization', () => {
    test('should create config instance with default settings', () => {
      expect(config).toBeDefined();
      expect(config.configPath).toBeDefined();
      expect(config.configFile).toBeDefined();
    });

    test('should have correct default configuration structure', () => {
      expect(config.defaultConfig).toHaveProperty('aws');
      expect(config.defaultConfig).toHaveProperty('ui');
      expect(config.defaultConfig).toHaveProperty('sessions');
      expect(config.defaultConfig).toHaveProperty('portForwarding');
      
      expect(config.defaultConfig.aws).toHaveProperty('region');
      expect(config.defaultConfig.aws).toHaveProperty('profile');
    });

    test('should load existing configuration from file', async () => {
      const mockConfigData = {
        aws: { region: 'us-east-1', profile: 'test' },
        ui: { theme: 'dark' }
      };
      
      fs.promises.access.mockResolvedValue();
      fs.promises.readFile.mockResolvedValue(JSON.stringify(mockConfigData));
      
      const result = await config.load();
      
      // Should merge with defaults
      expect(result.aws.region).toBe('us-east-1');
      expect(result.aws.profile).toBe('test');
      expect(result.ui.theme).toBe('dark');
      expect(result.sessions.maxSessions).toBe(5); // From defaults
    });

    test('should create default configuration when file does not exist', async () => {
      // Mock both access and readFile to fail
      fs.promises.access.mockRejectedValue(new Error('File not found'));
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));
      
      const result = await config.load();
      
      expect(result).toEqual(config.defaultConfig);
    });
  });

  describe('Configuration Methods', () => {
    test('should get AWS configuration', async () => {
      // Mock to return defaults
      fs.promises.access.mockRejectedValue(new Error('File not found'));
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));
      
      const awsConfig = await config.getAwsConfig();
      expect(awsConfig).toHaveProperty('region');
      expect(awsConfig).toHaveProperty('profile');
    });

    test('should get UI configuration', async () => {
      // Mock to return defaults
      fs.promises.access.mockRejectedValue(new Error('File not found'));
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));
      
      const uiConfig = await config.getUIConfig();
      expect(uiConfig).toHaveProperty('theme');
      expect(uiConfig).toHaveProperty('windowSize');
    });

    test('should get session configuration', async () => {
      // Mock to return defaults
      fs.promises.access.mockRejectedValue(new Error('File not found'));
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));
      
      const sessionConfig = await config.getSessionConfig();
      expect(sessionConfig).toHaveProperty('autoReconnect');
      expect(sessionConfig).toHaveProperty('maxSessions');
    });

    test('should get port forwarding configuration', async () => {
      // Mock to return defaults
      fs.promises.access.mockRejectedValue(new Error('File not found'));
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));
      
      const portForwardingConfig = await config.getPortForwardingConfig();
      expect(portForwardingConfig).toHaveProperty('defaultLocalPort');
      expect(portForwardingConfig).toHaveProperty('defaultRemotePort');
    });
  });

  describe('Error Handling', () => {
    test('should handle file read errors gracefully', async () => {
      fs.promises.access.mockResolvedValue();
      fs.promises.readFile.mockRejectedValue(new Error('Read error'));
      
      const result = await config.load();
      
      expect(result).toEqual(config.defaultConfig);
    });
  });
}); 