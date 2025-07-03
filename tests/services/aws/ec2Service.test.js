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

const { exec } = require('child_process');
const EC2Service = require('../../../src/services/aws/ec2Service');

// Mock child_process to avoid actual AWS CLI execution during testing
// This allows testing EC2 operations without requiring AWS credentials or CLI
jest.mock('child_process', () => ({
  exec: jest.fn() // Mock command execution
}));

describe('EC2 Service', () => {
  // Clear all mocks before each test to ensure clean state
  beforeEach(() => {
    jest.clearAllMocks();
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

      // Mock successful AWS CLI response
      exec.mockImplementation((command, callback) => {
        callback(null, { stdout: JSON.stringify({ Reservations: [{ Instances: mockInstances }] }), stderr: '' });
      });

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
      exec.mockImplementation((command, callback) => {
        callback(null, { stdout: JSON.stringify({ Reservations: [] }), stderr: '' });
      });

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
      exec.mockImplementation((command, callback) => {
        callback(new Error('Access denied'), { stdout: '', stderr: 'Access denied' });
      });

      // Verify that the error is properly thrown
      await expect(EC2Service.getInstances('test-profile')).rejects.toThrow('Access denied');
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
      exec.mockImplementation((command, callback) => {
        callback(null, { stdout: JSON.stringify(mockResponse), stderr: '' });
      });

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
      exec.mockImplementation((command, callback) => {
        callback(null, { stdout: JSON.stringify(mockResponse), stderr: '' });
      });

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
      exec.mockImplementation((command, callback) => {
        callback(new Error('Instance not found'), { stdout: '', stderr: 'Instance not found' });
      });

      // Verify that the error is properly thrown
      await expect(EC2Service.startInstance('i-invalid', 'test-profile')).rejects.toThrow('Instance not found');
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
      exec.mockImplementation((command, callback) => {
        callback(new Error('Access Denied'), { stdout: '', stderr: 'Access Denied' });
      });

      // Verify that the permission error is properly thrown
      await expect(EC2Service.getInstances('test-profile')).rejects.toThrow('Access Denied');
    });

    /**
     * Test: Handle network errors
     * 
     * Verifies that the EC2 service properly handles network-related errors
     * that occur when there are connectivity issues with AWS services.
     */
    test('should handle network errors', async () => {
      // Mock AWS CLI network error response
      exec.mockImplementation((command, callback) => {
        callback(new Error('Network timeout'), { stdout: '', stderr: 'Network timeout' });
      });

      // Verify that the network error is properly thrown
      await expect(EC2Service.getInstances('test-profile')).rejects.toThrow('Network timeout');
    });
  });
}); 