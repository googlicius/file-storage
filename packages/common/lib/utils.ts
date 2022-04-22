import fs from 'fs';
import path from 'path';
import { Readable, Stream, PassThrough } from 'stream';

export const ensureDirectoryExistence = (filePath: string) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  fs.mkdirSync(dirname, { recursive: true });
};

/**
 * Convert data to readable stream if it is a buffer or string.
 */
// TODO rename to toReadable.
export function toStream(buf: Buffer | Stream | string, chunkSize?: number): Readable {
  if (typeof buf === 'string') {
    buf = Buffer.from(buf, 'utf8');
  }
  if (!Buffer.isBuffer(buf)) {
    if (!(buf instanceof Readable)) {
      const pass = new PassThrough();
      buf.pipe(pass);
      return pass;
    }

    return buf;
  }

  const reader = new Readable();
  const hwm = reader.readableHighWaterMark;

  // If chunkSize is invalid, set to highWaterMark.
  if (!chunkSize || typeof chunkSize !== 'number' || chunkSize < 1 || chunkSize > hwm) {
    chunkSize = hwm;
  }

  const len = buf.length;
  let start = 0;

  // Overwrite _read method to push data from buffer.
  reader._read = function () {
    while (reader.push((<Buffer>buf).slice(start, (start += chunkSize)))) {
      // If all data pushed, just break the loop.
      if (start >= len) {
        reader.push(null);
        break;
      }
    }
  };
  return reader;
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
export function requireDefaultModule(path: string, notThrow = true) {
  try {
    return require(path).default;
  } catch (error) {
    if (notThrow) {
      return null;
    }
    throw error;
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

export async function streamToBuffer(stream: Stream): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const _buf = Array<any>();

    stream.on('data', (chunk) => {
      _buf.push(chunk);
    });
    stream.on('end', () => {
      resolve(Buffer.concat(_buf));
    });
    stream.on('error', (err) => reject(`error converting stream - ${err}`));
  });
}

export function getExt(filepath: string) {
  return filepath.split('?')[0].split('#')[0].split('.').pop();
}

/**
 * Get file name frome give path.
 */
export function getFileName(filePath: string) {
  return filePath
    .split('?')[0]
    .split('#')[0]
    .replace(/^.*[\\/]/, '');
}

export const bytesToKbytes = (bytes: number) => Math.round((bytes / 1000) * 100) / 100;
