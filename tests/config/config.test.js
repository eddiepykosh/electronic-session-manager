/**
 * Configuration Management Tests
 * 
 * HIGH-LEVEL SUMMARY:
 * This test suite validates the configuration management system for the Electronic Session Manager.
 * It tests the Config class functionality including initialization, loading from files,
 * merging with defaults, and accessing specific configuration sections.
 * 
 * Test coverage includes:
 * - Configuration initialization with default values
 * - Loading existing configuration from files
 * - Handling missing configuration files
 * - Accessing specific configuration sections (AWS, UI, Sessions, Port Forwarding)
 * - Error handling for file operations
 * - Configuration structure validation
 */

const fs = require('fs');
const Config = require('../../src/config/config');

// Mock fs.promises to avoid actual file system operations during testing
// This allows testing file operations without touching the actual filesystem
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(), // Mock file existence check
    readFile: jest.fn(), // Mock file reading
    writeFile: jest.fn(), // Mock file writing
    mkdir: jest.fn() // Mock directory creation
  }
}));

describe('Configuration Management', () => {
  let config;

  // Set up a fresh Config instance before each test
  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mock function calls
    config = new Config(); // Create new Config instance
  });

  describe('Configuration Initialization', () => {
    /**
     * Test: Config instance creation with default settings
     * 
     * Validates that a Config instance can be created successfully
     * and has the expected properties for configuration paths.
     */
    test('should create config instance with default settings', () => {
      expect(config).toBeDefined(); // Ensure config object exists
      expect(config.configPath).toBeDefined(); // Ensure config path is set
      expect(config.configFile).toBeDefined(); // Ensure config file path is set
    });

    /**
     * Test: Default configuration structure validation
     * 
     * Verifies that the default configuration object has the expected
     * structure with all required sections and properties.
     */
    test('should have correct default configuration structure', () => {
      // Check that all major configuration sections exist
      expect(config.defaultConfig).toHaveProperty('aws'); // AWS configuration section
      expect(config.defaultConfig).toHaveProperty('ui'); // UI configuration section
      expect(config.defaultConfig).toHaveProperty('sessions'); // Sessions configuration section
      expect(config.defaultConfig).toHaveProperty('portForwarding'); // Port forwarding configuration section
      
      // Check that AWS section has required properties
      expect(config.defaultConfig.aws).toHaveProperty('region'); // AWS region setting
      expect(config.defaultConfig.aws).toHaveProperty('profile'); // AWS profile setting
    });

    /**
     * Test: Loading existing configuration from file
     * 
     * Tests the scenario where a configuration file already exists
     * and verifies that it's loaded and merged with default values.
     */
    test('should load existing configuration from file', async () => {
      // Mock configuration data that would be read from file
      const mockConfigData = {
        aws: { region: 'us-east-1', profile: 'test' },
        ui: { theme: 'dark' }
      };
      
      // Mock file system operations to simulate existing file
      fs.promises.access.mockResolvedValue(); // File exists
      fs.promises.readFile.mockResolvedValue(JSON.stringify(mockConfigData)); // Return mock data
      
      // Load configuration
      const result = await config.load();
      
      // Verify that loaded values are used and defaults are preserved
      expect(result.aws.region).toBe('us-east-1'); // Custom region from file
      expect(result.aws.profile).toBe('test'); // Custom profile from file
      expect(result.ui.theme).toBe('dark'); // Custom theme from file
      expect(result.sessions.maxSessions).toBe(5); // Default value preserved
    });

    /**
     * Test: Creating default configuration when file doesn't exist
     * 
     * Tests the scenario where no configuration file exists
     * and verifies that default configuration is returned.
     */
    test('should create default configuration when file does not exist', async () => {
      // Mock both access and readFile to fail (file doesn't exist)
      fs.promises.access.mockRejectedValue(new Error('File not found'));
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));
      
      // Load configuration
      const result = await config.load();
      
      // Verify that default configuration is returned
      expect(result).toEqual(config.defaultConfig);
    });
  });

  describe('Configuration Methods', () => {
    /**
     * Test: Getting AWS configuration section
     * 
     * Verifies that the getAwsConfig method returns the AWS
     * configuration section with expected properties.
     */
    test('should get AWS configuration', async () => {
      // Mock to return defaults (no existing file)
      fs.promises.access.mockRejectedValue(new Error('File not found'));
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));
      
      // Get AWS configuration
      const awsConfig = await config.getAwsConfig();
      
      // Verify AWS configuration structure
      expect(awsConfig).toHaveProperty('region'); // AWS region setting
      expect(awsConfig).toHaveProperty('profile'); // AWS profile setting
    });

    /**
     * Test: Getting UI configuration section
     * 
     * Verifies that the getUIConfig method returns the UI
     * configuration section with expected properties.
     */
    test('should get UI configuration', async () => {
      // Mock to return defaults (no existing file)
      fs.promises.access.mockRejectedValue(new Error('File not found'));
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));
      
      // Get UI configuration
      const uiConfig = await config.getUIConfig();
      
      // Verify UI configuration structure
      expect(uiConfig).toHaveProperty('theme'); // UI theme setting
      expect(uiConfig).toHaveProperty('windowSize'); // Window size setting
    });

    /**
     * Test: Getting session configuration section
     * 
     * Verifies that the getSessionConfig method returns the sessions
     * configuration section with expected properties.
     */
    test('should get session configuration', async () => {
      // Mock to return defaults (no existing file)
      fs.promises.access.mockRejectedValue(new Error('File not found'));
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));
      
      // Get session configuration
      const sessionConfig = await config.getSessionConfig();
      
      // Verify session configuration structure
      expect(sessionConfig).toHaveProperty('autoReconnect'); // Auto-reconnect setting
      expect(sessionConfig).toHaveProperty('maxSessions'); // Maximum sessions setting
    });

    /**
     * Test: Getting port forwarding configuration section
     * 
     * Verifies that the getPortForwardingConfig method returns the port
     * forwarding configuration section with expected properties.
     */
    test('should get port forwarding configuration', async () => {
      // Mock to return defaults (no existing file)
      fs.promises.access.mockRejectedValue(new Error('File not found'));
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));
      
      // Get port forwarding configuration
      const portForwardingConfig = await config.getPortForwardingConfig();
      
      // Verify port forwarding configuration structure
      expect(portForwardingConfig).toHaveProperty('defaultLocalPort'); // Default local port
      expect(portForwardingConfig).toHaveProperty('defaultRemotePort'); // Default remote port
    });
  });

  describe('Error Handling', () => {
    /**
     * Test: Handling file read errors gracefully
     * 
     * Verifies that the configuration system handles file read errors
     * gracefully by falling back to default configuration.
     */
    test('should handle file read errors gracefully', async () => {
      // Mock file exists but read fails
      fs.promises.access.mockResolvedValue(); // File exists
      fs.promises.readFile.mockRejectedValue(new Error('Read error')); // Read fails
      
      // Load configuration
      const result = await config.load();
      
      // Verify that default configuration is returned on error
      expect(result).toEqual(config.defaultConfig);
    });
  });
}); 