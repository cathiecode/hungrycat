export default {
  transform: {},
  preset: 'ts-jest/presets/default-esm', // or other ESM presets
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: 'tsconfig.test.json',
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
