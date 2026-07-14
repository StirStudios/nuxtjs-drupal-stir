import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'
const externalBaseUrl = process.env.A11Y_BASE_URL
const localBaseUrl = process.env.A11Y_SERVER_URL ?? 'http://127.0.0.1:4173'
const projectRoot = process.cwd()
const playwrightConfig = defineConfig({
  testDir: import.meta.dirname,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : void 0,
  outputDir: path.join(projectRoot, 'test-results'),
  reporter: [
    ['line'],
    [
      'html',
      {
        open: 'never',
        outputFolder: path.join(projectRoot, 'playwright-report'),
      },
    ],
  ],
  use: {
    baseURL: externalBaseUrl ?? localBaseUrl,
    ignoreHTTPSErrors: true,
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: externalBaseUrl
    ? void 0
    : {
        command:
          process.env.A11Y_SERVER_COMMAND ??
          'pnpm dev --host 127.0.0.1 --port 4173',
        cwd: projectRoot,
        url: localBaseUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 12e4,
      },
  projects: [
    {
      name: 'desktop-light',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'light',
      },
    },
    {
      name: 'desktop-dark',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
      },
    },
    {
      name: 'mobile-light',
      use: {
        ...devices['Pixel 7'],
        colorScheme: 'light',
      },
    },
    {
      name: 'mobile-dark',
      use: {
        ...devices['Pixel 7'],
        colorScheme: 'dark',
      },
    },
  ],
})
export default playwrightConfig
