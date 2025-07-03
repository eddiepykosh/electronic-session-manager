/**
 * Main Process Entry Point - Electronic Session Manager
 * 
 * This file serves as the main process entry point for the Electron application.
 * It handles the core application lifecycle, window management, and IPC (Inter-Process Communication)
 * between the main process and renderer process.
 * 
 * Key Responsibilities:
 * - Application initialization and lifecycle management
 * - Browser window creation and management
 * - IPC handler setup for AWS operations, configuration, and logging
 * - Service initialization (AWS, Configuration, Logging)
 * - Log message forwarding from main process to renderer
 * - Windows installer integration handling
 * 
 * Architecture Role:
 * - Acts as the bridge between the renderer process (UI) and AWS services
 * - Manages all AWS CLI operations through the AWSService
 * - Handles configuration persistence and loading
 * - Provides secure communication channels via IPC
 * 
 * Security Features:
 * - Context isolation enabled (renderer cannot access Node.js APIs directly)
 * - Node integration disabled for security
 * - All communication goes through preload script
 * - Secure IPC handlers for AWS operations
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

// Import core services that handle business logic
const AWSService = require('../services/awsService');  // AWS CLI integration and operations
const Config = require('../config/config');           // Configuration management
const logger = require('../utils/logger');            // Logging utility

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// This is required for proper Windows installer integration with Electron Squirrel
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Global variables to maintain references to key application components
let mainWindow;    // Reference to the main browser window
let awsService;    // AWS service instance for CLI operations
let config;        // Configuration service instance

/**
 * Creates and configures the main application window
 * Sets up security preferences, loads the HTML file, and optionally opens DevTools
 */
const createWindow = () => {
  // Create the browser window with security-focused configuration
  mainWindow = new BrowserWindow({
    width: 1200,   // Initial window width
    height: 800,   // Initial window height
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),  // Preload script for secure API exposure
      nodeIntegration: false,    // Disable Node.js integration for security
      contextIsolation: true,    // Enable context isolation for security
    },
  });

  // Load the main HTML file that contains the application UI
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // Open the DevTools in development mode for debugging
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Send initial log message to renderer to confirm main process is ready
  sendLogToRenderer('info', 'Main process initialized');
};

/**
 * Sends log messages from main process to renderer process for display in console
 * @param {string} level - Log level (error, warn, info, debug)
 * @param {string} message - Log message to display
 */
const sendLogToRenderer = (level, message) => {
  // Check if window exists and hasn't been destroyed before sending
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('log:message', { level, message });
  }
};

/**
 * Sets up all IPC (Inter-Process Communication) handlers
 * These handlers allow the renderer process to request operations from the main process
 * All AWS operations, configuration management, and logging go through these handlers
 */
