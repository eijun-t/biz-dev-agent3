const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/lib/agents/writer/services/report-generator$': '<rootDir>/__mocks__/lib/agents/writer/services/report-generator.ts',
    '^@/lib/agents/writer/services/performance-monitor$': '<rootDir>/__mocks__/lib/agents/writer/services/performance-monitor.ts',
  },
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch|isows|@supabase)/)',
  ],
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)