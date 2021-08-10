import { Readable, PassThrough } from 'stream';
import { dirname } from 'path';
import { ReadStream } from 'fs';
import Client from 'ssh2-sftp-client';
import { AnyObject, Disk, Driver, SftpDiskConfig } from '@file-storage/common';

export class SftpDisk implements Disk {
  readonly name: string;
  readonly driver: Driver;
  readonly client: Client;
  private root: string;
  private accessOptions: AnyObject;

  constructor({ name, root = '', accessOptions }: SftpDiskConfig) {
    this.name = name;
    this.driver = Driver.SFTP;
    this.root = root;
    this.accessOptions = accessOptions;
    this.client = new Client();
  }

  private connectToSftpServer(): Promise<any> {
    return this.client.connect(this.accessOptions);
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
      this.client.end();
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

  async put(src: Readable, path: string) {
    await this.connectToSftpServer();
    await this.ensureDirectoryExistence(this.rootPath(path));

    return this.client.put(src, this.rootPath(path)).finally(() => {
      this.client.end();
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
