const chrome = process.env.PW_CHROME || '/home/box/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const PORT = process.env.PORT || '4477';
export default {
  testDir: 'e2e',
  use: { baseURL: `http://127.0.0.1:${PORT}`, launchOptions: { executablePath: chrome } },
  webServer: {
    command: `PORT=${PORT} node server.js`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.MUTATION,
  },
};
