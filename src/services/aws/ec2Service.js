const {
  execAsync,
  ensureAWSCLI,
  buildAWSCommand,
} = require('./common');

async function getInstances(profile) {
  try {
    console.log(`Attempting to get EC2 instances using profile: ${profile}...`)
    await ensureAWSCLI();
    const command = buildAWSCommand('aws ec2 describe-instances --output json', profile);
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

async function startInstance(instanceId, profile) {
  try {
    await ensureAWSCLI();
    const command = buildAWSCommand(`aws ec2 start-instances --instance-ids ${instanceId} --output json`, profile);
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

async function stopInstance(instanceId, profile) {
  try {
    await ensureAWSCLI();
    const command = buildAWSCommand(`aws ec2 stop-instances --instance-ids ${instanceId} --output json`, profile);
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

module.exports = {
  getInstances,
  startInstance,
  stopInstance,
}; 