import { _electron as electron, test, expect } from '@playwright/test';
import path from 'node:path';

test.beforeAll(async () => {
  // ensure prod assets exist
  // build renderer and electron
  // In CI this could be separated; here we call build once
});

test('Electron opens window and shows skeleton UI', async () => {
  // Always build to ensure fresh artifacts
  const { execSync } = await import('node:child_process');
  execSync('npm run build', { stdio: 'inherit', cwd: path.resolve(__dirname, '../..') });

  const electronApp = await electron.launch({
    args: ['.'],
    cwd: path.resolve(__dirname, '../../packages/electron'),
    env: { APP_AUTO_QUIT: '0' },
  });

  const window = await electronApp.firstWindow();
  await expect(window).toBeDefined();
  // Debug dump
  const title = await window.title();
  const bodyText = await window.evaluate(() => document.body?.innerText || '');
  console.log('E2E title:', title);
  console.log('E2E body:', bodyText.slice(0, 200));
  await window.waitForSelector('h1:has-text("Task Master Editor")', { timeout: 25000 });
  await window.waitForSelector('text=Renderer is running', { timeout: 25000 });

  await electronApp.close();
});
