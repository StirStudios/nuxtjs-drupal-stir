import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'
const externalBaseUrl = process.env.A11Y_BASE_URL
const localBaseUrl = process.env.A11Y_SERVER_URL ?? 'http://127.0.0.1:4173'
const projectRoot = process.cwd()
const managedServerCommand = process.env.A11Y_SERVER_COMMAND
  ?? (process.env.STIR_A11Y_USE_FIXTURE === 'true'
    ? `"${process.execPath}" "${process.env.STIR_A11Y_SERVER_SCRIPT}"`
    : 'pnpm dev --host 127.0.0.1 --port 4173')
const playwrightConfig = defineConfig({
  testDir: import.meta.dirname,
  // A downstream dev server compiles and hydrates on demand. Warm it through
  // one browser state at a time so parallel first requests cannot trigger HMR
  // navigations while Axe is snapshotting. Existing/deployed targets remain
  // parallel because they are already stable.
  fullyParallel: Boolean(externalBaseUrl),
  forbidOnly: Boolean(process.env.CI),
  // Axe can occasionally observe Nuxt between hydration DOM updates even after
  // the load and motion-settle gates. Retry once locally so the same
  // deterministic check must fail twice; CI keeps its stronger two retries.
  retries: process.env.CI ? 2 : 1,
  workers: externalBaseUrl ? (process.env.CI ? 2 : void 0) : 1,
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
        command: managedServerCommand,
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
