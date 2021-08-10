import fs, { ReadStream } from 'fs';
import { dirname } from 'path';
import { Stream } from 'stream';
import {
  CommonDisk,
  Disk,
  Driver,
  ensureDirectoryExistence,
  exists,
  LocalDiskConfig,
  toStream,
} from '@file-storage/common';

export class LocalDisk extends CommonDisk implements Disk {
  private root: string;
  readonly name: string;
  readonly driver: Driver;

  constructor({ name, root = '' }: LocalDiskConfig) {
    super();
    this.root = root;
    this.name = name;
    this.driver = Driver.LOCAL;
  }

  private rootPath(path: string): string {
    return this.root + '/' + path;
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

  put(data: Stream | Buffer, path: string) {
    ensureDirectoryExistence(this.rootPath(path));
    const writeStream = fs.createWriteStream(this.rootPath(path));

    toStream(data).pipe(writeStream);

    return new Promise<string>((resole, reject) => {
      writeStream.on('close', () => {
        resole('Uploading success!');
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
