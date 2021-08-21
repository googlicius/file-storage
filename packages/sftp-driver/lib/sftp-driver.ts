import { Readable, PassThrough } from 'stream';
import { dirname } from 'path';
import { ReadStream } from 'fs';
import Client from 'ssh2-sftp-client';
import {
  AnyObject,
  Driver,
  DriverName,
  FileNotFoundError,
  PutResult,
  SftpDiskConfig,
} from '@file-storage/common';

export class SftpDriver extends Driver {
  static readonly driverName = DriverName.SFTP;
  readonly client: Client;
  private root: string;
  private accessOptions: AnyObject;
  private timeOutToCloseConnection: NodeJS.Timeout;

  constructor(config: SftpDiskConfig) {
    super(config);
    const { root = '', accessOptions } = config;
    this.root = root;
    this.accessOptions = accessOptions;
    this.client = new Client();
  }

  protected errorHandler(error: any) {
    switch (error.code) {
      case 2:
      case 4:
        throw new FileNotFoundError(error.message);

      default:
        throw error;
    }
  }

  private connectToSftpServer(): Promise<any> {
    clearTimeout(this.timeOutToCloseConnection);
    if (!this.client.sftp) {
      return this.client.connect(this.accessOptions);
    }
  }

  /**
   * Close connection after 0.5s, if there is another request, this timeout will be cleared,
   * and the connection will be keep open.
   */
  private closeConnection() {
    this.timeOutToCloseConnection = setTimeout(() => {
      if (this.client.sftp) {
        this.client.end();
      }
    }, 500);
  }

  private rootPath(path: string): string {
    return this.root + '/' + path;
  }

  private async ensureDirectoryExistence(path: string): Promise<void> {
    const dir = dirname(path);
    const data = await this.client.exists(dir);

    if (!data) {
      await this.client.mkdir(dir, true);
    }
  }

  /**
   * A helper function to call client's specific function which auto connect and auto close connection after response.
   */
  private async clientFunc(name: string, ...args: any[]): Promise<any> {
    await this.connectToSftpServer();
    return this.client[name](...args).finally(() => {
      this.closeConnection();
    });
  }

  url(path: string): string {
    return this.root + '/' + path;
  }

  async exists(path: string): Promise<boolean> {
    const data = await this.clientFunc('exists', this.rootPath(path));
    return !!data;
  }

  async size(path: string): Promise<number> {
    const data = await this.clientFunc('stat', this.rootPath(path));
    return data.size;
  }

  async lastModified(path: string): Promise<number> {
    const data = await this.clientFunc('stat', this.rootPath(path));
    return data.modifyTime;
  }

  async put(src: Readable, path: string): Promise<PutResult> {
    await this.connectToSftpServer();
    await this.ensureDirectoryExistence(this.rootPath(path));

    return this.client
      .put(src, this.rootPath(path))
      .then(() => ({
        success: true,
        message: 'Uploading success!',
      }))
      .finally(() => {
        this.closeConnection();
      });
  }

  get(path: string): Promise<ReadStream> {
    const passThrough = new PassThrough();
    return this.clientFunc('get', this.rootPath(path), passThrough);
  }

  list(path: string): Promise<any> {
    return this.clientFunc('list', this.rootPath(path));
  }

  delete(path: string): Promise<boolean> {
    return this.clientFunc('delete', this.rootPath(path));
  }

  makeDir(dir: string): Promise<string> {
    return this.clientFunc('mkdir', dir, true);
  }

  removeDir(dir: string): Promise<string> {
    return this.clientFunc('rmdir', this.rootPath(dir));
  }
}
