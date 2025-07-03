#!/usr/bin/env node

/**
 * Test Runner Script
 * 
 * This script provides a convenient way to run the test suite
 * with different configurations and options.
 */

const { spawn } = require('child_process');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  unit: {
    pattern: 'tests/**/*.test.js',
    exclude: 'tests/integration/**/*.test.js'
  },
  integration: {
    pattern: 'tests/integration/**/*.test.js'
  },
  all: {
    pattern: 'tests/**/*.test.js'
  }
};

// Jest options
const JEST_OPTIONS = {
  verbose: true,
  colors: true,
  coverage: false,
  watch: false,
  bail: false
};

/**
 * Run Jest with specified options
 */
function runJest(options = {}) {
  const jestArgs = [
    '--config', path.join(__dirname, '../jest.config.js')
  ];

  // Add pattern if specified
  if (options.pattern) {
    jestArgs.push('--testPathPattern', options.pattern);
  }

  // Add exclude pattern if specified
  if (options.exclude) {
    jestArgs.push('--testPathIgnorePatterns', options.exclude);
  }

  // Add Jest options
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

  const jestProcess = spawn('npx', ['jest', ...jestArgs], {
    stdio: 'inherit',
    shell: true
  });

  jestProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ All tests passed!');
    } else {
      console.log(`\n❌ Tests failed with exit code ${code}`);
      process.exit(code);
    }
  });

  jestProcess.on('error', (error) => {
    console.error('Failed to start Jest:', error.message);
    process.exit(1);
  });
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Test Runner for Electronic Session Manager

Usage: node tests/run-tests.js [options]

Options:
  --unit              Run unit tests only
  --integration       Run integration tests only
  --all               Run all tests (default)
  --coverage          Generate coverage report
  --watch             Run tests in watch mode
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
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = { ...JEST_OPTIONS };
  let testType = 'all';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--unit':
        testType = 'unit';
        break;
      case '--integration':
        testType = 'integration';
        break;
      case '--all':
        testType = 'all';
        break;
      case '--coverage':
        options.coverage = true;
        break;
      case '--watch':
        options.watch = true;
        break;
      case '--bail':
        options.bail = true;
        break;
      case '--help':
        showHelp();
        process.exit(0);
        break;
      default:
        console.warn(`Unknown option: ${arg}`);
        break;
    }
  }

  return { testType, options };
}

/**
 * Main function
 */
function main() {
  console.log('🧪 Electronic Session Manager Test Runner\n');

  const { testType, options } = parseArgs();
  const config = TEST_CONFIG[testType];

  if (!config) {
    console.error(`Unknown test type: ${testType}`);
    process.exit(1);
  }

  console.log(`Running ${testType} tests...`);
  console.log(`Pattern: ${config.pattern}`);
  if (config.exclude) {
    console.log(`Exclude: ${config.exclude}`);
  }
  console.log('');

  runJest({
    ...options,
    pattern: config.pattern,
    exclude: config.exclude
  });
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  runJest,
  TEST_CONFIG,
  JEST_OPTIONS
}; 