/**
 * Main AWS Service - Electronic Session Manager
 * 
 * This file serves as the primary service layer for all AWS operations in the application.
 * It acts as a coordinator between the UI layer and the specific AWS service modules,
 * providing a unified interface for EC2 instance management, Session Manager operations,
 * and AWS profile management.
 * 
 * Key Responsibilities:
 * - Coordinates AWS CLI availability checking
 * - Manages active port forwarding sessions
 * - Provides unified interface for EC2 operations
 * - Handles AWS profile management and switching
 * - Manages Session Manager connections and port forwarding
 * - Provides session cleanup and orphaned session management
 * 
 * Architecture Role:
 * - Acts as the main service coordinator for AWS operations
 * - Provides a clean API for the main process to interact with AWS
 * - Manages session state and lifecycle
 * - Ensures AWS CLI availability before operations
 * - Coordinates between different AWS service modules
 * 
 * Dependencies:
 * - aws/common: AWS CLI availability checking
 * - aws/profileService: Profile management and SSO
 * - aws/ec2Service: EC2 instance operations
 * - aws/ssmService: Session Manager and port forwarding operations
 * 
 * Service Modules:
 * - Profile Management: AWS profile creation, deletion, and SSO login
 * - EC2 Operations: Instance listing, starting, and stopping
 * - Session Manager: Secure shell connections and port forwarding
 * - Session Management: Active session tracking and cleanup
 */

// Import AWS service modules for specific functionality
const { checkAWSCLI: checkAWSCLICommon } = require('./aws/common');  // AWS CLI availability checking
const profileService = require('./aws/profileService');              // Profile management and SSO
const ec2Service = require('./aws/ec2Service');                      // EC2 instance operations
const ssmService = require('./aws/ssmService');                      // Session Manager operations

/**
 * Main AWS service class that coordinates all AWS operations
 * Provides a unified interface for EC2, Session Manager, and profile management
 */
class AWSService {
  /**
   * Constructor initializes the AWS service with default state
   * Sets up session tracking and default profile
   */
  constructor() {
    this.awsCliAvailable = false;        // Track AWS CLI availability
    this.activeSessions = new Map();     // Track active port forwarding sessions
    this.currentProfile = 'default';     // Current active AWS profile
  }

  // ===== AWS CLI MANAGEMENT =====
  
  /**
   * Checks if AWS CLI is available on the system
   * Updates internal state and returns availability status
   * @returns {Promise<boolean>} True if AWS CLI is available
   */
  async checkAWSCLI() {
    const available = await checkAWSCLICommon();
    this.awsCliAvailable = available;
    return available;
  }

  /**
   * Ensures AWS CLI is available before performing operations
   * Throws an error if AWS CLI is not found
   * @throws {Error} If AWS CLI is not available
   */
  async ensureAWSCLI() {
    if (!this.awsCliAvailable) {
      const available = await this.checkAWSCLI();
      if (!available) {
        throw new Error('AWS CLI is required but not found. Please install AWS CLI and ensure it is in your PATH.');
      }
    }
  }

  // ===== PROFILE MANAGEMENT =====
  
  /**
   * Gets the currently active AWS profile
   * @returns {string} Current profile name
   */
  getCurrentProfile() {
    return this.currentProfile;
  }

  /**
   * Sets the active AWS profile for all subsequent operations
   * @param {string} profile - Profile name to set as active
   */
  setCurrentProfile(profile) {
    this.currentProfile = profile;
    console.log(`Active AWS profile set to: ${profile}`);
  }

  /**
   * Gets all available AWS profiles from AWS CLI configuration
   * @returns {Promise<Array>} Array of available profile names
   */
  async getAvailableProfiles() {
    await this.ensureAWSCLI();
    return profileService.getAvailableProfiles();
  }

  /**
   * Tests an AWS profile to verify it's valid and accessible
   * @param {string} profile - Profile name to test
   * @returns {Promise<Object>} Profile validation result
   */
  async testProfile(profile) {
    await this.ensureAWSCLI();
    return profileService.testProfile(profile);
  }

  /**
   * Gets information about the currently active profile
   * @returns {Promise<Object>} Current profile information including validity
   */
  async getCurrentProfileInfo() {
    const profileInfo = await this.testProfile(this.currentProfile);
    return {
      profile: this.currentProfile,
      ...profileInfo
    };
  }

  // ===== EC2 INSTANCE OPERATIONS =====
  
  /**
   * Fetches all EC2 instances for the current profile
   * @returns {Promise<Array>} Array of EC2 instance objects
   */
  async getInstances() {
    await this.ensureAWSCLI();
    return ec2Service.getInstances(this.currentProfile);
  }

  /**
   * Starts an EC2 instance
   * @param {string} instanceId - The ID of the instance to start
   * @returns {Promise<Object>} Result of the start operation
   */
  async startInstance(instanceId) {
    await this.ensureAWSCLI();
    return ec2Service.startInstance(instanceId, this.currentProfile);
  }

  /**
   * Stops an EC2 instance
   * @param {string} instanceId - The ID of the instance to stop
   * @returns {Promise<Object>} Result of the stop operation
   */
  async stopInstance(instanceId) {
    await this.ensureAWSCLI();
    return ec2Service.stopInstance(instanceId, this.currentProfile);
  }

  // ===== SESSION MANAGER OPERATIONS =====
  
  /**
   * Starts an AWS Session Manager session to an EC2 instance
   * @param {string} instanceId - The ID of the instance to connect to
   * @returns {Promise<Object>} Session information
   */
  async startSession(instanceId) {
    await this.ensureAWSCLI();
    return ssmService.startSession(instanceId, this.currentProfile);
  }

