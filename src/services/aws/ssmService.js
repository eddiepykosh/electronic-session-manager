const { spawn } = require('child_process');
const {
  execAsync,
  ensureAWSCLI,
  buildAWSCommand,
} = require('./common');

async function getInstanceInformation(profile) {
  try {
    await ensureAWSCLI();
    const command = buildAWSCommand('aws ssm describe-instance-information --output json', profile);
    const { stdout } = await execAsync(command);
    const data = JSON.parse(stdout);
    return data.InstanceInformationList || [];
  } catch (error) {
    console.error('Error fetching instance information:', error);
    throw new Error(`Failed to fetch instance information: ${error.message}`);
  }
}

async function startSession(instanceId, profile) {
  try {
    await ensureAWSCLI();
    // This will start an interactive session
    const command = buildAWSCommand(`aws ssm start-session --target ${instanceId}`, profile);
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

async function startPortForwarding(instanceId, localPort, remotePort, profile) {
  try {
    await ensureAWSCLI();
    
    const instanceInfo = await getInstanceInformation(profile);
    const hasSSM = instanceInfo.some(info => info.InstanceId === instanceId);
    
    if (!hasSSM) {
      throw new Error(`Instance ${instanceId} is not available for Session Manager. Make sure the instance is running and has the SSM agent installed.`);
    }
    
    const parameters = `portNumber=${remotePort},localPortNumber=${localPort}`;
    
    const baseCommand = `aws ssm start-session --target ${instanceId} --document-name AWS-StartPortForwardingSession --parameters "${parameters}"`;
    const command = buildAWSCommand(baseCommand, profile);
    console.log('Starting port forwarding with command:', command);
    
    return new Promise((resolve, reject) => {
      const args = [
        'ssm', 'start-session',
        '--target', instanceId,
        '--document-name', 'AWS-StartPortForwardingSession',
        '--parameters', parameters
      ];
      
      if (profile && profile !== 'default') {
        args.push('--profile', profile);
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
        
        const sessionMatch = outputChunk.match(/Starting session with SessionId:\s*([^\s]+)/);
        if (sessionMatch && !sessionId) {
          sessionId = sessionMatch[1];
          console.log('Found SessionId:', sessionId);
          
          setTimeout(() => {
            resolve({
              process: child,
              sessionId: sessionId,
              instanceId: instanceId,
              localPort: localPort,
              remotePort: remotePort,
              startTime: new Date()
            });
          }, 1000);
        }
      });
      
      child.stderr.on('data', (data) => {
        const errorChunk = data.toString();
        console.error('Port forwarding error:', errorChunk);
        
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

function stopPortForwarding(sessionToStop) {
  try {
    console.log('Stopping port forwarding for instance:', sessionToStop.instanceId, 'session:', sessionToStop.sessionId);
    
    if (!sessionToStop) {
      throw new Error(`No active port forwarding session found.`);
    }
    
    if (sessionToStop.process && !sessionToStop.process.killed) {
      sessionToStop.process.kill('SIGTERM');
      console.log('Sent SIGTERM to port forwarding process');
      
      setTimeout(() => {
        if (!sessionToStop.process.killed) {
          sessionToStop.process.kill('SIGKILL');
          console.log('Sent SIGKILL to port forwarding process');
        }
      }, 2000);
    }
    
    return {
      success: true,
      instanceId: sessionToStop.instanceId,
      sessionId: sessionToStop.sessionId,
      message: `Port forwarding stopped for instance ${sessionToStop.instanceId}`,
      stoppedAt: new Date()
    };
    
  } catch (error) {
    console.error('Error stopping port forwarding:', error);
    throw new Error(`Failed to stop port forwarding: ${error.message}`);
  }
}

module.exports = {
  getInstanceInformation,
  startSession,
  startPortForwarding,
  stopPortForwarding,
}; 