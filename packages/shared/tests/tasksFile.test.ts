import { describe, it, expect } from 'vitest';
import { parseTasksFile, serializeTasksFile, TasksFile } from '../src/tasksFile';

const sample = `{
  "master": {
    "tasks": [[
      { "id": 1, "title": "t1" },
      { "id": 2, "title": "t2", "dependencies": [1] }
    ]]
  }
}`;

describe('TasksFile parse/serialize', () => {
  it('parses valid structure', () => {
    const tf = parseTasksFile(sample);
    expect(tf.master.tasks[0].length).toBe(2);
    expect(tf.master.tasks[0][1].dependencies).toEqual([1]);
  });

  it('rejects invalid root', () => {
    expect(() => parseTasksFile('null')).toThrow();
  });

  it('rejects missing master', () => {
    expect(() => parseTasksFile('{"x":1}')).toThrow();
  });

  it('rejects tasks not as two-level array', () => {
    expect(() => parseTasksFile('{"master":{"tasks":[]}}')).toThrow();
    expect(() => parseTasksFile('{"master":{"tasks":{}}}')).toThrow();
  });

  it('serializes back to JSON', () => {
    const tf = parseTasksFile(sample);
    const out = serializeTasksFile(tf);
    const parsed = JSON.parse(out) as TasksFile;
    expect(parsed.master.tasks[0][0].title).toBe('t1');
  });

  it('serialize rejects invalid object', () => {
    expect(() => serializeTasksFile({} as unknown as TasksFile)).toThrow();
  });
});
