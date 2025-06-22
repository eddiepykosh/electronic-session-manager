const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

class AWSService {
  constructor() {
    // Don't check AWS CLI immediately - will check when needed
    this.awsCliAvailable = false;
    // Track active port forwarding sessions
    this.activeSessions = new Map();
    // Current active profile
    this.currentProfile = 'default';
    // AWS credentials file path
    this.credentialsPath = path.join(process.env.HOME || process.env.USERPROFILE, '.aws', 'credentials');
    // AWS config file path
    this.configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.aws', 'config');
  }

  async checkAWSCLI() {
    try {
      await execAsync('aws --version');
      console.log('AWS CLI is available');
      this.awsCliAvailable = true;
      return true;
    } catch (error) {
      console.error('AWS CLI is not installed or not in PATH');
      this.awsCliAvailable = false;
      return false;
    }
  }

  async ensureAWSCLI() {
    if (!this.awsCliAvailable) {
      const available = await this.checkAWSCLI();
      if (!available) {
        throw new Error('AWS CLI is required but not found. Please install AWS CLI and ensure it is in your PATH.');
      }
    }
  }

  // Get the current active profile
  getCurrentProfile() {
    return this.currentProfile;
  }

  // Set the active profile
  setCurrentProfile(profile) {
    this.currentProfile = profile;
    console.log(`Active AWS profile set to: ${profile}`);
  }

  // Build AWS CLI command with profile
  buildAWSCommand(baseCommand) {
    if (this.currentProfile && this.currentProfile !== 'default') {
      return `${baseCommand} --profile ${this.currentProfile}`;
    }
    return baseCommand;
  }

  // List available AWS profiles
  async getAvailableProfiles() {
    try {
      await this.ensureAWSCLI();
      
      const profiles = new Set(['default']); // Always include default
      
      // Try to read from credentials file
      try {
        const credentialsContent = await fs.readFile(this.credentialsPath, 'utf8');
        const profileMatches = credentialsContent.match(/\[([^\]]+)\]/g);
        if (profileMatches) {
          profileMatches.forEach(match => {
            const profileName = match.slice(1, -1); // Remove brackets
            if (profileName !== 'default') {
              profiles.add(profileName);
            }
          });
        }
      } catch (error) {
        console.log('No AWS credentials file found or unable to read');
      }

      // Try to read from config file (for SSO profiles)
      try {
        const configContent = await fs.readFile(this.configPath, 'utf8');
        const profileMatches = configContent.match(/\[profile ([^\]]+)\]/g);
        if (profileMatches) {
          profileMatches.forEach(match => {
            const profileName = match.slice(9, -1); // Remove '[profile ' and ']'
            profiles.add(profileName);
          });
        }
      } catch (error) {
        console.log('No AWS config file found or unable to read');
      }