const setupIPCHandlers = () => {
  // ===== AWS INSTANCE OPERATIONS =====
  
  /**
   * Handler for fetching EC2 instances from AWS
   * Returns a list of all EC2 instances for the current profile
   */
  ipcMain.handle('aws:get-instances', async () => {
    try {
      sendLogToRenderer('info', 'Fetching EC2 instances...');
      const instances = await awsService.getInstances();
      sendLogToRenderer('info', `Found ${instances.length} instances`);
      return instances;
    } catch (error) {
      sendLogToRenderer('error', `Failed to get instances: ${error.message}`);
      throw error;
    }
  });

  /**
   * Handler for starting an EC2 instance
   * @param {string} instanceId - The ID of the instance to start
   */
  ipcMain.handle('aws:start-instance', async (event, instanceId) => {
    try {
      sendLogToRenderer('info', `Starting instance: ${instanceId}`);
      const result = await awsService.startInstance(instanceId);
      sendLogToRenderer('info', `Instance ${instanceId} started successfully`);
      return result;
    } catch (error) {
      sendLogToRenderer('error', `Failed to start instance ${instanceId}: ${error.message}`);
      throw error;
    }
  });

  /**
   * Handler for stopping an EC2 instance
   * @param {string} instanceId - The ID of the instance to stop
   */
  ipcMain.handle('aws:stop-instance', async (event, instanceId) => {
    try {
      sendLogToRenderer('info', `Stopping instance: ${instanceId}`);
      const result = await awsService.stopInstance(instanceId);
      sendLogToRenderer('info', `Instance ${instanceId} stopped successfully`);
      return result;
    } catch (error) {
      sendLogToRenderer('error', `Failed to stop instance ${instanceId}: ${error.message}`);
      throw error;
    }
  });

  /**
   * Handler for starting an AWS Session Manager session
   * @param {string} instanceId - The ID of the instance to connect to
   */
  ipcMain.handle('aws:start-session', async (event, instanceId) => {
    try {
      sendLogToRenderer('info', `Starting session for instance: ${instanceId}`);
      const result = await awsService.startSession(instanceId);
      sendLogToRenderer('info', `Session started for instance ${instanceId}`);
      return result;
    } catch (error) {
      sendLogToRenderer('error', `Failed to start session for instance ${instanceId}: ${error.message}`);
      throw error;
    }
  });

  // ===== PORT FORWARDING OPERATIONS =====
  
  /**
   * Handler for starting port forwarding to an EC2 instance
   * @param {Object} params - Port forwarding parameters
   * @param {string} params.instanceId - The ID of the target instance
   * @param {number} params.localPort - Local port to forward from
   * @param {number} params.remotePort - Remote port to forward to
   */
  ipcMain.handle('aws:start-port-forwarding', async (event, { instanceId, localPort, remotePort }) => {
    try {
      sendLogToRenderer('info', `Starting port forwarding: ${localPort} -> ${instanceId}:${remotePort}`);
      const result = await awsService.startPortForwarding(instanceId, localPort, remotePort);
      sendLogToRenderer('info', `Port forwarding started: ${localPort} -> ${instanceId}:${remotePort}`);
      return result;
    } catch (error) {
      sendLogToRenderer('error', `Failed to start port forwarding: ${error.message}`);
      throw error;
    }
  });

  /**
   * Handler for stopping port forwarding
   * @param {Object} params - Port forwarding parameters
   * @param {string} params.instanceId - The ID of the instance
   * @param {string} params.sessionId - The session ID to stop
   */
  ipcMain.handle('aws:stop-port-forwarding', async (event, { instanceId, sessionId }) => {
    try {
      sendLogToRenderer('info', `Stopping port forwarding for instance: ${instanceId}`);
      const result = await awsService.stopPortForwarding(instanceId, sessionId);
      sendLogToRenderer('info', `Port forwarding stopped for instance: ${instanceId}`);
      return result;
    } catch (error) {
      sendLogToRenderer('error', `Failed to stop port forwarding: ${error.message}`);
      throw error;
    }
  });

  // ===== SESSION MANAGEMENT OPERATIONS =====
  
  /**
   * Handler for finding orphaned session manager sessions
   * Useful for cleanup when sessions don't terminate properly
   */
  ipcMain.handle('aws:find-orphaned-sessions', async () => {
    try {
      sendLogToRenderer('debug', 'Checking for orphaned sessions...');
      const result = await awsService.findOrphanedSessions();
      sendLogToRenderer('info', `Found ${result.length} orphaned session(s)`);
      return result;
    } catch (error) {
      sendLogToRenderer('error', `Failed to find orphaned sessions: ${error.message}`);
      throw error;
    }
  });

  /**
   * Handler for force killing orphaned sessions
   * Emergency cleanup when sessions are stuck
   */
  ipcMain.handle('aws:force-kill-orphaned-sessions', async () => {
    try {
      sendLogToRenderer('info', 'Force killing orphaned sessions...');
      const result = await awsService.forceKillOrphanedSessions();
      sendLogToRenderer('info', result.message);
      return result;
    } catch (error) {
      sendLogToRenderer('error', `Failed to force kill orphaned sessions: ${error.message}`);
      throw error;
    }
  });

  /**
   * Handler for force killing all session manager plugin processes
   * Nuclear option for cleaning up all AWS session manager processes
   */
  ipcMain.handle('aws:force-kill-all-session-manager-plugins', async () => {
    try {
      sendLogToRenderer('info', 'Force killing all session-manager-plugin processes...');
      const result = await awsService.forceKillAllSessionManagerPlugins();
      sendLogToRenderer(result.success ? 'info' : 'error', result.message);
      return result;
    } catch (error) {
      sendLogToRenderer('error', `Failed to force kill all session-manager-plugin processes: ${error.message}`);
      return { success: false, message: error.message };
    }
  });

  // ===== AWS PROFILE OPERATIONS =====
  
  /**
   * Handler for getting available AWS profiles
   * Returns list of configured AWS profiles from AWS CLI configuration
   */
  ipcMain.handle('aws:get-profiles', async () => {
    try {
      sendLogToRenderer('debug', 'Getting available AWS profiles...');
      const profiles = await awsService.getAvailableProfiles();
      sendLogToRenderer('info', `Found ${profiles.length} available profiles`);
      return profiles;
    } catch (error) {
      sendLogToRenderer('error', `Failed to get profiles: ${error.message}`);
      throw error;
    }
  });

  /**
   * Handler for getting current profile information
   * Returns details about the currently active AWS profile
   */
  ipcMain.handle('aws:get-current-profile', async () => {
    try {
      sendLogToRenderer('debug', 'Getting current profile information...');
      const profileInfo = await awsService.getCurrentProfileInfo();
      sendLogToRenderer('info', `Current profile: ${profileInfo.profile} (${profileInfo.valid ? 'valid' : 'invalid'})`);
      return profileInfo;
    } catch (error) {
      sendLogToRenderer('error', `Failed to get current profile: ${error.message}`);
      throw error;
    }
  });

  /**
   * Handler for setting the active AWS profile
   * @param {string} profile - The profile name to set as active
   */
  ipcMain.handle('aws:set-profile', async (event, profile) => {
    try {
      sendLogToRenderer('info', `Setting active profile to: ${profile}`);
      awsService.setCurrentProfile(profile);
      
      // Test the profile to ensure it's valid after setting
      const profileInfo = await awsService.getCurrentProfileInfo();
      if (profileInfo.valid) {
        sendLogToRenderer('info', `Profile ${profile} set successfully and validated`);
      } else {
        sendLogToRenderer('warn', `Profile ${profile} set but validation failed: ${profileInfo.error}`);
      }
      
      return profileInfo;
    } catch (error) {
      sendLogToRenderer('error', `Failed to set profile: ${error.message}`);
      throw error;
    }
  });

  /**
   * Handler for testing an AWS profile without setting it as active
   * @param {string} profile - The profile name to test
   */
  ipcMain.handle('aws:test-profile', async (event, profile) => {
    try {
      sendLogToRenderer('debug', `Testing profile: ${profile}`);
      const profileInfo = await awsService.testProfile(profile);
      if (profileInfo.valid) {
        sendLogToRenderer('info', `Profile ${profile} is valid`);
      } else {
        sendLogToRenderer('warn', `Profile ${profile} is invalid: ${profileInfo.error}`);
      }
      return profileInfo;
    } catch (error) {
      sendLogToRenderer('error', `Failed to test profile: ${error.message}`);
      throw error;
    }
  });

  /**
   * Handler for creating a new AWS profile
   * @param {Object} params - Profile creation parameters
   * @param {string} params.profileName - Name of the new profile
   * @param {string} params.profileType - Type of profile (credentials, sso, etc.)
   * @param {Object} params.profileData - Profile configuration data
   */
  ipcMain.handle('aws:create-profile', async (event, { profileName, profileType, profileData }) => {
    try {
      sendLogToRenderer('info', `Creating ${profileType} profile: ${profileName}`);
      const result = await awsService.createProfile(profileName, profileType, profileData);
      sendLogToRenderer('info', `Profile ${profileName} created successfully`);
      return result;
    } catch (error) {
      sendLogToRenderer('error', `Failed to create profile: ${error.message}`);
      throw error;
    }
  });

  /**
   * Handler for deleting an AWS profile
   * @param {string} profileName - Name of the profile to delete
   */
  ipcMain.handle('aws:delete-profile', async (event, profileName) => {
    try {
      sendLogToRenderer('info', `Deleting profile: ${profileName}`);
      const result = await awsService.deleteProfile(profileName);
      sendLogToRenderer('info', `Profile ${profileName} deleted successfully`);
      return result;
    } catch (error) {
      sendLogToRenderer('error', `Failed to delete profile: ${error.message}`);
      throw error;
    }
  });

  // ===== SSO LOGIN OPERATIONS =====
  
  /**
   * Handler for performing SSO login for a profile
   * @param {string} profileName - Name of the SSO profile to login
   */
  ipcMain.handle('aws:sso-login', async (event, profileName) => {
    try {
      sendLogToRenderer('info', `Starting SSO login for profile: ${profileName}`);
      const result = await awsService.performSSOLogin(profileName);
      sendLogToRenderer('info', `SSO login completed for profile: ${profileName}`);
      return result;
    } catch (error) {
      sendLogToRenderer('error', `Failed to perform SSO login: ${error.message}`);
      throw error;
    }
  });

  /**
   * Handler for checking SSO login status for a profile
   * @param {string} profileName - Name of the SSO profile to check
   */
  ipcMain.handle('aws:sso-login-status', async (event, profileName) => {
    try {
      sendLogToRenderer('debug', `Checking SSO login status for profile: ${profileName}`);
      const result = await awsService.checkSSOLoginStatus(profileName);
      sendLogToRenderer('info', `SSO login status for ${profileName}: ${result.authenticated ? 'Authenticated' : 'Not authenticated'}`);
      return result;
    } catch (error) {
      sendLogToRenderer('error', `Failed to check SSO login status: ${error.message}`);
      throw error;
    }
  });

  /**
   * Handler for getting SSO login status for all profiles
   * Returns status for all SSO-configured profiles
   */
  ipcMain.handle('aws:get-all-sso-login-status', async () => {
    try {
      sendLogToRenderer('debug', 'Getting SSO login status for all profiles');
      const result = await awsService.getAllSSOLoginStatus();
      sendLogToRenderer('info', `Found ${result.length} SSO profiles`);
      return result;
    } catch (error) {
      sendLogToRenderer('error', `Failed to get SSO login status: ${error.message}`);
      throw error;
    }
  });

  // ===== AWS CLI OPERATIONS =====
  
  /**
   * Handler for checking AWS CLI availability
   * Returns whether AWS CLI is installed and accessible
   */
  ipcMain.handle('aws:check-cli', async () => {
    try {
      sendLogToRenderer('debug', 'Checking AWS CLI availability...');
      const available = await awsService.checkAWSCLI();
      sendLogToRenderer('info', `AWS CLI ${available ? 'available' : 'not available'}`);
      return { available };
    } catch (error) {
      sendLogToRenderer('error', `Failed to check AWS CLI: ${error.message}`);
      return { available: false, error: error.message };
    }
  });

  // ===== CONFIGURATION OPERATIONS =====
  
  /**
   * Handler for loading application configuration
   * Returns the current application configuration
   */
  ipcMain.handle('config:get', async () => {
    try {
      sendLogToRenderer('debug', 'Loading configuration...');
      const configData = await config.load();
      sendLogToRenderer('debug', 'Configuration loaded successfully');
      return configData;
    } catch (error) {
      sendLogToRenderer('error', `Failed to load configuration: ${error.message}`);
      throw error;
    }
  });

  /**
   * Handler for saving application configuration
   * @param {Object} configData - Configuration data to save
   */
  ipcMain.handle('config:save', async (event, configData) => {
    try {
      sendLogToRenderer('debug', 'Saving configuration...');
      await config.save(configData);
      sendLogToRenderer('info', 'Configuration saved successfully');
      return true;
    } catch (error) {
      sendLogToRenderer('error', `Failed to save configuration: ${error.message}`);
      throw error;
    }
  });

  // ===== LOGGING OPERATIONS =====
  
  /**
   * Handler for sending log messages from renderer to main process
   * @param {Object} params - Log parameters
   * @param {string} params.level - Log level
   * @param {string} params.message - Log message
   */
  ipcMain.handle('log:send', async (event, { level, message }) => {
    sendLogToRenderer(level, message);
    return true;
  });

  // ===== UI OPERATIONS =====
  
  /**
   * Handler for showing error messages in the UI
   * @param {string} message - Error message to display
   */
  ipcMain.handle('ui:show-error', async (event, message) => {
    sendLogToRenderer('error', message);
    // TODO: Implement actual error display (toast, dialog, etc.)
    return true;
  });

  /**
   * Handler for showing success messages in the UI
   * @param {string} message - Success message to display
   */
  ipcMain.handle('ui:show-success', async (event, message) => {
    sendLogToRenderer('info', message);
    // TODO: Implement actual success display (toast, dialog, etc.)
    return true;
  });
};

