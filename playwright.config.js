const chrome = process.env.PW_CHROME || '/home/box/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
export default {
  testDir: 'e2e',
  use: { baseURL: 'http://127.0.0.1:4477', launchOptions: { executablePath: chrome } },
  webServer: {
    command: 'PORT=4477 node server.js',
    url: 'http://127.0.0.1:4477',
    reuseExistingServer: !process.env.MUTATION,
  },
};
