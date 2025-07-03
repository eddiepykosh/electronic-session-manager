/**
 * Configuration Management - Electronic Session Manager
 * 
 * This file handles all application configuration management, including loading,
 * saving, and providing access to user preferences and application settings.
 * 
 * Key Responsibilities:
 * - Manages persistent configuration storage
 * - Provides default configuration values
 * - Handles configuration file I/O operations
 * - Offers typed access to different configuration sections
 * - Ensures configuration directory exists
 * 
 * Architecture Role:
 * - Provides centralized configuration management
 * - Enables user preference persistence across sessions
 * - Offers clean API for accessing configuration data
 * - Handles configuration file creation and updates
 * - Maintains configuration schema and defaults
 * 
 * Configuration Sections:
 * - AWS: Region and profile settings
 * - UI: Theme and window size preferences
 * - Sessions: Session management preferences
 * - Port Forwarding: Default port configurations
 * 
 * File Structure:
 * - Configuration stored in user's home directory
 * - JSON format for human readability
 * - Automatic directory creation if needed
 * - Graceful fallback to defaults if file missing
 */

const path = require('path');
const fs = require('fs').promises;

/**
 * Configuration management class
 * Handles all application configuration operations including loading, saving, and accessing settings
 */
class Config {
  /**
   * Constructor initializes configuration paths and default values
   * Sets up the configuration file location and default configuration schema
   */
  constructor() {
    // Determine the configuration directory based on the operating system
    // Uses APPDATA on Windows, HOME on Unix-like systems
    this.configPath = path.join(process.env.APPDATA || process.env.HOME, '.electronic-session-manager');
    
    // Configuration file path within the config directory
    this.configFile = path.join(this.configPath, 'config.json');
    
    // Default configuration values that will be used if no config file exists
    this.defaultConfig = {
      // AWS-specific configuration
      aws: {
        region: 'us-gov-west-1',  // Default AWS region
        profile: 'default'        // Default AWS profile
      },
      
      // User interface configuration
      ui: {
        theme: 'light',           // Default theme (light/dark)
        windowSize: {
          width: 1200,           // Default window width
          height: 800            // Default window height
        }
      },
      
      // Session management configuration
      sessions: {
        autoReconnect: false,    // Whether to automatically reconnect to sessions
        maxSessions: 5          // Maximum number of concurrent sessions
      },
      
      // Port forwarding configuration
      portForwarding: {
        defaultLocalPort: 13389,  // Default local port for RDP forwarding
        defaultRemotePort: 3389   // Default remote port for RDP forwarding
      }
    };
  }

  /**
   * Loads configuration from file, merging with defaults
   * Creates default configuration if no file exists
   * @returns {Promise<Object>} Merged configuration object
   */
  async load() {
    try {
      // Ensure the configuration directory exists
      await this.ensureConfigDirectory();
      
      // Read the configuration file
      const data = await fs.readFile(this.configFile, 'utf8');
      const config = JSON.parse(data);
      
      // Merge with defaults, allowing user config to override defaults
      return { ...this.defaultConfig, ...config };
    } catch (error) {
      // If no config file exists or there's an error reading it, use defaults
      console.log('No config file found, using defaults');
      return this.defaultConfig;
    }
  }

  /**
   * Saves configuration to file
   * Creates the configuration directory if it doesn't exist
   * @param {Object} config - Configuration object to save
   * @returns {Promise<boolean>} True if save was successful
   * @throws {Error} If saving fails
   */
  async save(config) {
    try {
      // Ensure the configuration directory exists
      await this.ensureConfigDirectory();
      
      // Write the configuration to file with pretty formatting
      await fs.writeFile(this.configFile, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      throw new Error(`Failed to save config: ${error.message}`);
    }
  }

  /**
   * Ensures the configuration directory exists
   * Creates the directory and any parent directories if needed
   */
  async ensureConfigDirectory() {
    try {
      // Check if the directory exists
      await fs.access(this.configPath);
    } catch (error) {
      // If directory doesn't exist, create it recursively
      await fs.mkdir(this.configPath, { recursive: true });
    }
  }

  // ===== AWS CONFIGURATION METHODS =====
  
  /**
   * Gets the AWS configuration section
   * @returns {Promise<Object>} AWS configuration object
   */
  async getAwsConfig() {
    const config = await this.load();
    return config.aws;
  }

  /**
   * Updates the AWS configuration section
   * Merges new values with existing AWS configuration
   * @param {Object} awsConfig - AWS configuration to merge
   */
  async setAwsConfig(awsConfig) {
    const config = await this.load();
    config.aws = { ...config.aws, ...awsConfig };
    await this.save(config);
  }

  // ===== UI CONFIGURATION METHODS =====
  
  /**
   * Gets the UI configuration section
   * @returns {Promise<Object>} UI configuration object
   */
  async getUIConfig() {
    const config = await this.load();
    return config.ui;
  }

  /**
   * Updates the UI configuration section
   * Merges new values with existing UI configuration
   * @param {Object} uiConfig - UI configuration to merge
   */
  async setUIConfig(uiConfig) {
    const config = await this.load();
    config.ui = { ...config.ui, ...uiConfig };
    await this.save(config);
  }

  // ===== SESSION CONFIGURATION METHODS =====
  
  /**
   * Gets the session configuration section
   * @returns {Promise<Object>} Session configuration object
   */
  async getSessionConfig() {
    const config = await this.load();
    return config.sessions;
  }

  /**
   * Updates the session configuration section
   * Merges new values with existing session configuration
   * @param {Object} sessionConfig - Session configuration to merge
   */
  async setSessionConfig(sessionConfig) {
    const config = await this.load();
    config.sessions = { ...config.sessions, ...sessionConfig };
    await this.save(config);
  }

  // ===== PORT FORWARDING CONFIGURATION METHODS =====
  
  /**
   * Gets the port forwarding configuration section
   * @returns {Promise<Object>} Port forwarding configuration object
   */
  async getPortForwardingConfig() {
    const config = await this.load();
    return config.portForwarding;
  }

  /**
   * Updates the port forwarding configuration section
   * Merges new values with existing port forwarding configuration
   * @param {Object} portForwardingConfig - Port forwarding configuration to merge
   */
  async setPortForwardingConfig(portForwardingConfig) {
    const config = await this.load();
    config.portForwarding = { ...config.portForwarding, ...portForwardingConfig };
    await this.save(config);
  }
}

module.exports = Config; 