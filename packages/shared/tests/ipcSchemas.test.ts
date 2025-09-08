import { describe, it, expect } from 'vitest';
import {
  validateWorkspaceSelectOptions,
  validateWorkspaceSelectResult,
  validateFileReadInput,
  validateFileReadResult,
  validateFileWriteInput,
  validateFileWriteResult,
} from '../src/ipc';

describe('IPC schemas', () => {
  it('validates workspace select options', () => {
    expect(() => validateWorkspaceSelectOptions({ type: 'directory' })).not.toThrow();
    expect(() => validateWorkspaceSelectOptions({ type: 'file', multiple: true })).not.toThrow();
    expect(() => validateWorkspaceSelectOptions({ type: 'nope' })).toThrow();
  });

  it('validates workspace select result', () => {
    expect(() => validateWorkspaceSelectResult({ paths: [] })).not.toThrow();
    expect(() => validateWorkspaceSelectResult({ paths: ['a'] })).not.toThrow();
    expect(() => validateWorkspaceSelectResult({ paths: [1] })).toThrow();
  });

  it('validates file read/write payloads', () => {
    expect(() => validateFileReadInput({ path: '/tmp/x' })).not.toThrow();
    expect(() => validateFileReadResult({ data: 'ok' })).not.toThrow();
    expect(() => validateFileWriteInput({ path: '/tmp/x', data: 'x' })).not.toThrow();
    expect(() => validateFileWriteResult({ ok: true })).not.toThrow();
    expect(() => validateFileReadInput({})).toThrow();
  });
});
