/**
 * EC2 Service Tests
 * 
 * HIGH-LEVEL SUMMARY:
 * This test suite validates the EC2 service functionality for managing AWS EC2 instances.
 * It tests instance listing, instance control operations (start/stop), and error handling
 * for various AWS CLI operations and network conditions.
 * 
 * Test coverage includes:
 * - EC2 instance listing with various response scenarios
 * - Instance start/stop operations
 * - Empty instance list handling
 * - AWS CLI error handling (permissions, network issues)
 * - Response parsing and validation
 * - Cross-region and cross-profile operations
 */

const { exec, execFile } = require('child_process');
let EC2Service;

// Mock child_process to avoid actual AWS CLI execution during testing
// execFile must follow the Node.js callback convention for promisify to work
// We define a custom promisify so that promisify(execFile) returns { stdout, stderr }
jest.mock('child_process', () => {
  const { promisify } = require('util');
  const execFn = jest.fn();
  const execFileFn = jest.fn();
  // Custom promisify so the result is { stdout, stderr } like the real execFile
  execFileFn[promisify.custom] = (...args) => {
    return new Promise((resolve, reject) => {
      execFileFn(...args, (err, stdout, stderr) => {
        if (err) {
          err.stdout = stdout;
          err.stderr = stderr;
          reject(err);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  };
  return { exec: execFn, execFile: execFileFn };
});

// Mock fs module for common.js path checking
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
    appendFile: jest.fn(),
    mkdir: jest.fn()
  }
}));

/**
 * Helper to set up execFile mock that simulates AWS CLI being available
 * and returns the given response data for the actual command call.
 * @param {*} responseData - The data to return as JSON stdout
 * @param {Error|null} error - Optional error to throw on the command call
 */
function setupExecFileMock(responseData, error = null) {
  const { execFile } = require('child_process');
  const fs = require('fs');
  let callCount = 0;

  execFile.mockImplementation((...args) => {
    const callback = args[args.length - 1];
    if (typeof callback === 'function') {
      callCount++;
      // First two calls: getAWSExecutablePath and checkAWSCLI (aws --version)
      if (callCount <= 2) {
        callback(null, 'C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe\n', '');
      } else if (error) {
        callback(error, '', error.message);
      } else {
        callback(null, JSON.stringify(responseData), '');
      }
    }
  });

  // Mock fs.readFile to reject (no config file) so region defaults
  fs.promises.readFile.mockRejectedValue(new Error('File not found'));
}

describe('EC2 Service', () => {
  // Reset modules and mocks before each test to clear cached state
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    EC2Service = require('../../../src/services/aws/ec2Service');
  });

  describe('Instance Listing', () => {
    /**
     * Test: List all EC2 instances successfully
     * 
     * Verifies that the EC2 service can successfully retrieve and parse
     * a list of EC2 instances with complete instance information.
     */
    test('should list all EC2 instances', async () => {
      // Mock EC2 instance data that would be returned by AWS CLI
      const mockInstances = [
        {
          InstanceId: 'i-1234567890abcdef0',
          InstanceType: 't3.micro',
          State: { Name: 'running' },
          PublicIpAddress: '192.168.1.1',
          PrivateIpAddress: '10.0.1.1',
          LaunchTime: '2024-01-01T00:00:00.000Z',
          Tags: [],
          Platform: 'linux',
          VpcId: 'vpc-12345678',
          SubnetId: 'subnet-12345678',
          Placement: { AvailabilityZone: 'us-east-1a' }
        }
      ];

      // Mock successful AWS CLI response via execFile
      setupExecFileMock({ Reservations: [{ Instances: mockInstances }] });

      // Get instances using the service
      const instances = await EC2Service.getInstances('test-profile');
      
      // Verify that instances were retrieved successfully
      expect(instances).toBeDefined();
      expect(instances.length).toBe(1);
    });

    /**
     * Test: Handle empty instance list
     * 
     * Verifies that the EC2 service correctly handles the scenario
     * where no EC2 instances exist in the specified region/profile.
     */
    test('should handle empty instance list', async () => {
      // Mock AWS CLI response with no instances
      setupExecFileMock({ Reservations: [] });

      // Get instances using the service
      const instances = await EC2Service.getInstances('test-profile');
      
      // Verify that empty array is returned
      expect(instances).toEqual([]);
    });

    /**
     * Test: Handle instance listing errors
     * 
     * Verifies that the EC2 service properly handles and propagates
     * errors that occur during AWS CLI execution.
     */
    test('should handle instance listing errors', async () => {
      // Mock AWS CLI error response
      setupExecFileMock(null, new Error('Access denied'));

      // Verify that the error is properly thrown
      await expect(EC2Service.getInstances('test-profile')).rejects.toThrow();
    });
  });

  describe('Instance Control', () => {
    /**
     * Test: Start instance successfully
     * 
     * Verifies that the EC2 service can successfully start an EC2 instance
     * and return the appropriate response with instance state information.
     */
    test('should start instance successfully', async () => {
      // Mock AWS CLI response for starting an instance
      const mockResponse = {
        StartingInstances: [{
          InstanceId: 'i-1234567890abcdef0',
          PreviousState: { Name: 'stopped' },
          CurrentState: { Name: 'pending' }
        }]
      };

      // Mock successful AWS CLI response
      setupExecFileMock(mockResponse);

      // Start instance using the service
      const result = await EC2Service.startInstance('i-1234567890abcdef0', 'test-profile');
      
      // Verify that the operation was successful
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    /**
     * Test: Stop instance successfully
     * 
     * Verifies that the EC2 service can successfully stop an EC2 instance
     * and return the appropriate response with instance state information.
     */
    test('should stop instance successfully', async () => {
      // Mock AWS CLI response for stopping an instance
      const mockResponse = {
        StoppingInstances: [{
          InstanceId: 'i-1234567890abcdef0',
          PreviousState: { Name: 'running' },
          CurrentState: { Name: 'stopping' }
        }]
      };

      // Mock successful AWS CLI response
      setupExecFileMock(mockResponse);

      // Stop instance using the service
      const result = await EC2Service.stopInstance('i-1234567890abcdef0', 'test-profile');
      
      // Verify that the operation was successful
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    /**
     * Test: Handle start instance errors
     * 
     * Verifies that the EC2 service properly handles and propagates
     * errors that occur when trying to start a non-existent or invalid instance.
     */
    test('should handle start instance errors', async () => {
      // Mock AWS CLI error response
      setupExecFileMock(null, new Error('Instance not found'));

      // Verify that the error is properly thrown
      await expect(EC2Service.startInstance('i-invalid', 'test-profile')).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    /**
     * Test: Handle permission errors
     * 
     * Verifies that the EC2 service properly handles AWS permission errors
     * that occur when the user lacks the necessary IAM permissions.
     */
    test('should handle permission errors', async () => {
      // Mock AWS CLI permission error response
      setupExecFileMock(null, new Error('Access Denied'));

      // Verify that the permission error is properly thrown
      await expect(EC2Service.getInstances('test-profile')).rejects.toThrow();
    });

    /**
     * Test: Handle network errors
     * 
     * Verifies that the EC2 service properly handles network-related errors
     * that occur when there are connectivity issues with AWS services.
     */
    test('should handle network errors', async () => {
      // Mock AWS CLI network error response
      setupExecFileMock(null, new Error('Network timeout'));

      // Verify that the network error is properly thrown
      await expect(EC2Service.getInstances('test-profile')).rejects.toThrow();
    });
  });
}); 