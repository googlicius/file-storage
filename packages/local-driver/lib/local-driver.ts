import fs, { ReadStream } from 'fs';
import { dirname } from 'path';
import { Stream } from 'stream';
import {
  Driver,
  DriverName,
  ensureDirectoryExistence,
  exists,
  FileNotFoundError,
  LocalDiskConfig,
  PutResult,
  toStream,
} from '@file-storage/common';

export class LocalDriver extends Driver {
  private root: string;
  static readonly driverName = DriverName.LOCAL;

  constructor(config: LocalDiskConfig) {
    super(config);
    const { root = '' } = config;
    this.root = root;
  }

  private rootPath(path: string): string {
    return this.root + '/' + path;
  }

  protected errorHandler(error: any) {
    if (error.code === 'ENOENT') {
      throw new FileNotFoundError(error.message);
    }
    throw error;
  }

  url(path: string): string {
    return `${process.env.APP_URL}/${path}`;
  }

  async exists(path: string) {
    try {
      await exists(this.rootPath(path));
      return true;
    } catch (e) {
      return false;
    }
  }

  size(path: string): Promise<number> {
    return new Promise((resolve, reject) => {
      fs.stat(this.rootPath(path), (err, stats) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(stats.size);
      });
    });
  }

  lastModified(path: string): Promise<number> {
    return new Promise((resolve, reject) => {
      fs.stat(this.rootPath(path), (err, stats) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(stats.ctimeMs);
      });
    });
  }

  put(data: Stream | Buffer, path: string): Promise<PutResult> {
    ensureDirectoryExistence(this.rootPath(path));
    const writeStream = fs.createWriteStream(this.rootPath(path));

    toStream(data).pipe(writeStream);

    return new Promise<PutResult>((resole, reject) => {
      writeStream.on('close', () => {
        resole({
          success: true,
          message: 'Uploading success!',
        });
      });
      writeStream.on('error', (error) => {
        reject(error);
      });
    });
  }

  async get(path: string): Promise<ReadStream> {
    await exists(this.rootPath(path));
    return fs.createReadStream(this.rootPath(path));
  }

  delete(path: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      fs.unlink(this.rootPath(path), (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(true);
      });
    });
  }

  async makeDir(path: string): Promise<string> {
    const dir = dirname(path);
    if (fs.existsSync(dir)) {
      throw new Error('Directory already exists');
    }
    fs.mkdirSync(dir, { recursive: true });

    return dir;
  }

  removeDir(dir: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.rm(dir, { recursive: true }, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(dir);
      });
    });
  }
}
