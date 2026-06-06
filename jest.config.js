module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  testMatch: [
    '<rootDir>/src/**/*.spec.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,html}',
    '!src/**/*.d.ts',
    '!src/**/*.spec.ts', // Exclude unit tests
    '!src/**/*.integration.spec.ts', // Exclude integration tests
    '!src/main.ts', // Exclude main application entry file
    '!src/polyfills.ts', // Exclude polyfills
    '!src/environments/*.ts' // Exclude environment configuration files
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
    '^@features/(.*)$': '<rootDir>/src/app/features/$1'
  },
  transform: {
    '^.+\\.(ts|html)$': 'jest-preset-angular'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@angular|@storybook|@sentry)/)'
  ]
};
