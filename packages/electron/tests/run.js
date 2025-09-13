/* eslint-disable no-console */
import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { atomicWriteTasksJsonWithBackup } from '../dist/fsAtomic.cjs';
import * as main from '../dist/main.cjs';
// Load compiled ESM modules from tsc output (NodeNext)
import * as security from '../dist/security.cjs';

function testSecurityAllowList() {
  assert.strictEqual(security.isUrlAllowed('https://github.com/openai'), true, 'github should be allowed');
  assert.strictEqual(security.isUrlAllowed('https://openai.com/blog'), true, 'openai should be allowed');
  assert.strictEqual(security.isUrlAllowed('https://example.com'), false, 'example.com should be blocked');
  assert.strictEqual(security.isUrlAllowed('notaurl'), false, 'invalid URL should be blocked');
}

function testWindowPreferences() {
  const opts = main.getBrowserWindowOptions();
  assert.ok(opts && opts.webPreferences, 'should have webPreferences');
  const wp = opts.webPreferences;
  assert.strictEqual(wp.nodeIntegration, false, 'nodeIntegration=false');
  assert.strictEqual(wp.contextIsolation, true, 'contextIsolation=true');
  assert.strictEqual(wp.sandbox, true, 'sandbox=true');
}

async function run() {
  testSecurityAllowList();
  testWindowPreferences();
  console.log('OK: security allow-list and window preferences pass');
  await testAtomicWrite();
}

async function testAtomicWrite() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tm-editor-'));
  const file = path.join(tmpDir, 'tasks.json');
  const bak = `${file}.bak`;

  await assert.rejects(() => atomicWriteTasksJsonWithBackup(file, '{oops'), /Invalid JSON/);

  const v1 = JSON.stringify({ master: { tasks: [{ id: 1, title: 'A' }] } }, null, 2);
  await atomicWriteTasksJsonWithBackup(file, v1);
  assert.equal(JSON.parse(await fs.readFile(file, 'utf-8')).master.tasks[0].title, 'A');

  const before = await fs.readFile(file, 'utf-8');
  await assert.rejects(() => atomicWriteTasksJsonWithBackup(file, JSON.stringify({ not: 'tasks' })), /Invalid schema/);
  assert.equal(await fs.readFile(file, 'utf-8'), before);

  const v2 = JSON.stringify({ master: { tasks: [{ id: 1, title: 'B' }] } }, null, 2);
  await atomicWriteTasksJsonWithBackup(file, v2);
  const hasBak = await fs
    .stat(bak)
    .then(() => true)
    .catch(() => false);
  assert.ok(hasBak, 'backup should exist');
  assert.equal(JSON.parse(await fs.readFile(file, 'utf-8')).master.tasks[0].title, 'B');
  console.log('OK: atomic write with backup works');
}

void run();
