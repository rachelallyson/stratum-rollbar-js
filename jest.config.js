module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
};
