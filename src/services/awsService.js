const { checkAWSCLI: checkAWSCLICommon } = require('./aws/common');
const profileService = require('./aws/profileService');
const ec2Service = require('./aws/ec2Service');
const ssmService = require('./aws/ssmService');

class AWSService {
  constructor() {
    this.awsCliAvailable = false;
    this.activeSessions = new Map();
    this.currentProfile = 'default';
  }

  async checkAWSCLI() {
    const available = await checkAWSCLICommon();
    this.awsCliAvailable = available;
    return available;
  }

  async ensureAWSCLI() {
    if (!this.awsCliAvailable) {
      const available = await this.checkAWSCLI();
      if (!available) {
        throw new Error('AWS CLI is required but not found. Please install AWS CLI and ensure it is in your PATH.');
      }
    }
  }

  getCurrentProfile() {
    return this.currentProfile;
  }

  setCurrentProfile(profile) {
    this.currentProfile = profile;
    console.log(`Active AWS profile set to: ${profile}`);
  }

  async getAvailableProfiles() {
    await this.ensureAWSCLI();
    return profileService.getAvailableProfiles();
  }

  async testProfile(profile) {
    await this.ensureAWSCLI();
    return profileService.testProfile(profile);
  }

  async getCurrentProfileInfo() {
    const profileInfo = await this.testProfile(this.currentProfile);
    return {
      profile: this.currentProfile,
      ...profileInfo
    };
  }

  async getInstances() {
    await this.ensureAWSCLI();
    return ec2Service.getInstances(this.currentProfile);
  }

  async startInstance(instanceId) {
    await this.ensureAWSCLI();
    return ec2Service.startInstance(instanceId, this.currentProfile);
  }

  async stopInstance(instanceId) {
    await this.ensureAWSCLI();
    return ec2Service.stopInstance(instanceId, this.currentProfile);
  }

  async startSession(instanceId) {
    await this.ensureAWSCLI();
    return ssmService.startSession(instanceId, this.currentProfile);
  }

  async getInstanceInformation() {
    await this.ensureAWSCLI();
    return ssmService.getInstanceInformation(this.currentProfile);
  }

  async createProfile(profileName, profileType, profileData) {
    await this.ensureAWSCLI();
    return profileService.createProfile(profileName, profileType, profileData);
  }

  async deleteProfile(profileName) {
    await this.ensureAWSCLI();
    const result = await profileService.deleteProfile(profileName);
    if (this.currentProfile === profileName) {
      this.setCurrentProfile('default');
    }
    return result;
  }

  async performSSOLogin(profileName) {
    await this.ensureAWSCLI();
    return profileService.performSSOLogin(profileName);
  }

  async checkSSOLoginStatus(profileName) {
    await this.ensureAWSCLI();
    return profileService.checkSSOLoginStatus(profileName);
  }

  async getAllSSOLoginStatus() {
    await this.ensureAWSCLI();
    return profileService.getAllSSOLoginStatus();
  }

  async startPortForwarding(instanceId, localPort, remotePort) {
    await this.ensureAWSCLI();
    try {
      const sessionData = await ssmService.startPortForwarding(instanceId, localPort, remotePort, this.currentProfile);
      
      const sessionKey = `${instanceId}-${localPort}-${remotePort}`;
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

  async stopPortForwarding(instanceId, sessionId) {
    try {
      let sessionToStop = null;
      let sessionKey = null;
      
      // First try to find by sessionId match
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
      
      if (!sessionToStop) {
        throw new Error(`No active port forwarding session found for instance ${instanceId} with session ID ${sessionId}`);
      }
      
      const result = await ssmService.stopPortForwarding(sessionToStop);
      
      this.activeSessions.delete(sessionKey);
      
      return result;
      
    } catch (error) {
      console.error('Error stopping port forwarding:', error);
      throw new Error(`Failed to stop port forwarding: ${error.message}`);
    }
  }

  async findOrphanedSessions() {
    await this.ensureAWSCLI();
    return ssmService.findOrphanedSessions();
  }

  async forceKillOrphanedSessions() {
    await this.ensureAWSCLI();
    return ssmService.forceKillOrphanedSessions();
  }

  async forceKillAllSessionManagerPlugins() {
    return ssmService.forceKillAllSessionManagerPlugins();
  }
}

module.exports = AWSService;
