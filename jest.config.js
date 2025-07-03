/**
 * Jest Configuration for Electronic Session Manager
 * 
 * This configuration sets up Jest for testing the Electron application,
 * including proper module resolution, test environment, and coverage settings.
 */

module.exports = {
  // Test environment - Node.js for backend services
  testEnvironment: 'node',
  
  // Root directory for tests
  roots: ['<rootDir>/tests'],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Module name mapping for imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/main/main.js', // Exclude main process entry point
    '!src/renderer/renderer.js', // Exclude renderer entry point
    '!src/preload/preload.js', // Exclude preload script
    '!**/node_modules/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 45,
      functions: 45,
      lines: 45,
      statements: 45
    }
  },
  
  // Coverage report directory
  coverageDirectory: 'coverage',
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test timeout (30 seconds)
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Reset modules between tests
  resetModules: true,
  
  // Restore mocks between tests
  restoreMocks: true
}; 