/**
 * Initializes all application services
 * Sets up configuration, AWS service, and logging with proper error handling
 * Ensures the application can start even if AWS CLI is not available
 */
const initializeServices = async () => {
  try {
    sendLogToRenderer('info', 'Initializing services...');
    
    // Initialize configuration service for persistent settings
    config = new Config();
    await config.load();
    sendLogToRenderer('info', 'Configuration service initialized');
    
    // Initialize AWS service with graceful CLI availability handling
    try {
      awsService = new AWSService();
      // Check if AWS CLI is available but don't fail if it's not
      const awsCliAvailable = await awsService.checkAWSCLI();
      if (awsCliAvailable) {
        sendLogToRenderer('info', 'AWS service initialized with CLI available');
      } else {
        sendLogToRenderer('warn', 'AWS service initialized but CLI not available - AWS operations will fail');
      }
    } catch (error) {
      sendLogToRenderer('warn', `AWS service initialization warning: ${error.message}`);
      // Still create the service instance for later use
      awsService = new AWSService();
    }
    
    // Set up logger to forward messages to renderer process
    // This allows log messages from services to appear in the console tab
    const originalInfo = logger.info;
    const originalError = logger.error;
    const originalWarn = logger.warn;
    const originalDebug = logger.debug;

    // Override logger methods to also send messages to renderer
    logger.info = (message, data) => {
      originalInfo.call(logger, message, data);
      sendLogToRenderer('info', message);
    };

    logger.error = (message, data) => {
      originalError.call(logger, message, data);
      sendLogToRenderer('error', message);
    };

    logger.warn = (message, data) => {
      originalWarn.call(logger, message, data);
      sendLogToRenderer('warn', message);
    };

    logger.debug = (message, data) => {
      originalDebug.call(logger, message, data);
      sendLogToRenderer('debug', message);
    };
    
    sendLogToRenderer('info', 'All services initialized successfully');
  } catch (error) {
    sendLogToRenderer('error', `Failed to initialize services: ${error.message}`);
    throw error;
  }
};

// ===== APPLICATION LIFECYCLE EVENTS =====

/**
 * Application ready event handler
 * This method is called when Electron has finished initialization and is ready
 * to create browser windows. Some APIs can only be used after this event occurs.
 */
app.whenReady().then(async () => {
  try {
    // Initialize all services before creating the window
    await initializeServices();
    
    // Set up IPC handlers for communication with renderer
    setupIPCHandlers();
    
    // Create the main application window
    createWindow();
    
    sendLogToRenderer('info', 'Application ready');

    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    app.quit();
  }
});

/**
 * Window closed event handler
 * Quit when all windows are closed, except on macOS. There, it's common
 * for applications and their menu bar to stay active until the user quits
 * explicitly with Cmd + Q.
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Application quit event handler
 * Clean up resources and log shutdown message
 */
app.on('before-quit', () => {
  sendLogToRenderer('info', 'Application shutting down...');
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
