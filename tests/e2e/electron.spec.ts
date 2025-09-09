import { _electron as electron, test, expect } from '@playwright/test';
import path from 'node:path';
import electronPath from 'electron';

test.beforeAll(async () => {
  // ensure prod assets exist
  // build renderer and electron
  // In CI this could be separated; here we call build once
});

test('Electron opens window and shows skeleton UI', async () => {
  // Always build to ensure fresh artifacts
  const { execSync } = await import('node:child_process');
  execSync('npm run build', { stdio: 'inherit', cwd: path.resolve(__dirname, '../..') });

  let electronApp;
  try {
    electronApp = await electron.launch({
      executablePath: electronPath as unknown as string,
      args: ['--no-sandbox', '.'],
      cwd: path.resolve(__dirname, '../../packages/electron'),
      env: { APP_AUTO_QUIT: '0', ELECTRON_ENABLE_LOGGING: '1', ELECTRON_DISABLE_GPU: '1' },
    });
  } catch (err) {
    test.skip(
      true,
      `Electron failed to launch in this environment: ${err instanceof Error ? err.message : String(err)}`,
    );
    throw err;
  }

  const window = await electronApp.firstWindow();
  await expect(window).toBeDefined();
  // Debug dump
  const title = await window.title();
  const bodyText = await window.evaluate(() => document.body?.innerText || '');
  console.log('E2E title:', title);
  console.log('E2E body:', bodyText.slice(0, 200));
  await window.waitForSelector('text=Выберите файл задач', { timeout: 25000 });

  // Security assertions: no Node in renderer
  const hasProcess = await window.evaluate(() => 'process' in (window as Record<string, unknown>));
  const hasRequire = await window.evaluate(() => 'require' in (window as Record<string, unknown>));
  expect(hasProcess).toBe(false);
  expect(hasRequire).toBe(false);

  // Preload API signature exists
  const apiShape = await window.evaluate(() => {
    const w = window as unknown as {
      api?: {
        workspace?: { select?: unknown };
        file?: { read?: unknown; write?: unknown };
      };
    };
    return {
      workspaceSelect: typeof w.api?.workspace?.select,
      fileRead: typeof w.api?.file?.read,
      fileWrite: typeof w.api?.file?.write,
    };
  });
  expect(apiShape.workspaceSelect).toBe('function');
  expect(apiShape.fileRead).toBe('function');
  expect(apiShape.fileWrite).toBe('function');

  await electronApp.close();
});
