const nextJest = require('next/jest')

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  
  // Setup files to run before each test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module name mapping for path aliases
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@server/(.*)$': '<rootDir>/src/server/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^react-markdown$': '<rootDir>/node_modules/react-markdown/index.js',
  },
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/layout.{js,jsx,ts,tsx}',
    '!src/app/**/page.{js,jsx,ts,tsx}',
    '!src/app/globals.css',
  ],
  
  // Coverage thresholds (optional - adjust as needed)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Ignore patterns
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(react-markdown|remark-gfm|vfile|vfile-message|unified|bail|is-plain-obj|trough|remark-parse|remark-rehype|rehype-format|rehype-stringify|mdast-util-to-hast|unist-util-position|unist-util-visit|unist-util-is|hast-util-whitespace|hast-util-raw|zwitch|html-void-elements|hast-util-from-parse5|hastscript|hast-util-parse-selector|hast-util-to-string|property-information|space-separated-tokens|comma-separated-tokens|web-namespaces)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(config)