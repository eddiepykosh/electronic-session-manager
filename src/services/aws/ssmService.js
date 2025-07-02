const { spawn } = require('child_process');
const {
  execAsync,
  ensureAWSCLI,
  buildAWSCommand,
  getProfileRegion,
} = require('./common');

async function getInstanceInformation(profile) {
  try {
    await ensureAWSCLI();
    const command = await buildAWSCommand('aws ssm describe-instance-information --output json', profile);
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
    const command = await buildAWSCommand(`aws ssm start-session --target ${instanceId}`, profile);
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
    const command = await buildAWSCommand(baseCommand, profile);
    console.log('Starting port forwarding with command:', command);
    
    return new Promise(async (resolve, reject) => {
      const args = [
        'ssm', 'start-session',
        '--target', instanceId,
        '--document-name', 'AWS-StartPortForwardingSession',
        '--parameters', parameters
      ];
      
      // Add region
      const region = await getProfileRegion(profile || 'default');
      args.push('--region', region);
      
      // Add profile if specified and not default
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

async function stopPortForwarding(sessionToStop) {
  try {
    console.log('Stopping port forwarding for instance:', sessionToStop.instanceId, 'session:', sessionToStop.sessionId);
    
    if (!sessionToStop) {
      throw new Error(`No active port forwarding session found.`);
    }
    
    let processTerminated = false;
    let portReleased = false;
    
    // Step 1: Terminate the process
    if (sessionToStop.process && !sessionToStop.process.killed) {
      console.log('Sending SIGTERM to port forwarding process...');
      sessionToStop.process.kill('SIGTERM');
      
      // Wait for graceful termination
      processTerminated = await waitForProcessTermination(sessionToStop.process, 5000);
      
      if (!processTerminated) {
        console.log('Process did not terminate gracefully, sending SIGKILL...');
        sessionToStop.process.kill('SIGKILL');
        processTerminated = await waitForProcessTermination(sessionToStop.process, 3000);
      }
    } else {
      processTerminated = true; // Process already terminated or doesn't exist
    }
    
    // Step 2: Verify port is released
    if (sessionToStop.localPort) {
      portReleased = await verifyPortReleased(sessionToStop.localPort);
    } else {
      portReleased = true; // No port to verify
    }
    
    // Step 3: Validate termination
    if (!processTerminated) {
      throw new Error('Failed to terminate port forwarding process');
    }
    
    if (!portReleased) {
      console.warn('Warning: Port may still be in use after process termination');
    }
    
    console.log('Port forwarding session successfully terminated');
    
    return {
      success: true,
      instanceId: sessionToStop.instanceId,
      sessionId: sessionToStop.sessionId,
      message: `Port forwarding stopped for instance ${sessionToStop.instanceId}`,
      stoppedAt: new Date(),
      processTerminated,
      portReleased
    };
    
  } catch (error) {
    console.error('Error stopping port forwarding:', error);
    throw new Error(`Failed to stop port forwarding: ${error.message}`);
  }
}

function waitForProcessTermination(process, timeoutMs) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkTermination = () => {
      if (process.killed) {
        console.log('Process terminated successfully');
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime > timeoutMs) {
        console.log('Process termination timeout');
        resolve(false);
        return;
      }
      
      setTimeout(checkTermination, 100);
    };
    
    checkTermination();
  });
}

async function verifyPortReleased(port) {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // Check if port is still in use
    let command;
    if (process.platform === 'win32') {
      command = `netstat -an | findstr :${port}`;
    } else {
      command = `lsof -i :${port}`;
    }
    
    try {
      const { stdout } = await execAsync(command);
      const isPortInUse = stdout.trim().length > 0;
      
      if (isPortInUse) {
        console.log(`Port ${port} is still in use`);
        return false;
      } else {
        console.log(`Port ${port} is available`);
        return true;
      }
    } catch (error) {
      // If command fails, it usually means port is not in use
      console.log(`Port ${port} appears to be available (command failed: ${error.message})`);
      return true;
    }
  } catch (error) {
    console.error('Error verifying port release:', error);
    return false;
  }
}

async function findOrphanedSessions() {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    let command;
    if (process.platform === 'win32') {
      command = 'tasklist /FI "IMAGENAME eq aws.exe" /FO CSV';
    } else {
      command = 'ps aux | grep aws | grep -v grep';
    }
    
    try {
      const { stdout } = await execAsync(command);
      const lines = stdout.trim().split('\n').filter(line => line.trim());
      
      const orphanedProcesses = [];
      for (const line of lines) {
        if (line.includes('ssm') && line.includes('start-session')) {
          orphanedProcesses.push(line);
        }
      }
      
      return orphanedProcesses;
    } catch (error) {
      console.log('No orphaned AWS processes found or unable to check');
      return [];
    }
  } catch (error) {
    console.error('Error finding orphaned sessions:', error);
    return [];
  }
}

async function forceKillOrphanedSessions() {
  try {
    const orphanedProcesses = await findOrphanedSessions();
    
    if (orphanedProcesses.length === 0) {
      return { success: true, message: 'No orphaned sessions found' };
    }
    
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    let command;
    if (process.platform === 'win32') {
      command = 'taskkill /F /IM aws.exe';
    } else {
      command = 'pkill -f "aws.*ssm.*start-session"';
    }
    
    await execAsync(command);
    
    return {
      success: true,
      message: `Force killed ${orphanedProcesses.length} orphaned session(s)`,
      killedCount: orphanedProcesses.length
    };
  } catch (error) {
    console.error('Error force killing orphaned sessions:', error);
    throw new Error(`Failed to force kill orphaned sessions: ${error.message}`);
  }
}

module.exports = {
  getInstanceInformation,
  startSession,
  startPortForwarding,
  stopPortForwarding,
  findOrphanedSessions,
  forceKillOrphanedSessions,
}; 