import { Stream } from 'stream';
import { Storage, File } from '@google-cloud/storage';
import {
  Driver,
  DriverName,
  FileNotFoundError,
  GCSDiskConfig,
  PutResult,
  toStream,
  UnauthenticatedError,
} from '@file-storage/common';

export class GoogleCloudStorageDriver extends Driver {
  private bucketName: string;
  private publicUrl?: string;
  readonly client: Storage;
  static readonly driverName = DriverName.GCS;

  constructor(config: GCSDiskConfig) {
    super(config);
    const { bucketName, publicUrl, ...options } = config;

    if (!bucketName) {
      throw new Error('Bucket name is required');
    }

    this.bucketName = bucketName;
    this.publicUrl = publicUrl;
    this.client = new Storage(options);
  }

  protected errorHandler(error: any) {
    switch (error.code) {
      case 401:
        throw new UnauthenticatedError(error.message);

      case 404:
        throw new FileNotFoundError(error.message);

      default:
        throw error;
    }
  }

  /**
   * Create a reference to a file object.
   *
   * @inheritdoc
   * @param path Path of file.
   */
  private file(path: string): File {
    return this.client.bucket(this.bucketName).file(path);
  }

  url(path: string): string {
    return this.publicUrl
      ? `${this.publicUrl}/${path}`
      : `https://storage.googleapis.com/${this.bucketName}/${path}`;
  }

  /**
   * List of file metadata.
   *
   * `Bucket: ${metadata.bucket}`
   * `CacheControl: ${metadata.cacheControl}`
   * `ComponentCount: ${metadata.componentCount}`
   * `ContentDisposition: ${metadata.contentDisposition}`
   * `ContentEncoding: ${metadata.contentEncoding}`
   * `ContentLanguage: ${metadata.contentLanguage}`
   * `ContentType: ${metadata.contentType}`
   * `CustomTime: ${metadata.customTime}`
   * `Crc32c: ${metadata.crc32c}`
   * `ETag: ${metadata.etag}`
   * `Generation: ${metadata.generation}`
   * `Id: ${metadata.id}`
   * `KmsKeyName: ${metadata.kmsKeyName}`
   * `Md5Hash: ${metadata.md5Hash}`
   * `MediaLink: ${metadata.mediaLink}`
   * `Metageneration: ${metadata.metageneration}`
   * `Name: ${metadata.name}`
   * `Size: ${metadata.size}`
   * `StorageClass: ${metadata.storageClass}`
   * `TimeCreated: ${new Date(metadata.timeCreated)}`
   * `Last Metadata Update: ${new Date(metadata.updated)}`
   * `temporaryHold: ${metadata.temporaryHold ? 'enabled' : 'disabled'}`
   * `eventBasedHold: ${metadata.eventBasedHold ? 'enabled' : 'disabled'}`
   */
  protected stats(path: string) {
    return this.file(path)
      .getMetadata()
      .then((data) => data[0]);
  }

  async size(path: string): Promise<number> {
    const metadata = await this.stats(path);
    return +metadata.size;
  }

  async lastModified(path: string): Promise<number> {
    const metadata = await this.stats(path);
    return +metadata.updated;
  }

  exists(path: string): Promise<boolean> {
    return this.file(path)
      .exists()
      .then((data) => data[0]);
  }

  async get(path: string): Promise<Stream> {
    await this.stats(path);
    return this.file(path).createReadStream();
  }

  put(data: Stream | Buffer, path: string): Promise<Partial<PutResult>> {
    return new Promise((resolve, reject) => {
      toStream(data)
        .pipe(this.file(path).createWriteStream())
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

  delete(path: string): Promise<boolean> {
    return this.file(path)
      .delete()
      .then(() => true);
  }

  async copy(path: string, newPath: string): Promise<void> {
    await this.file(path).copy(this.file(newPath));
  }

  async move(path: string, newPath: string): Promise<void> {
    await this.file(path).move(newPath);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async append(data: string | Buffer, path: string): Promise<void> {
    return new Promise((_, reject) =>
      reject('Appending to a file currently not supported with Google Cloud Storage.'),
    );
  }

  makeDir(dir: string): Promise<string> {
    return this.client
      .bucket(this.bucketName)
      .create(dir)
      .then(() => dir);
  }

  removeDir(dir: string): Promise<string> {
    return this.client
      .bucket(this.bucketName)
      .deleteFiles({
        prefix: dir,
      })
      .then(() => dir);
  }

  /**
   * Create a bucket.
   *
   * @param name
   */
  createBucket(name: string) {
    return this.client.bucket(name).create();
  }
}
