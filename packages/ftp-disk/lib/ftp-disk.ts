import { AccessOptions, Client, FileInfo, FTPResponse } from 'basic-ftp';
import { dirname } from 'path';
import { PassThrough, Readable, Stream } from 'stream';
import { CommonDisk, Disk, Driver, FtpDiskConfig } from '@file-storage/common';

export class FtpDisk extends CommonDisk implements Disk {
  readonly name: string;
  readonly driver: Driver;
  readonly client: Client;

  private accessOptions: AccessOptions;
  private root: string;

  constructor(diskConfig: FtpDiskConfig) {
    super();
    const { name, accessOptions, ftpContext, root = '' } = diskConfig;
    this.name = name;
    this.driver = Driver.FTP;
    this.accessOptions = accessOptions;
    this.root = root;
    this.client = new Client();

    // Ftp context
    if (ftpContext) {
      for (const item in ftpContext) {
        if (Object.prototype.hasOwnProperty.call(ftpContext, item)) {
          this.client.ftp[item] = ftpContext[item];
        }
      }
    }
  }

  private async connectToFTPServer(): Promise<FTPResponse> {
    if (this.client.closed) {
      return await this.client.access(this.accessOptions);
    }
  }

  private async ensureDirectoryExistence(path: string): Promise<void> {
    await this.client.ensureDir(dirname(path));
  }

  private rootPath(path = '') {
    return this.root + '/' + path;
  }

  /**
   * A helper function to call client's specific function which auto connect and auto close connection after response.
   */
  private async clientFunc<U = any>(name: string, ...args: any[]): Promise<U> {
    await this.connectToFTPServer();
    return this.client[name](...args).finally(() => {
      this.client.close();
    });
  }

  url(path: string) {
    return this.root + '/' + path;
  }

  async exists(path: string) {
    try {
      await this.clientFunc('size', this.rootPath(path));
      return true;
    } catch (error) {
      return false;
    }
  }

  size(path: string): Promise<number> {
    return this.clientFunc('size', this.rootPath(path));
  }

  async lastModified(path: string): Promise<number> {
    const date: Date = await this.clientFunc('lastMod', this.rootPath(path));
    return date.getTime();
  }

  async put(stream: Readable, path: string): Promise<FTPResponse> {
    await this.connectToFTPServer();
    await this.ensureDirectoryExistence(this.rootPath(path));

    return this.client.uploadFrom(stream, this.rootPath(path)).finally(() => {
      this.client.close();
    });
  }

  async get(path: string): Promise<Stream> {
    const passThrough = new PassThrough();
    this.clientFunc('downloadTo', passThrough, this.rootPath(path));
    return passThrough;
  }

  list(path?: string): Promise<FileInfo[]> {
    return this.clientFunc('list', this.rootPath(path));
  }

  delete(path: string): Promise<FTPResponse> {
    return this.clientFunc('remove', this.rootPath(path));
  }

  async makeDir(dir: string): Promise<string> {
    try {
      await this.clientFunc('cd', this.rootPath(dir));
      throw new Error('Directory already exists.');
    } catch (e) {
      await this.clientFunc('ensureDir', this.rootPath(dir));
      return dir;
    }
  }

  removeDir(dir: string): Promise<string> {
    return this.clientFunc('removeDir', this.rootPath(dir));
  }
}
