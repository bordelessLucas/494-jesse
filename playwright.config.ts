import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

const ROOT = resolve(import.meta.dirname)

function loadEnvFile(relativePath: string) {
  const absolutePath = resolve(ROOT, relativePath)
  if (!existsSync(absolutePath)) return
  dotenv.config({ path: absolutePath, override: false })
}

loadEnvFile('.env')
loadEnvFile('.env.e2e')

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
