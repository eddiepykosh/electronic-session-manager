const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class AWSService {
  constructor() {
    // Don't check AWS CLI immediately - will check when needed
    this.awsCliAvailable = false;
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

  async getInstances() {
    try {
      console.log('Attempting to get EC2 instances...')
      await this.ensureAWSCLI();
      const { stdout } = await execAsync('aws ec2 describe-instances --output json');
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
      const { stdout } = await execAsync(`aws ec2 start-instances --instance-ids ${instanceId} --output json`);
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
      const { stdout } = await execAsync(`aws ec2 stop-instances --instance-ids ${instanceId} --output json`);
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
      const command = `aws ssm start-session --target ${instanceId}`;
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
      const command = `aws ssm start-session --target ${instanceId} --document-name AWS-StartPortForwardingSession --parameters '{"portNumber":["${remotePort}"],"localPortNumber":["${localPort}"]}'`;
      console.log('Starting port forwarding with command:', command);
      
      // For now, we'll just return success - actual port forwarding will be implemented later
      return {
        success: true,
        instanceId,
        localPort,
        remotePort,
        sessionId: `port-forward-${Date.now()}`
      };
    } catch (error) {
      console.error('Error starting port forwarding:', error);
      throw new Error(`Failed to start port forwarding: ${error.message}`);
    }
  }

  async getInstanceInformation() {
    try {
      await this.ensureAWSCLI();
      const { stdout } = await execAsync('aws ssm describe-instance-information --output json');
      const data = JSON.parse(stdout);
      return data.InstanceInformationList || [];
    } catch (error) {
      console.error('Error fetching instance information:', error);
      throw new Error(`Failed to fetch instance information: ${error.message}`);
    }
  }
}

module.exports = AWSService; 