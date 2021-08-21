import { Stream } from 'stream';
import { Driver } from './driver.class';

export abstract class Plugin {
  disk: Driver;

  beforePutKey?: string;
  afterPutKey?: string;

  init(disk: Driver) {
    this.disk = disk;
  }

  /**
   * Hook runs before put.
   */
  beforePut?(stream: Stream | Buffer, path: string): Promise<any>;

  /**
   * Hook runs after put.
   */
  afterPut?(path: string): Promise<any>;
}
