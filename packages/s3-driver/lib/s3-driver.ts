import {
  S3,
  HeadObjectCommandInput,
  PutObjectCommandInput,
  GetObjectCommandInput,
  CopyObjectCommandInput,
  DeleteObjectCommandInput,
  Bucket,
  CreateBucketCommandOutput,
  NoSuchKey,
  NotFound,
} from '@aws-sdk/client-s3';
import { CredentialsProviderError } from '@aws-sdk/property-provider';
import { Upload } from '@aws-sdk/lib-storage';
import { PassThrough, Stream, Readable } from 'stream';
import {
  Driver,
  DriverName,
  FileNotFoundError,
  PutResult,
  S3DiskConfig,
  toStream,
  UnauthenticatedError,
} from '@file-storage/common';

export class S3Driver extends Driver {
  private bucketName: string;
  private publicUrl?: string;
  readonly s3Instance: S3;
  static readonly driverName = DriverName.S3;

  constructor(config: S3DiskConfig) {
    super(config);
    const { bucketName, publicUrl, ...clientConfig } = config;
    if (!bucketName) {
      throw new Error('Bucket name is required');
    }
    this.bucketName = bucketName;
    this.publicUrl = publicUrl;
    this.s3Instance = new S3(clientConfig);
  }

  protected errorHandler(error: any) {
    if (error instanceof NoSuchKey || error instanceof NotFound) {
      throw new FileNotFoundError(error.message);
    }

    if (error instanceof CredentialsProviderError) {
      throw new UnauthenticatedError(error.message);
    }

    throw error;
  }

  protected async stats(path: string) {
    const getObjectParams: HeadObjectCommandInput = {
      Key: path,
      Bucket: this.bucketName,
    };
    return this.s3Instance.headObject(getObjectParams);
  }

  url(path: string): string {
    return this.publicUrl
      ? `${this.publicUrl}/${path}`
      : `https://${this.bucketName}.s3.amazonaws.com/${path}`;
  }

  exists(path: string) {
    return this.stats(path).then(
      () => true,
      () => false,
    );
  }

  async size(path: string): Promise<number> {
    const data = await this.stats(path);
    return data.ContentLength;
  }

  async lastModified(path: string): Promise<number> {
    const data = await this.stats(path);
    return data.LastModified.getTime();
  }

  /**
   * Upload to S3.
   */
  put(
    data: Stream | PassThrough | Buffer,
    Key: string,
    params?: Partial<PutResult & PutObjectCommandInput>,
  ) {
    const upload = new Upload({
      client: this.s3Instance,
      params: {
        Bucket: this.bucketName,
        Key,
        Body: toStream(data),
        ACL: 'public-read',
        ...(typeof params !== 'undefined' && params),
      },
    });

    return upload.done().then((result) => ({
      success: true,
      message: 'Uploading success!',
      ...result,
    }));
  }

  /**
   * Get a file from s3 bucket.
   */
  async get(Key: string): Promise<Readable> {
    const getObjectParams: GetObjectCommandInput = {
      Key,
      Bucket: this.bucketName,
    };

    const resonpse = await this.s3Instance.getObject(getObjectParams);

    if (resonpse.Body instanceof Readable) {
      return resonpse.Body;
    }

    throw new Error('Unknown object stream type.');
  }

  async copy(path: string, newPath: string): Promise<void> {
    const copyObjectParams: CopyObjectCommandInput = {
      CopySource: this.bucketName + '/' + path,
      Key: newPath,
      Bucket: this.bucketName,
    };

    await this.s3Instance.copyObject(copyObjectParams);
  }

  /**
   * Delete a file from s3 bucket.
   */
  delete(Key: string): Promise<boolean> {
    const deleteParams: DeleteObjectCommandInput = {
      Bucket: this.bucketName,
      Key,
    };
    return this.s3Instance.deleteObject(deleteParams).then(() => true);
  }

  async move(path: string, newPath: string): Promise<void> {
    await this.copy(path, newPath);
    await this.delete(path);
  }

  /**
   * Create bucket for testing purpose.
   */
  async setupMockS3(Bucket: string): Promise<Bucket | Promise<CreateBucketCommandOutput>> {
    // TODO Uncomment this; Temporary comment because endpoint is not exists in aws-sdk v3.
    // if (this.s3Instance.endpoint.href !== 'http://localhost:4566/') {
    //   throw new Error('Supported only for testing');
    // }

    const listBucketsResult = await this.s3Instance.listBuckets({});
    const existingBucket = listBucketsResult.Buckets.find((bucket) => bucket.Name === Bucket);

    if (existingBucket) {
      return existingBucket;
    }

    return this.s3Instance.createBucket({
      Bucket,
    });
  }

  makeDir(dir: string): Promise<string> {
    const putParams: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: dir.replace(/\/$|$/, '/'),
    };

    return this.s3Instance.putObject(putParams).then(() => dir);
  }

  async removeDir(dir: string): Promise<string> {
    const deleteParams: DeleteObjectCommandInput = {
      Bucket: this.bucketName,
      Key: dir.replace(/\/$|$/, '/'),
    };

    await this.s3Instance.deleteObject(deleteParams);

    return dir;
  }
}
