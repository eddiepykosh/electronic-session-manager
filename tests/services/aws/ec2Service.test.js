/**
 * EC2 Service Tests
 * 
 * Basic tests for EC2 service operations
 */

const { exec } = require('child_process');
const EC2Service = require('../../../src/services/aws/ec2Service');

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn()
}));

describe('EC2 Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Instance Listing', () => {
    test('should list all EC2 instances', async () => {
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

      exec.mockImplementation((command, callback) => {
        callback(null, { stdout: JSON.stringify({ Reservations: [{ Instances: mockInstances }] }), stderr: '' });
      });

      const instances = await EC2Service.getInstances('test-profile');
      expect(instances).toBeDefined();
      expect(instances.length).toBe(1);
    });

    test('should handle empty instance list', async () => {
      exec.mockImplementation((command, callback) => {
        callback(null, { stdout: JSON.stringify({ Reservations: [] }), stderr: '' });
      });

      const instances = await EC2Service.getInstances('test-profile');
      expect(instances).toEqual([]);
    });

    test('should handle instance listing errors', async () => {
      exec.mockImplementation((command, callback) => {
        callback(new Error('Access denied'), { stdout: '', stderr: 'Access denied' });
      });

      await expect(EC2Service.getInstances('test-profile')).rejects.toThrow('Access denied');
    });
  });

  describe('Instance Control', () => {
    test('should start instance successfully', async () => {
      const mockResponse = {
        StartingInstances: [{
          InstanceId: 'i-1234567890abcdef0',
          PreviousState: { Name: 'stopped' },
          CurrentState: { Name: 'pending' }
        }]
      };

      exec.mockImplementation((command, callback) => {
        callback(null, { stdout: JSON.stringify(mockResponse), stderr: '' });
      });

      const result = await EC2Service.startInstance('i-1234567890abcdef0', 'test-profile');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('should stop instance successfully', async () => {
      const mockResponse = {
        StoppingInstances: [{
          InstanceId: 'i-1234567890abcdef0',
          PreviousState: { Name: 'running' },
          CurrentState: { Name: 'stopping' }
        }]
      };

      exec.mockImplementation((command, callback) => {
        callback(null, { stdout: JSON.stringify(mockResponse), stderr: '' });
      });

      const result = await EC2Service.stopInstance('i-1234567890abcdef0', 'test-profile');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('should handle start instance errors', async () => {
      exec.mockImplementation((command, callback) => {
        callback(new Error('Instance not found'), { stdout: '', stderr: 'Instance not found' });
      });

      await expect(EC2Service.startInstance('i-invalid', 'test-profile')).rejects.toThrow('Instance not found');
    });
  });

  describe('Error Handling', () => {
    test('should handle permission errors', async () => {
      exec.mockImplementation((command, callback) => {
        callback(new Error('Access Denied'), { stdout: '', stderr: 'Access Denied' });
      });

      await expect(EC2Service.getInstances('test-profile')).rejects.toThrow('Access Denied');
    });

    test('should handle network errors', async () => {
      exec.mockImplementation((command, callback) => {
        callback(new Error('Network timeout'), { stdout: '', stderr: 'Network timeout' });
      });

      await expect(EC2Service.getInstances('test-profile')).rejects.toThrow('Network timeout');
    });
  });
}); 