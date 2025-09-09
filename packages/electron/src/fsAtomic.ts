import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { parseTasksJson } from '@app/shared';

async function fsyncFile(filePath: string): Promise<void> {
  const fh = await fs.open(filePath, 'r');
  try {
    await fh.sync();
  } catch {
    // ignore fsync errors (platform-specific)
  } finally {
    await fh.close();
  }
}

async function fsyncDir(dirPath: string): Promise<void> {
  try {
    const fh = await fs.open(dirPath, 'r');
    try {
      await fh.sync();
    } finally {
      await fh.close();
    }
  } catch {
    // ignore on platforms that don't allow directory fsync
  }
}

export async function atomicWriteTasksJsonWithBackup(
  targetPath: string,
  jsonData: string,
): Promise<void> {
  // validate JSON and schema first
  parseTasksJson(jsonData);

  const dir = path.dirname(targetPath);
  const base = path.basename(targetPath);
  const tmpPath = path.join(
    dir,
    `.${base}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`,
  );
  const bakPath = `${targetPath}.bak`;

  // write tmp file and fsync
  const tmpHandle = await fs.open(tmpPath, 'w');
  try {
    await tmpHandle.writeFile(jsonData, { encoding: 'utf-8' });
    await tmpHandle.sync();
  } finally {
    await tmpHandle.close();
  }

  // backup current file if exists
  try {
    await fs.stat(targetPath);
    // overwrite backup with latest original
    await fs.copyFile(targetPath, bakPath);
    await fsyncFile(bakPath);
  } catch {
    // no original file — skip backup
  }

  // atomically replace original
  await fs.rename(tmpPath, targetPath);
  await fsyncFile(targetPath);
  await fsyncDir(dir);
}
