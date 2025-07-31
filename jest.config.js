module.exports = {
  projects: [
    {
      displayName: "backend",
      testMatch: ["<rootDir>/backend/**/*.test.js"],
      testEnvironment: "node",
      setupFilesAfterEnv: ["<rootDir>/backend/jest.setup.js"],
      collectCoverageFrom: [
        "backend/**/*.js",
        "!backend/node_modules/**",
        "!backend/scripts/**",
        "!backend/server.js",
      ],
    },
    {
      displayName: "frontend",
      testMatch: ["<rootDir>/frontend/src/**/*.test.{js,jsx}"],
      testEnvironment: "jsdom",
      setupFilesAfterEnv: ["<rootDir>/frontend/src/setupTests.js"],
      moduleNameMapping: {
        "\\.(css|less|scss|sass)$": "identity-obj-proxy",
      },
      transform: {
        "^.+\\.(js|jsx)$": "babel-jest",
      },
      collectCoverageFrom: [
        "frontend/src/**/*.{js,jsx}",
        "!frontend/src/index.js",
        "!frontend/src/reportWebVitals.js",
      ],
    },
  ],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