  /**
   * Gets Session Manager instance information
   * @returns {Promise<Array>} Array of instance information
   */
  async getInstanceInformation() {
    await this.ensureAWSCLI();
    return ssmService.getInstanceInformation(this.currentProfile);
  }

  // ===== PROFILE CREATION AND MANAGEMENT =====
  
  /**
   * Creates a new AWS profile
   * @param {string} profileName - Name of the new profile
   * @param {string} profileType - Type of profile (iam, sso, etc.)
   * @param {Object} profileData - Profile configuration data
   * @returns {Promise<Object>} Result of profile creation
   */
  async createProfile(profileName, profileType, profileData) {
    await this.ensureAWSCLI();
    return profileService.createProfile(profileName, profileType, profileData);
  }

  /**
   * Deletes an AWS profile
   * If the deleted profile was active, switches to 'default'
   * @param {string} profileName - Name of the profile to delete
   * @returns {Promise<Object>} Result of profile deletion
   */
  async deleteProfile(profileName) {
    await this.ensureAWSCLI();
    const result = await profileService.deleteProfile(profileName);
    
    // If we deleted the current profile, switch to default
    if (this.currentProfile === profileName) {
      this.setCurrentProfile('default');
    }
    
    return result;
  }

  // ===== SSO LOGIN OPERATIONS =====
  
  /**
   * Performs SSO login for a profile
   * @param {string} profileName - Name of the SSO profile to login
   * @returns {Promise<Object>} Result of the SSO login operation
   */
  async performSSOLogin(profileName) {
    await this.ensureAWSCLI();
    return profileService.performSSOLogin(profileName);
  }

  /**
   * Checks SSO login status for a profile
   * @param {string} profileName - Name of the SSO profile to check
   * @returns {Promise<Object>} SSO login status information
   */
  async checkSSOLoginStatus(profileName) {
    await this.ensureAWSCLI();
    return profileService.checkSSOLoginStatus(profileName);
  }

  /**
   * Gets SSO login status for all SSO-configured profiles
   * @returns {Promise<Array>} Array of SSO profile status information
   */
  async getAllSSOLoginStatus() {
    await this.ensureAWSCLI();
    return profileService.getAllSSOLoginStatus();
  }

  // ===== PORT FORWARDING OPERATIONS =====
  
  /**
   * Starts port forwarding from local port to remote port on an EC2 instance
   * Tracks the active session for later management
   * @param {string} instanceId - The ID of the target instance
   * @param {number} localPort - Local port to forward from
   * @param {number} remotePort - Remote port to forward to
   * @returns {Promise<Object>} Port forwarding session information
   */
  async startPortForwarding(instanceId, localPort, remotePort) {
    await this.ensureAWSCLI();
    try {
      // Start the port forwarding session
      const sessionData = await ssmService.startPortForwarding(instanceId, localPort, remotePort, this.currentProfile);
      
      // Create a unique key for tracking this session
      const sessionKey = `${instanceId}-${localPort}-${remotePort}`;
      
      // Store the session data for later management
      this.activeSessions.set(sessionKey, sessionData);
      
      return {
        success: true,
        instanceId,
        localPort,
        remotePort,
        sessionId: sessionData.sessionId || `port-forward-${Date.now()}`,
        message: `Port forwarding started: localhost:${localPort} -> ${instanceId}:${remotePort}`,
        sessionKey: sessionKey
      };
    } catch (error) {
      console.error('Error starting port forwarding:', error);
      throw new Error(`Failed to start port forwarding: ${error.message}`);
    }
  }

  /**
   * Stops port forwarding for a specific session
   * Removes the session from active tracking
   * @param {string} instanceId - The ID of the instance
   * @param {string} sessionId - The session ID to stop
   * @returns {Promise<Object>} Result of the stop operation
   */
  async stopPortForwarding(instanceId, sessionId) {
    try {
      let sessionToStop = null;
      let sessionKey = null;
      
      // First try to find the session by sessionId match
      for (const [key, session] of this.activeSessions.entries()) {
        if (session.sessionId === sessionId) {
          sessionToStop = session;
          sessionKey = key;
          break;
        }
      }
      
      // If not found by sessionId, try to find by instanceId
      if (!sessionToStop) {
        for (const [key, session] of this.activeSessions.entries()) {
          if (session.instanceId === instanceId) {
            sessionToStop = session;
            sessionKey = key;
            break;
          }
        }
      }
      
      // If no session found, throw an error
      if (!sessionToStop) {
        throw new Error(`No active port forwarding session found for instance ${instanceId} with session ID ${sessionId}`);
      }
      
      // Stop the port forwarding session
      const result = await ssmService.stopPortForwarding(sessionToStop);
      
      // Remove the session from active tracking
      this.activeSessions.delete(sessionKey);
      
      return result;
      
    } catch (error) {
      console.error('Error stopping port forwarding:', error);
      throw new Error(`Failed to stop port forwarding: ${error.message}`);
    }
  }

  // ===== SESSION CLEANUP OPERATIONS =====
  
  /**
   * Finds orphaned session manager sessions that may need cleanup
   * @returns {Promise<Array>} Array of orphaned session information
   */
  async findOrphanedSessions() {
    await this.ensureAWSCLI();
    return ssmService.findOrphanedSessions();
  }

  /**
   * Force kills orphaned session manager sessions
   * @returns {Promise<Object>} Result of the cleanup operation
   */
  async forceKillOrphanedSessions() {
    await this.ensureAWSCLI();
    return ssmService.forceKillOrphanedSessions();
  }

  /**
   * Force kills all session manager plugin processes
   * Nuclear option for cleaning up all AWS session manager processes
   * @returns {Promise<Object>} Result of the cleanup operation
   */
  async forceKillAllSessionManagerPlugins() {
    return ssmService.forceKillAllSessionManagerPlugins();
  }
}

module.exports = AWSService;
