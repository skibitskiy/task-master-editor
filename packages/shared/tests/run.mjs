import { strict as assert } from 'node:assert';
import {
  validateWorkspaceSelectOptions,
  validateWorkspaceSelectResult,
  validateFileReadInput,
  validateFileReadResult,
  validateFileWriteInput,
  validateFileWriteResult,
} from '../dist/ipc.js';

// IPC validators
assert.doesNotThrow(() => validateWorkspaceSelectOptions({ type: 'directory' }));
assert.doesNotThrow(() => validateWorkspaceSelectOptions({ type: 'file', multiple: true }));
assert.throws(() => validateWorkspaceSelectOptions({ type: 'nope' }));
assert.doesNotThrow(() => validateWorkspaceSelectResult({ paths: [] }));
assert.doesNotThrow(() => validateWorkspaceSelectResult({ paths: ['a'] }));
assert.throws(() => validateWorkspaceSelectResult({ paths: [1] }));

assert.doesNotThrow(() => validateFileReadInput({ path: '/tmp/x' }));
assert.doesNotThrow(() => validateFileReadResult({ data: 'ok' }));
assert.doesNotThrow(() => validateFileWriteInput({ path: '/tmp/x', data: 'x' }));
assert.doesNotThrow(() => validateFileWriteResult({ ok: true }));
assert.throws(() => validateFileReadInput({}));

console.log('Shared tests passed');

