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
  private publicUrl: string;
  static readonly driverName = DriverName.LOCAL;

  constructor(config: LocalDiskConfig) {
    super(config);
    const { root = '', publicUrl } = config;
    this.root = root;
    this.publicUrl = publicUrl;
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

  protected async stats(path: string): Promise<fs.Stats> {
    return new Promise((resolve, reject) => {
      fs.stat(this.rootPath(path), (err, stats) => {
        if (err) {
          return reject(err);
        }
        resolve(stats);
      });
    });
  }

  url(path: string): string {
    return `${this.publicUrl}/${path}`;
  }

  async exists(path: string) {
    try {
      await exists(this.rootPath(path));
      return true;
    } catch (e) {
      return false;
    }
  }

  async size(path: string): Promise<number> {
    const stats = await this.stats(path);
    return stats.size;
  }

  async lastModified(path: string): Promise<number> {
    const stats = await this.stats(path);
    return stats.ctimeMs;
  }

  put(data: Stream | Buffer, path: string): Promise<Partial<PutResult>> {
    ensureDirectoryExistence(this.rootPath(path));
    const writeStream = fs.createWriteStream(this.rootPath(path));

    return new Promise((resolve, reject) => {
      toStream(data)
        .pipe(writeStream)
        .on('finish', () => {
          resolve({
            success: true,
            message: 'Uploading success!',
          });
        })
        .on('error', (error) => {
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
          return reject(err);
        }
        resolve(true);
      });
    });
  }

  copy(path: string, newPath: string): Promise<void> {
    ensureDirectoryExistence(this.rootPath(newPath));

    return new Promise((resolve, reject) => {
      fs.copyFile(this.rootPath(path), this.rootPath(newPath), (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  move(path: string, newPath: string): Promise<void> {
    ensureDirectoryExistence(this.rootPath(newPath));

    return new Promise((resolve, reject) => {
      fs.rename(this.rootPath(path), this.rootPath(newPath), (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  append(data: string | Buffer, path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.appendFile(this.rootPath(path), data, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
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
