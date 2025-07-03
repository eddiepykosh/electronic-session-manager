# Test Suite Documentation

This directory contains the comprehensive test suite for the Electronic Session Manager application.

## Test Structure

```
tests/
├── setup.js                          # Global test setup and mocks
├── run-tests.js                      # Test runner script
├── README.md                         # This documentation
├── utils/                            # Unit tests for utilities
│   └── logger.test.js               # Logger utility tests
├── config/                           # Unit tests for configuration
│   └── config.test.js               # Configuration management tests
├── services/                         # Unit tests for services
│   └── aws/                         # AWS service tests
│       ├── common.test.js           # AWS common utilities tests
│       └── ec2Service.test.js       # EC2 service tests
└── integration/                      # Integration tests
    └── awsService.integration.test.js # AWS service integration tests
```

## Test Framework

The project uses **Jest** as the primary testing framework with the following configuration:

- **Test Environment**: Node.js (for backend services)
- **Coverage**: 70% threshold for branches, functions, lines, and statements
- **Mocking**: Comprehensive mocking of Electron, file system, and child processes
- **Timeout**: 30 seconds per test
- **Verbose Output**: Detailed test results and coverage reports

## Running Tests

### Using npm scripts

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Using the test runner

```bash
# Run all tests
node tests/run-tests.js

# Run unit tests only
node tests/run-tests.js --unit

# Run integration tests only
node tests/run-tests.js --integration

# Run tests with coverage
node tests/run-tests.js --coverage

# Run tests in watch mode
node tests/run-tests.js --watch

# Run tests and exit on first failure
node tests/run-tests.js --bail

# Show help
node tests/run-tests.js --help
```

### Using Jest directly

```bash
# Run all tests
npx jest

# Run specific test file
npx jest tests/utils/logger.test.js

# Run tests matching pattern
npx jest --testNamePattern="Logger"

# Run tests with coverage
npx jest --coverage
```

## Test Categories

### Unit Tests

Unit tests focus on testing individual functions and modules in isolation:

- **Logger Tests** (`tests/utils/logger.test.js`)
  - Log level filtering and formatting
  - File output functionality
  - Error handling and edge cases

- **Configuration Tests** (`tests/config/config.test.js`)
  - Configuration loading and saving
  - Value access and updates
  - Validation and migration

- **AWS Common Tests** (`tests/services/aws/common.test.js`)
  - CLI availability checking
  - Profile management
  - Command execution

- **EC2 Service Tests** (`tests/services/aws/ec2Service.test.js`)
  - Instance listing and filtering
  - Instance control operations
  - Instance monitoring and status

### Integration Tests

Integration tests verify that multiple components work together correctly:

- **AWS Service Integration** (`tests/integration/awsService.integration.test.js`)
  - Service coordination and initialization
  - Profile validation with EC2 operations
  - Session Manager integration
  - Error handling across services

## Mocking Strategy

The test suite uses comprehensive mocking to isolate units and control external dependencies:

### Electron Mocks
- `app` object with mocked methods
- `BrowserWindow` constructor
- `ipcMain` and `ipcRenderer` for IPC communication
- `contextBridge` for preload script testing

### File System Mocks
- `fs` module for file operations
- `path` module for path manipulation
- Directory creation and file reading/writing

### Process Mocks
- `child_process.exec` for CLI command execution
- `child_process.spawn` for process spawning
- Command output and error simulation

### Console Mocks
- `console.log`, `console.error`, `console.warn`
- Suppressed output during tests
- Controlled logging for test verification

## Test Data

The test suite includes comprehensive mock data:

### EC2 Instances
```javascript
{
  InstanceId: 'i-1234567890abcdef0',
  InstanceType: 't3.micro',
  State: { Name: 'running' },
  PublicIpAddress: '192.168.1.100',
  PrivateIpAddress: '10.0.1.100',
  Tags: [{ Key: 'Name', Value: 'Test Instance' }]
}
```

### AWS Profiles
```javascript
['default', 'dev', 'prod', 'sso-profile']
```

### Configuration Data
```javascript
{
  aws: { defaultProfile: 'default', defaultRegion: 'us-east-1' },
  ui: { theme: 'light', autoRefresh: true },
  logging: { level: 'INFO', enableFileOutput: false },
  session: { defaultPort: 8080, timeout: 300000 }
}
```

## Coverage Requirements

The test suite enforces a minimum coverage threshold of 70% for:

- **Branches**: All code paths must be tested
- **Functions**: All functions must have test coverage
- **Lines**: All lines of code must be executed
- **Statements**: All statements must be covered

Coverage reports are generated in multiple formats:
- **Text**: Console output with coverage summary
- **LCOV**: For CI/CD integration
- **HTML**: Detailed coverage report in `coverage/` directory

## Best Practices

### Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names that explain the expected behavior
- Separate setup, execution, and assertion phases

### Mocking Guidelines
- Mock external dependencies consistently
- Use realistic mock data that matches production scenarios
- Reset mocks between tests to ensure isolation

### Error Testing
- Test both success and failure scenarios
- Verify error messages and handling
- Test edge cases and boundary conditions

### Async Testing
- Use `async/await` for asynchronous operations
- Test promise rejections and timeouts
- Mock timers for time-dependent operations

## Continuous Integration

The test suite is designed to run in CI/CD environments:

- **Fast Execution**: Tests complete within reasonable time limits
- **Deterministic**: Tests produce consistent results
- **Isolated**: Tests don't depend on external services
- **Comprehensive**: High coverage ensures code quality

## Troubleshooting

### Common Issues

1. **Mock not working**: Ensure mocks are reset between tests
2. **Async test failures**: Check for proper `await` usage
3. **Coverage gaps**: Add tests for uncovered code paths
4. **Timeout errors**: Increase timeout for slow operations

### Debug Mode

Run tests with additional debugging:

```bash
# Enable Jest debugging
DEBUG=jest* npx jest

# Run single test with verbose output
npx jest --verbose tests/utils/logger.test.js
```

## Contributing

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Ensure adequate coverage for new functionality
3. Include both positive and negative test cases
4. Update this documentation if adding new test categories
5. Run the full test suite before submitting changes 