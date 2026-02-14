/**
 * EC2 Service - Electronic Session Manager
 * 
 * This file provides EC2 instance management services using AWS CLI.
 * It handles instance listing, starting, and stopping operations through
 * AWS CLI commands with proper profile and region management.
 * 
 * Key Responsibilities:
 * - Retrieves EC2 instance information and status
 * - Manages EC2 instance lifecycle (start/stop)
 * - Parses and formats EC2 instance data
 * - Handles AWS CLI EC2 commands
 * - Provides error handling and logging
 * 
 * Architecture Role:
 * - Acts as the EC2 instance management service layer
 * - Coordinates between application and AWS CLI
 * - Provides standardized EC2 instance data format
 * - Handles EC2-specific AWS CLI operations
 * - Integrates with common AWS utilities
 * 
 * Instance Operations:
 * - List all EC2 instances with detailed information
 * - Start stopped EC2 instances
 * - Stop running EC2 instances
 * - Parse instance state and metadata
 * 
 * Instance Data Format:
 * - Instance ID, type, and state
 * - Network information (public/private IPs)
 * - Launch time and availability zone
 * - Tags and platform information
 * - VPC and subnet details
 * 
 * Error Handling:
 * - AWS CLI availability checking
 * - Command execution error handling
 * - JSON parsing error handling
 * - Standardized error messages
 * 
 * Dependencies:
 * - common.js: For AWS CLI utilities and command building
 * - AWS CLI: For EC2 operations
 * - Node.js child_process: For command execution
 */

const {
  ensureAWSCLI,
  execAWSCommand,
} = require('./common');

/**
 * Retrieves all EC2 instances for a given AWS profile
 * Fetches instance details including state, network info, and metadata
 * @param {string} profile - AWS profile name to use
 * @returns {Promise<Array>} Array of EC2 instance objects
 * @throws {Error} If AWS CLI is not available or command fails
 */
async function getInstances(profile) {
  try {
    console.log(`Attempting to get EC2 instances using profile: ${profile}...`)
    
    // Ensure AWS CLI is available before proceeding
    await ensureAWSCLI();
    
    // Build and execute AWS CLI command for EC2 instances
    const { stdout } = await execAWSCommand(['ec2', 'describe-instances', '--output', 'json'], profile);
    const data = JSON.parse(stdout);
    
    // Parse and format instance data
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

/**
 * Starts a stopped EC2 instance
 * Initiates the instance start process and returns state information
 * @param {string} instanceId - EC2 instance ID to start
 * @param {string} profile - AWS profile name to use
 * @returns {Promise<Object>} Object containing start operation result
 * @throws {Error} If AWS CLI is not available or command fails
 */
async function startInstance(instanceId, profile) {
  try {
    // Ensure AWS CLI is available before proceeding
    await ensureAWSCLI();
    
    // Build and execute AWS CLI command to start instance
    const { stdout } = await execAWSCommand(['ec2', 'start-instances', '--instance-ids', instanceId, '--output', 'json'], profile);
    const data = JSON.parse(stdout);
    
    // Check if start operation was successful
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

/**
 * Stops a running EC2 instance
 * Initiates the instance stop process and returns state information
 * @param {string} instanceId - EC2 instance ID to stop
 * @param {string} profile - AWS profile name to use
 * @returns {Promise<Object>} Object containing stop operation result
 * @throws {Error} If AWS CLI is not available or command fails
 */
async function stopInstance(instanceId, profile) {
  try {
    // Ensure AWS CLI is available before proceeding
    await ensureAWSCLI();
    
    // Build and execute AWS CLI command to stop instance
    const { stdout } = await execAWSCommand(['ec2', 'stop-instances', '--instance-ids', instanceId, '--output', 'json'], profile);
    const data = JSON.parse(stdout);
    
    // Check if stop operation was successful
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

// Export EC2 service functions
module.exports = {
  getInstances,
  startInstance,
  stopInstance,
}; 