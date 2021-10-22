import { Stream } from 'stream';
import sharp from 'sharp';
import { DriverName } from './enums/driver-name.enum';
import { DiskConfig } from './types/disk-config.interface';
import { ImageStats } from './types/image-stats.interface';
import { bytesToKbytes, getExt, getFileName, streamToBuffer } from './utils';
import { PutResult } from './types/put-result.interface';

const request = require('request');

export abstract class Driver {
  name: DriverName | string;

  constructor({ name }: DiskConfig) {
    this.name = name;

    return new Proxy(this, {
      get: (target, prop) => {
        if (typeof target[prop] !== 'function') {
          return target[prop];
        }
        return async (...args: any[]) => {
          try {
            return await target[prop](...args);
          } catch (error) {
            if (!this.errorHandler) {
              throw error;
            }
            this.errorHandler(error);
          }
        };
      },
    });
  }

  init?: () => Promise<void>;

  protected errorHandler?(error: any): void;

  /**
   * Get file information.
   *
   * @param path File path.
   * @throws If file does not exists.
   */
  protected stats?(path: string): Promise<any>;

  /**
   * Get full url of the file
   * @param path string
   */
  abstract url(path: string): string;

  /**
   * Determine if a file exists on the disk
   */
  abstract exists(path: string): Promise<boolean>;

  /**
   * Get size of a file in bytes
   */
  abstract size(path: string): Promise<number>;

  /**
   * This methods returns the UNIX timestamp of the last time the file was modified.
   */
  abstract lastModified(path: string): Promise<number>;

  /**
   * Put to specific disk from a stream or buffer.
   *
   * @param data stream.Stream | Buffer
   * @param path string
   * @throws If file does not exists.
   */
  abstract put(data: Stream | Buffer, path: string): Promise<Partial<PutResult>>;

  /**
   * Get a file.
   * @param path string
   */
  abstract get(path: string): Stream | Promise<Stream>;

  /**
   * Delete a file
   *
   * @param path Path of file.
   * @throws If deleting failed.
   */
  abstract delete(path: string): Promise<any>;

  /**
   * Copy a file to new location.
   *
   * @param path File path.
   * @param newPath New file path.
   * @throws If file does not exists.
   */
  abstract copy(path: string, newPath: string): Promise<void>;

  /**
   * Move a file to new location.
   *
   * @param path File path.
   * @param newPath New file path.
   * @throws If file does not exists.
   */
  abstract move(path: string, newPath: string): Promise<void>;

  /**
   * This method will create the given directory, including any needed subdirectories.
   *
   * @throws If directory already exists.
   */
  abstract makeDir(dir: string): Promise<string>;

  /**
   * Remove given directory and all of its files.
   *
   * @throws If cannot remove.
   */
  abstract removeDir(dir: string): Promise<string>;

  /**
   * Upload image from specific URI and store it into `filename`
   *
   * @param uri URI of image
   * @param path Filename included location to store image.
   * @param ignoreHeaderContentType ignore checking content-type header.
   * @returns Promise<any>
   */
  uploadImageFromExternalUri(
    uri: string,
    path: string,
    ignoreHeaderContentType?: boolean,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      request.head(uri, async (err: any, res: any) => {
        if (err) {
          reject(err);
        }
        if (
          ignoreHeaderContentType ||
          (res && res.headers['content-type'] && res.headers['content-type'].match(/image/))
        ) {
          try {
            const data = await this.put(request(uri), path);
            resolve(data);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('Not an image: ' + uri));
        }
      });
    });
  }

  /**
   * Get image metadatas.
   *
   * @param path Path of image
   * @param keepBuffer Put image buffer in the result.
   */
  imageStats(path: string, keepBuffer: true): Promise<ImageStats & { buffer: Buffer }>;
  imageStats(path: string, keepBuffer?: boolean): Promise<ImageStats>;

  async imageStats(path: string, keepBuffer = false): Promise<ImageStats> {
    const stream = await this.get(path);
    const buffer = await streamToBuffer(stream);
    const { format, size, width, height } = await sharp(buffer).metadata();

    return {
      name: getFileName(path),
      path,
      size: bytesToKbytes(size),
      width,
      height,
      mime: format,
      ext: getExt(path),
      hash: null,
      ...(keepBuffer && { buffer }),
    };
  }
}
