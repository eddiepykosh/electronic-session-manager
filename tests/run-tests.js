#!/usr/bin/env node

/**
 * Test Runner Script
 * 
 * HIGH-LEVEL SUMMARY:
 * This script provides a comprehensive test runner for the Electronic Session Manager
 * application with support for different test types (unit, integration, all) and
 * various execution options (coverage, watch mode, bail on failure).
 * 
 * Key features:
 * - Configurable test patterns for different test types
 * - Jest integration with custom options
 * - Command-line argument parsing
 * - Help system for usage instructions
 * - Exit code handling for CI/CD integration
 * 
 * Usage examples:
 * - node tests/run-tests.js --unit (run unit tests only)
 * - node tests/run-tests.js --integration --coverage (run integration tests with coverage)
 * - node tests/run-tests.js --all --watch (run all tests in watch mode)
 */

const { spawn } = require('child_process');
const path = require('path');

// Test configuration object defining patterns for different test types
// Each test type has specific patterns to include/exclude certain test files
const TEST_CONFIG = {
  unit: {
    pattern: 'tests/**/*.test.js', // Pattern for all test files
    exclude: 'tests/integration/**/*.test.js' // Exclude integration tests
  },
  integration: {
    pattern: 'tests/integration/**/*.test.js' // Only integration test files
  },
  all: {
    pattern: 'tests/**/*.test.js' // All test files without exclusions
  }
};

// Default Jest execution options
// These can be overridden via command-line arguments
const JEST_OPTIONS = {
  verbose: true, // Show detailed test output
  colors: true, // Enable colored output
  coverage: false, // Disable coverage by default
  watch: false, // Disable watch mode by default
  bail: false // Don't exit on first failure by default
};

/**
 * Run Jest with specified options
 * 
 * This function spawns a Jest process with the given configuration options.
 * It handles the Jest process lifecycle and provides appropriate exit codes
 * for CI/CD integration.
 * 
 * @param {Object} options - Jest configuration options
 * @param {string} options.pattern - Test file pattern to include
 * @param {string} options.exclude - Test file pattern to exclude
 * @param {boolean} options.verbose - Enable verbose output
 * @param {boolean} options.colors - Enable colored output
 * @param {boolean} options.coverage - Generate coverage report
 * @param {boolean} options.watch - Run in watch mode
 * @param {boolean} options.bail - Exit on first test failure
 */
function runJest(options = {}) {
  // Build Jest command line arguments array
  const jestArgs = [
    '--config', path.join(__dirname, '../jest.config.js') // Specify Jest config file
  ];

  // Add pattern if specified to limit which tests to run
  if (options.pattern) {
    jestArgs.push('--testPathPattern', options.pattern);
  }

  // Add exclude pattern if specified to skip certain test files
  if (options.exclude) {
    jestArgs.push('--testPathIgnorePatterns', options.exclude);
  }

  // Add Jest options based on configuration
  if (options.verbose) {
    jestArgs.push('--verbose');
  }

  if (options.colors) {
    jestArgs.push('--colors');
  }

  if (options.coverage) {
    jestArgs.push('--coverage');
  }

  if (options.watch) {
    jestArgs.push('--watch');
  }

  if (options.bail) {
    jestArgs.push('--bail');
  }

  console.log('Running Jest with arguments:', jestArgs.join(' '));

  // Spawn Jest process with inherited stdio for real-time output
  const jestProcess = spawn('npx', ['jest', ...jestArgs], {
    stdio: 'inherit', // Inherit parent's stdio for real-time output
    shell: true // Use shell for better cross-platform compatibility
  });

  // Handle Jest process completion
  jestProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ All tests passed!');
    } else {
      console.log(`\n❌ Tests failed with exit code ${code}`);
      process.exit(code); // Exit with Jest's exit code for CI/CD
    }
  });

  // Handle Jest process startup errors
  jestProcess.on('error', (error) => {
    console.error('Failed to start Jest:', error.message);
    process.exit(1); // Exit with error code
  });
}

/**
 * Display help information
 * 
 * Shows comprehensive usage instructions and available options
 * for the test runner script.
 */
function showHelp() {
  console.log(`
Test Runner for Electronic Session Manager

Usage: node tests/run-tests.js [options]

Options:
  --unit              Run unit tests only (excludes integration tests)
  --integration       Run integration tests only
  --all               Run all tests (default behavior)
  --coverage          Generate coverage report
  --watch             Run tests in watch mode (re-runs on file changes)
  --bail              Exit on first test failure
  --help              Show this help message

Examples:
  node tests/run-tests.js --unit
  node tests/run-tests.js --integration --coverage
  node tests/run-tests.js --all --watch
  `);
}

/**
 * Parse command line arguments
 * 
 * Processes command-line arguments and returns a configuration object
 * with the selected test type and Jest options.
 * 
 * @returns {Object} Object containing testType and options
 */
function parseArgs() {
  const args = process.argv.slice(2); // Remove node and script name
  const options = { ...JEST_OPTIONS }; // Start with default options
  let testType = 'all'; // Default to running all tests

  // Process each command-line argument
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--unit':
        testType = 'unit'; // Set to run unit tests only
        break;
      case '--integration':
        testType = 'integration'; // Set to run integration tests only
        break;
      case '--all':
        testType = 'all'; // Set to run all tests
        break;
      case '--coverage':
        options.coverage = true; // Enable coverage reporting
        break;
      case '--watch':
        options.watch = true; // Enable watch mode
        break;
      case '--bail':
        options.bail = true; // Exit on first failure
        break;
      case '--help':
        showHelp(); // Display help and exit
        process.exit(0);
        break;
      default:
        console.warn(`Unknown option: ${arg}`); // Warn about unknown options
        break;
    }
  }

  return { testType, options };
}

/**
 * Main function
 * 
 * Entry point for the test runner script. Parses arguments,
 * validates configuration, and executes Jest with the appropriate
 * settings.
 */
function main() {
  console.log('🧪 Electronic Session Manager Test Runner\n');

  // Parse command-line arguments
  const { testType, options } = parseArgs();
  const config = TEST_CONFIG[testType];

  // Validate test type configuration
  if (!config) {
    console.error(`Unknown test type: ${testType}`);
    process.exit(1);
  }

  // Display test execution information
  console.log(`Running ${testType} tests...`);
  console.log(`Pattern: ${config.pattern}`);
  if (config.exclude) {
    console.log(`Exclude: ${config.exclude}`);
  }
  console.log('');

  // Execute Jest with the configured options
  runJest({
    ...options,
    pattern: config.pattern,
    exclude: config.exclude
  });
}

// Run the main function if this script is executed directly
// This allows the module to be both executable and importable
if (require.main === module) {
  main();
}

// Export functions and configuration for potential programmatic use
module.exports = {
  runJest,
  TEST_CONFIG,
  JEST_OPTIONS
}; 