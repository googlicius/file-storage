import { Stream } from 'stream';
import { Driver } from '../enums/driver.enum';

export interface Disk {
  name: string;
  driver: Driver;

  init?: () => Promise<void>;

  /**
   * Get full url of the file
   * @param path string
   */
  url(path: string): string;

  /**
   * Determine if a file exists on the disk
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get size of a file in bytes
   */
  size(path: string): Promise<number>;

  /**
   * This methods returns the UNIX timestamp of the last time the file was modified.
   */
  lastModified(path: string): Promise<number>;

  /**
   * Put to specific disk from a stream or buffer.
   *
   * @param stream stream.Stream
   * @param path string
   * @throws If file doesn't exists.
   */
  put(stream: Stream, path: string): Promise<any>;

  /**
   * Get a file.
   * @param path string
   */
  get(path: string): Stream | Promise<Stream>;

  /**
   * Delete a file
   *
   * @param path Path of file.
   * @throws If deleting failed.
   */
  delete(path: string): Promise<any>;

  /**
   * Upload image from specific URI and store it into `filename`
   *
   * @param uri URI of image
   * @param path Filename included location to store image.
   * @param ignoreHeaderContentType ignore checking content-type header.
   * @returns Promise<any>
   */
  uploadImageFromExternalUri?: (
    uri: string,
    path: string,
    ignoreHeaderContentType?: boolean,
  ) => Promise<any>;

  /**
   * This method will create the given directory, including any needed subdirectories.
   *
   * @throws If directory already exists.
   */
  makeDir(dir: string): Promise<string>;

  /**
   * Remove given directory and all of its files.
   *
   * @throws If cannot remove.
   */
  removeDir(dir: string): Promise<string>;
}
