/* eslint-disable no-console */
const assert = require('node:assert');

// Load compiled CommonJS modules
const security = require('../dist/security.js');
const main = require('../dist/main.js');

function testSecurityAllowList() {
  assert.strictEqual(
    security.isUrlAllowed('https://github.com/openai'),
    true,
    'github should be allowed',
  );
  assert.strictEqual(
    security.isUrlAllowed('https://openai.com/blog'),
    true,
    'openai should be allowed',
  );
  assert.strictEqual(
    security.isUrlAllowed('https://example.com'),
    false,
    'example.com should be blocked',
  );
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

function run() {
  testSecurityAllowList();
  testWindowPreferences();
  console.log('OK: security allow-list and window preferences pass');
}

run();