      // Also try to get profiles from AWS CLI
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
      return ['default']; // Fallback to default only
    }
  }

  // Test if a profile is valid by trying to get caller identity
  async testProfile(profile) {
    try {
      await this.ensureAWSCLI();
      const command = profile && profile !== 'default' 
        ? `aws sts get-caller-identity --profile ${profile} --output json`
        : 'aws sts get-caller-identity --output json';
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

  // Get current profile information
  async getCurrentProfileInfo() {
    try {
      const profileInfo = await this.testProfile(this.currentProfile);
      return {
        profile: this.currentProfile,
        ...profileInfo
      };
    } catch (error) {
      return {
        profile: this.currentProfile,
        valid: false,
        error: error.message
      };
    }
  }

  async getInstances() {
    try {
      console.log(`Attempting to get EC2 instances using profile: ${this.currentProfile}...`)
      await this.ensureAWSCLI();
      const command = this.buildAWSCommand('aws ec2 describe-instances --output json');
      const { stdout } = await execAsync(command);
      const data = JSON.parse(stdout);
      
      const instances = [];
      data.Reservations.forEach(reservation => {
        reservation.Instances.forEach(instance => {
          instances.push({
            id: instance.InstanceId,
            type: instance.InstanceType,
            state: instance.State.Name,
            publicIp: instance.PublicIpAddress || 'N/A',
            privateIp: instance.PrivateIpAddress || 'N/A',
            launchTime: instance.LaunchTime,
            tags: instance.Tags || [],
            platform: instance.Platform || 'linux',
            vpcId: instance.VpcId,
            subnetId: instance.SubnetId,
            availabilityZone: instance.Placement.AvailabilityZone
          });
        });
      });
      
      return instances;
    } catch (error) {
      console.error('Error fetching instances:', error);
      throw new Error(`Failed to fetch instances: ${error.message}`);
    }
  }

  async startInstance(instanceId) {
    try {
      await this.ensureAWSCLI();
      const command = this.buildAWSCommand(`aws ec2 start-instances --instance-ids ${instanceId} --output json`);
      const { stdout } = await execAsync(command);
      const data = JSON.parse(stdout);
      
      if (data.StartingInstances && data.StartingInstances.length > 0) {
        return {
          success: true,
          instanceId: data.StartingInstances[0].InstanceId,
          previousState: data.StartingInstances[0].PreviousState.Name,
          currentState: data.StartingInstances[0].CurrentState.Name
        };
      }
      
      throw new Error('Failed to start instance');
    } catch (error) {
      console.error('Error starting instance:', error);
      throw new Error(`Failed to start instance: ${error.message}`);
    }
  }

  async stopInstance(instanceId) {
    try {
      await this.ensureAWSCLI();
      const command = this.buildAWSCommand(`aws ec2 stop-instances --instance-ids ${instanceId} --output json`);
      const { stdout } = await execAsync(command);
      const data = JSON.parse(stdout);
      
      if (data.StoppingInstances && data.StoppingInstances.length > 0) {
        return {
          success: true,
          instanceId: data.StoppingInstances[0].InstanceId,
          previousState: data.StoppingInstances[0].PreviousState.Name,
          currentState: data.StoppingInstances[0].CurrentState.Name
        };
      }
      
      throw new Error('Failed to stop instance');
    } catch (error) {
      console.error('Error stopping instance:', error);
      throw new Error(`Failed to stop instance: ${error.message}`);
    }
  }

  async startSession(instanceId) {
    try {
      await this.ensureAWSCLI();
      // This will start an interactive session
      const command = this.buildAWSCommand(`aws ssm start-session --target ${instanceId}`);
      console.log('Starting session with command:', command);
      
      // For now, we'll just return success - actual session handling will be implemented later
      return {
        success: true,
        instanceId,
        sessionId: `session-${Date.now()}`
      };
    } catch (error) {
      console.error('Error starting session:', error);
      throw new Error(`Failed to start session: ${error.message}`);
    }
  }

  async startPortForwarding(instanceId, localPort, remotePort) {
    try {
      await this.ensureAWSCLI();
      
      // Check if the instance is running and has SSM agent
      const instanceInfo = await this.getInstanceInformation();
      const hasSSM = instanceInfo.some(info => info.InstanceId === instanceId);
      
      if (!hasSSM) {
        throw new Error(`Instance ${instanceId} is not available for Session Manager. Make sure the instance is running and has the SSM agent installed.`);
      }
      
      // Build the port forwarding command with correct parameter format
      const parameters = `portNumber=${remotePort},localPortNumber=${localPort}`;
      
      const baseCommand = `aws ssm start-session --target ${instanceId} --document-name AWS-StartPortForwardingSession --parameters "${parameters}"`;
      const command = this.buildAWSCommand(baseCommand);
      console.log('Starting port forwarding with command:', command);
      
      // For port forwarding, we need to handle this differently since it's an interactive session
      // We'll start the process and capture the initial output to get the SessionId
      const { spawn } = require('child_process');
      
      return new Promise((resolve, reject) => {
        const args = [
          'ssm', 'start-session',
          '--target', instanceId,
          '--document-name', 'AWS-StartPortForwardingSession',
          '--parameters', parameters
        ];
        
        // Add profile if not default
        if (this.currentProfile && this.currentProfile !== 'default') {
          args.push('--profile', this.currentProfile);
        }
        
        const child = spawn('aws', args, {
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let sessionId = null;
        let output = '';
        
        child.stdout.on('data', (data) => {
          const outputChunk = data.toString();
          output += outputChunk;
          console.log('Port forwarding output:', outputChunk);
          
          // Look for SessionId in the output
          const sessionMatch = outputChunk.match(/Starting session with SessionId:\s*([^\s]+)/);
          if (sessionMatch && !sessionId) {
            sessionId = sessionMatch[1];
            console.log('Found SessionId:', sessionId);
            
            // Resolve with success after a short delay to ensure session is established
            setTimeout(() => {
              // Store the session for later termination
              const sessionKey = `${instanceId}-${localPort}-${remotePort}`;
              this.activeSessions.set(sessionKey, {
                process: child,
                sessionId: sessionId,
                instanceId: instanceId,
                localPort: localPort,
                remotePort: remotePort,
                startTime: new Date()
              });
              
              resolve({
                success: true,
                instanceId,
                localPort,
                remotePort,
                sessionId: sessionId || `port-forward-${Date.now()}`,
                message: `Port forwarding started: localhost:${localPort} -> ${instanceId}:${remotePort}`,
                sessionKey: sessionKey
              });
            }, 1000);
          }
        });
        
        child.stderr.on('data', (data) => {
          const errorChunk = data.toString();
          console.error('Port forwarding error:', errorChunk);
          
          // Check for specific error conditions
          if (errorChunk.includes('SessionManagerPlugin is not found')) {
            reject(new Error('Session Manager plugin is not installed. Please install the AWS Session Manager plugin.'));
          } else if (errorChunk.includes('AccessDenied')) {
            reject(new Error('Access denied. Please check your AWS permissions and ensure the instance is running.'));
          } else if (errorChunk.includes('TargetNotConnected')) {
            reject(new Error('Instance is not connected to Session Manager. Please ensure the instance is running and has the SSM agent installed.'));
          }
        });
        
        child.on('error', (error) => {
          console.error('Port forwarding process error:', error);
          reject(new Error(`Port forwarding process error: ${error.message}`));
        });
        
        child.on('close', (code) => {
          console.log(`Port forwarding process closed with code: ${code}`);
          if (code !== 0 && !sessionId) {
            reject(new Error(`Port forwarding process exited with code: ${code}`));
          }
        });
        
        // Timeout after 30 seconds
        setTimeout(() => {
          if (!sessionId) {
            child.kill();
            reject(new Error('Port forwarding session timed out'));
          }
        }, 30000);
      });
    } catch (error) {
      console.error('Error starting port forwarding:', error);
      throw new Error(`Failed to start port forwarding: ${error.message}`);
    }
  }

  async stopPortForwarding(instanceId, sessionId) {
    try {
      console.log('Stopping port forwarding for instance:', instanceId, 'session:', sessionId);
      
      // Find the session by instanceId and sessionId
      let sessionToStop = null;
      let sessionKey = null;
      
      for (const [key, session] of this.activeSessions.entries()) {
        if (session.instanceId === instanceId && session.sessionId === sessionId) {
          sessionToStop = session;
          sessionKey = key;
          break;
        }
      }
      
      if (!sessionToStop) {
        throw new Error(`No active port forwarding session found for instance ${instanceId} with session ID ${sessionId}`);
      }
      
      // Kill the process
      if (sessionToStop.process && !sessionToStop.process.killed) {
        sessionToStop.process.kill('SIGTERM');
        console.log('Sent SIGTERM to port forwarding process');
        
        // Wait a moment and force kill if still running
        setTimeout(() => {
          if (!sessionToStop.process.killed) {
            sessionToStop.process.kill('SIGKILL');
            console.log('Sent SIGKILL to port forwarding process');
          }
        }, 2000);
      }
      
      // Remove from active sessions
      this.activeSessions.delete(sessionKey);
      
      return {
        success: true,
        instanceId,
        sessionId,
        message: `Port forwarding stopped for instance ${instanceId}`,
        stoppedAt: new Date()
      };
      
    } catch (error) {
      console.error('Error stopping port forwarding:', error);
      throw new Error(`Failed to stop port forwarding: ${error.message}`);
    }
  }

  async getInstanceInformation() {
    try {
      await this.ensureAWSCLI();
      const command = this.buildAWSCommand('aws ssm describe-instance-information --output json');
      const { stdout } = await execAsync(command);
      const data = JSON.parse(stdout);
      return data.InstanceInformationList || [];
    } catch (error) {
      console.error('Error fetching instance information:', error);
      throw new Error(`Failed to fetch instance information: ${error.message}`);
    }
  }
}

module.exports = AWSService; 