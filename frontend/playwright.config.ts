import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: true,
  retries: 2,
  workers: 1,
  reporter: 'list',
  timeout: 60000,
  globalSetup: path.join(__dirname, 'tests', 'global-setup.ts'),
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npx vite --port 5173 --strictPort',
      port: 5173,
      reuseExistingServer: true,
    },
    {
      command: 'npx tsx src/server.ts',
      cwd: '../backend',
      port: 5000,
      reuseExistingServer: true,
      env: {
        GEMINI_API_BASE: 'http://127.0.0.1:3099',
        GROQ_API_BASE: 'http://127.0.0.1:3099',
        RATE_LIMIT_GENERAL_MAX: '10000',
        RATE_LIMIT_STRICT_MAX: '1000',
        RATE_LIMIT_AUTH_MAX: '100',
      },
    },
  ],
});
