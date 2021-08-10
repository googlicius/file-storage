import fs from 'fs';
import path from 'path';
import { Readable, Stream } from 'stream';

export const ensureDirectoryExistence = (filePath: string) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  fs.mkdirSync(dirname, { recursive: true });
};

/**
 * Convert data to stream if it is a buffer.
 */
export function toStream(data: Stream | Buffer): Stream {
  if (Buffer.isBuffer(data)) {
    return new Readable({
      read() {
        this.push(data);
      },
    });
  }

  return data;
}

/**
 * Check if file/directory exists in local
 */
export function exists(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

/**
 * Require a module es module as its default value.
 */
export function requireDefaultModule(path: string) {
  try {
    return require(path).default;
  } catch (error) {
    return null;
  }
}

/**
 * Get root directory.
 */
export function getRootCwd() {
  const cwd = process.cwd();
  const cwdArr = cwd.split('/');

  if (cwdArr[cwdArr.length - 2] === 'packages') {
    cwdArr.splice(cwdArr.length - 2, 2);
    return cwdArr.join('/');
  }
  return cwd;
}
