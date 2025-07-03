/**
 * Preload Script - Electronic Session Manager
 * 
 * This file serves as a security bridge between the main process and renderer process.
 * It exposes a controlled API to the renderer process while maintaining security isolation.
 * 
 * Key Responsibilities:
 * - Provides secure communication channel between renderer and main process
 * - Exposes only necessary APIs to the renderer process
 * - Prevents direct access to Node.js APIs from renderer
 * - Handles IPC (Inter-Process Communication) for all AWS operations
 * - Manages event listeners for real-time updates
 * 
 * Security Features:
 * - Context isolation enabled (renderer cannot access Node.js APIs directly)
 * - Controlled API exposure through contextBridge
 * - All communication goes through secure IPC channels
 * - No direct access to file system or system APIs from renderer
 * 
 * Architecture Role:
 * - Acts as the security layer between UI (renderer) and business logic (main)
 * - Provides type-safe API for renderer process
 * - Handles all AWS CLI operations, configuration, and logging
 * - Manages real-time event communication
 * 
 * API Categories:
 * - AWS EC2 Operations: Instance management and control
 * - AWS Session Manager: Secure shell connections and port forwarding
 * - AWS Profile Management: Profile configuration and SSO
 * - Configuration: Application settings persistence
 * - Logging: Real-time log message handling
 * - Event Management: Real-time updates and notifications
 */

// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose protected methods that allow the renderer process to use
 * the ipcRenderer without exposing the entire object
 * 
 * This creates a secure API that the renderer process can use to communicate
 * with the main process while maintaining security isolation.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ===== AWS EC2 INSTANCE OPERATIONS =====
  
  /**
   * Fetches all EC2 instances for the current AWS profile
   * @returns {Promise<Array>} Array of EC2 instance objects
   */
  getInstances: () => ipcRenderer.invoke('aws:get-instances'),
  
  /**
   * Starts an EC2 instance
   * @param {string} instanceId - The ID of the instance to start
   * @returns {Promise<Object>} Result of the start operation
   */
  startInstance: (instanceId) => ipcRenderer.invoke('aws:start-instance', instanceId),
  
  /**
   * Stops an EC2 instance
   * @param {string} instanceId - The ID of the instance to stop
   * @returns {Promise<Object>} Result of the stop operation
   */
  stopInstance: (instanceId) => ipcRenderer.invoke('aws:stop-instance', instanceId),
  
  // ===== AWS SESSION MANAGER OPERATIONS =====
  
  /**
   * Starts an AWS Session Manager session to an EC2 instance
   * @param {string} instanceId - The ID of the instance to connect to
   * @returns {Promise<Object>} Session information
   */
  startSession: (instanceId) => ipcRenderer.invoke('aws:start-session', instanceId),
  
  /**
   * Starts port forwarding from local port to remote port on an EC2 instance
   * @param {string} instanceId - The ID of the target instance
   * @param {number} localPort - Local port to forward from
   * @param {number} remotePort - Remote port to forward to
   * @returns {Promise<Object>} Port forwarding session information
   */
  startPortForwarding: (instanceId, localPort, remotePort) => 
    ipcRenderer.invoke('aws:start-port-forwarding', { instanceId, localPort, remotePort }),
  
  /**
   * Stops port forwarding for a specific session
   * @param {string} instanceId - The ID of the instance
   * @param {string} sessionId - The session ID to stop
   * @returns {Promise<Object>} Result of the stop operation
   */
  stopPortForwarding: (instanceId, sessionId) => 
    ipcRenderer.invoke('aws:stop-port-forwarding', { instanceId, sessionId }),
  
  /**
   * Finds orphaned session manager sessions that may need cleanup
   * @returns {Promise<Array>} Array of orphaned session information
   */
  findOrphanedSessions: () => ipcRenderer.invoke('aws:find-orphaned-sessions'),
  
  /**
   * Force kills orphaned session manager sessions
   * @returns {Promise<Object>} Result of the cleanup operation
   */
  forceKillOrphanedSessions: () => ipcRenderer.invoke('aws:force-kill-orphaned-sessions'),
  
  /**
   * Force kills all session manager plugin processes
   * Nuclear option for cleaning up all AWS session manager processes
   * @returns {Promise<Object>} Result of the cleanup operation
   */
  forceKillAllSessionManagerPlugins: () => ipcRenderer.invoke('aws:force-kill-all-session-manager-plugins'),
  
  // ===== AWS PROFILE MANAGEMENT OPERATIONS =====
  
  /**
   * Gets all available AWS profiles from AWS CLI configuration
   * @returns {Promise<Array>} Array of available profile names
   */
  getAvailableProfiles: () => ipcRenderer.invoke('aws:get-profiles'),
  
  /**
   * Gets information about the currently active AWS profile
   * @returns {Promise<Object>} Current profile information including validity
   */
  getCurrentProfileInfo: () => ipcRenderer.invoke('aws:get-current-profile'),
  
  /**
   * Sets the active AWS profile
   * @param {string} profile - The profile name to set as active
   * @returns {Promise<Object>} Profile information after setting
   */
  setCurrentProfile: (profile) => ipcRenderer.invoke('aws:set-profile', profile),
  
  /**
   * Tests an AWS profile without setting it as active
   * @param {string} profile - The profile name to test
   * @returns {Promise<Object>} Profile validity information
   */
  testProfile: (profile) => ipcRenderer.invoke('aws:test-profile', profile),
  
  /**
   * Creates a new AWS profile
   * @param {string} profileName - Name of the new profile
   * @param {string} profileType - Type of profile (credentials, sso, etc.)
   * @param {Object} profileData - Profile configuration data
   * @returns {Promise<Object>} Result of the profile creation
   */
  createProfile: (profileName, profileType, profileData) => 
    ipcRenderer.invoke('aws:create-profile', { profileName, profileType, profileData }),
  
  /**
   * Deletes an AWS profile
   * @param {string} profileName - Name of the profile to delete
   * @returns {Promise<Object>} Result of the profile deletion
   */
  deleteProfile: (profileName) => ipcRenderer.invoke('aws:delete-profile', profileName),
  
  /**
   * Performs SSO login for a profile
   * @param {string} profileName - Name of the SSO profile to login
   * @returns {Promise<Object>} Result of the SSO login operation
   */
  performSSOLogin: (profileName) => ipcRenderer.invoke('aws:sso-login', profileName),
  
  /**
   * Checks SSO login status for a profile
   * @param {string} profileName - Name of the SSO profile to check
   * @returns {Promise<Object>} SSO login status information
   */
  checkSSOLoginStatus: (profileName) => ipcRenderer.invoke('aws:sso-login-status', profileName),
  
  /**
   * Gets SSO login status for all SSO-configured profiles
   * @returns {Promise<Array>} Array of SSO profile status information
   */
  getAllSSOLoginStatus: () => ipcRenderer.invoke('aws:get-all-sso-login-status'),
  
  // ===== AWS CLI OPERATIONS =====
  
  /**
   * Checks if AWS CLI is available on the system
   * @returns {Promise<Object>} CLI availability information
   */
  checkAWSCLI: () => ipcRenderer.invoke('aws:check-cli'),
  
  // ===== CONFIGURATION OPERATIONS =====
  
  /**
   * Gets the current application configuration
   * @returns {Promise<Object>} Application configuration data
   */
  getConfig: () => ipcRenderer.invoke('config:get'),
  
  /**
   * Saves application configuration
   * @param {Object} config - Configuration data to save
   * @returns {Promise<boolean>} Success status of the save operation
   */
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  
  // ===== UTILITY OPERATIONS =====
  
  /**
   * Shows an error message in the UI
   * @param {string} message - Error message to display
   * @returns {Promise<boolean>} Success status
   */
  showError: (message) => ipcRenderer.invoke('ui:show-error', message),
  
  /**
   * Shows a success message in the UI
   * @param {string} message - Success message to display
   * @returns {Promise<boolean>} Success status
   */
  showSuccess: (message) => ipcRenderer.invoke('ui:show-success', message),
  
  // ===== LOGGING OPERATIONS =====
  
  /**
   * Sends a log message from renderer to main process
   * @param {string} level - Log level (error, warn, info, debug)
   * @param {string} message - Log message to send
   * @returns {Promise<boolean>} Success status
   */
  sendLogMessage: (level, message) => ipcRenderer.invoke('log:send', { level, message }),
  
  // ===== EVENT LISTENERS =====
  // These methods allow the renderer to listen for real-time updates from the main process
  
  /**
   * Listens for EC2 instance updates
   * @param {Function} callback - Callback function to handle instance updates
   */
  onInstancesUpdated: (callback) => ipcRenderer.on('instances:updated', callback),
  
  /**
   * Listens for session start events
   * @param {Function} callback - Callback function to handle session start events
   */
  onSessionStarted: (callback) => ipcRenderer.on('session:started', callback),
  
  /**
   * Listens for session end events
   * @param {Function} callback - Callback function to handle session end events
   */
  onSessionEnded: (callback) => ipcRenderer.on('session:ended', callback),
  
  /**
   * Listens for log messages from main process
   * @param {Function} callback - Callback function to handle log messages
   */
  onLogMessage: (callback) => ipcRenderer.on('log:message', callback),
  
  // ===== EVENT LISTENER MANAGEMENT =====
  
  /**
   * Removes all event listeners for a specific channel
   * Useful for cleanup when components are unmounted
   * @param {string} channel - The channel to remove listeners from
   */
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
