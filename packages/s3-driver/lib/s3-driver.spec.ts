import fs from 'fs';
import { Readable } from 'stream';
import Storage from '@file-storage/core';
import {
  DriverName,
  FileNotFoundError,
  getRootCwd,
  S3DiskConfig,
  UnauthenticatedError,
} from '@file-storage/common';
import ImageManipulation from '@file-storage/image-manipulation';
import { S3Driver } from './s3-driver';

describe('S3 Disk test', () => {
  const bucketName1 = 'mybucket1';
  const bucketName2 = 'mybucket2';

  beforeAll(async () => {
    Storage.config<S3DiskConfig>({
      defaultDiskName: 's3Default',
      diskConfigs: [
        {
          driver: DriverName.S3,
          name: 's3Test',
          bucketName: bucketName1,
          endpoint: 'http://localhost:4566',
          forcePathStyle: true,
          region: 'ap-southeast-1',
          credentials: {
            accessKeyId: '123abc',
            secretAccessKey: '123abc',
          },
        },
        {
          driver: DriverName.S3,
          name: 's3Default',
          bucketName: bucketName2,
          endpoint: 'http://localhost:4566',
          forcePathStyle: true,
          region: 'us-east-1',
          credentials: {
            accessKeyId: 'test',
            secretAccessKey: 'test123',
          },
        },
        {
          driver: DriverName.S3,
          name: 's3NoCredentials',
          bucketName: bucketName2,
          endpoint: 'http://localhost:4566',
          region: 'us-east-1',
          forcePathStyle: true,
        },
      ],
      plugins: [ImageManipulation],
    });

    await Promise.all([
      Storage.disk('s3Test').instance<S3Driver>().setupMockS3(bucketName1),
      Storage.disk('s3Test').instance<S3Driver>().setupMockS3(bucketName2),
    ]);
  });

  test('Default disk is s3Default', () => {
    expect(Storage.name).toEqual('s3Default');
  });

  test('Disk name is s3Test', () => {
    expect(Storage.disk('s3Test').name).toEqual('s3Test');
  });

  // test('Default disk does not have any bucket', async () => {
  //   const bucketListResult = await (Storage as S3Driver).s3Instance
  //     .listBuckets()
  //     .promise();

  //   expect(bucketListResult.Buckets.length).toEqual(0);
  // });

  test('Upload image from URI to S3', () => {
    return expect(
      Storage.disk('s3Test').uploadImageFromExternalUri(
        'https://raw.githubusercontent.com/googlicius/file-storage/main/test/support/images/bird.jpeg',
        'test_upload/test_image_from_uri.jpeg',
      ),
    ).resolves.toMatchObject({
      success: true,
      message: 'Uploading success!',
    });
  });

  test('should upload image to s3 success', () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    return expect(
      Storage.disk('s3Test').put(fileReadStream, 'test_upload/bird2.jpeg'),
    ).resolves.toMatchObject({
      success: true,
      message: 'Uploading success!',
    });
  });

  test('Upload s3 large image will uploaded to many formats', () => {
    const imageFileStream = fs.createReadStream(
      getRootCwd() + '/test/support/images/photo-1000x750.jpeg',
    );
    return expect(
      Storage.put(imageFileStream, 'my-photo/photo-1000x750.jpeg'),
    ).resolves.toMatchObject({
      success: true,
      message: 'Uploading success!',
      formats: {
        thumbnail: {
          name: 'thumbnail_photo-1000x750.jpeg',
          hash: null,
          ext: 'jpeg',
          mime: 'jpeg',
          width: 208,
          height: 156,
          size: 16.14,
          path: 'my-photo/thumbnail_photo-1000x750.jpeg',
        },
        large: {
          name: 'large_photo-1000x750.jpeg',
          hash: null,
          ext: 'jpeg',
          mime: 'jpeg',
          width: 1000,
          height: 750,
          size: 184.49,
          path: 'my-photo/large_photo-1000x750.jpeg',
        },
        medium: {
          name: 'medium_photo-1000x750.jpeg',
          hash: null,
          ext: 'jpeg',
          mime: 'jpeg',
          width: 750,
          height: 562,
          size: 107.23,
          path: 'my-photo/medium_photo-1000x750.jpeg',
        },
        small: {
          name: 'small_photo-1000x750.jpeg',
          hash: null,
          ext: 'jpeg',
          mime: 'jpeg',
          width: 500,
          height: 375,
          size: 52.4,
          path: 'my-photo/small_photo-1000x750.jpeg',
        },
      },
    });
  });

  test('Upload image to s3 success (Using default disk)', () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    return expect(Storage.put(fileReadStream, 'test_upload/bird23.jpeg')).resolves.toMatchObject({
      success: true,
      message: 'Uploading success!',
    });
  });

  test('Upload to s3 using Storage facade', () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    return expect(Storage.put(fileReadStream, 'bird.jpeg')).resolves.toMatchObject({
      success: true,
      message: 'Uploading success!',
    });
  });

  test('Download image from s3', async () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    await Storage.put(fileReadStream, 'test_upload/bird2.jpeg');
    const stream = await Storage.get('test_upload/bird2.jpeg');
    expect(stream instanceof Readable).toBe(true);
  });

  test('Download not exists image from s3 error', async () => {
    return expect(Storage.disk('s3Test').get('not-exists.jpeg')).rejects.toThrowError(
      FileNotFoundError,
    );
  });

  test('Delete image from s3 bucket (Using default disk)', async () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    const filePath = 'test_upload/image123.jpeg';
    await Storage.put(fileReadStream, filePath);

    return expect(Storage.delete(filePath)).resolves.toBeTruthy();
  });

  test('Upload to another bucket', async () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    const s3Disk = Storage.instance<S3Driver>();
    await s3Disk.setupMockS3('another-bucket');

    return expect(
      s3Disk.put(fileReadStream, 'test_upload/image123.jpeg', {
        Bucket: 'another-bucket',
      }),
    ).resolves.toMatchObject({
      success: true,
      message: 'Uploading success!',
    });
  });

  test('File is exists', async () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    await Storage.disk('s3Default').put(fileReadStream, 'bird-images/bird.jpeg');

    return expect(Storage.exists('bird-images/bird.jpeg')).resolves.toEqual(true);
  });

  test('File is not exists', async () => {
    const exist = await Storage.disk('s3Test').exists('not-exists.jpeg');
    const exist2 = await Storage.exists('not-exists.jpeg');
    expect(exist).toEqual(false);
    expect(exist2).toEqual(false);
  });

  test('Get file size', async () => {
    const fileReadStream2 = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    await Storage.disk('s3Default').put(fileReadStream2, 'bird-images/bird-size.jpeg');

    return expect(Storage.size('bird-images/bird-size.jpeg')).resolves.toEqual(56199);
  });

  test('Last modified', async () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    await Storage.disk('s3Default').put(fileReadStream, 'bird-images/bird.jpeg');
    const lastMod = await Storage.lastModified('bird-images/bird.jpeg');
    const lastMod2 = await Storage.lastModified('bird-images/bird.jpeg');
    expect(typeof lastMod).toBe('number');
    expect(typeof lastMod2).toBe('number');
  });

  test('Copy file', async () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    const putResult = await Storage.put(fileReadStream, 'bird-images/bird.jpeg');
    await Storage.copy(putResult.path, 'photos/bird-copy.jpeg');

    const size = await Storage.size('photos/bird-copy.jpeg');
    expect(typeof size).toBe('number');
  });

  test('Move file', async () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    const putResult = await Storage.put(fileReadStream, 'bird-images/bird.jpeg');
    await Storage.move(putResult.path, 'photos/new-path.jpeg');

    const size = await Storage.size('photos/new-path.jpeg');
    expect(typeof size).toBe('number');

    return expect(Storage.size('bird-images/bird.jpeg')).rejects.toThrowError(FileNotFoundError);
  });

  test.skip('No credentials error', () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    return expect(
      Storage.disk('s3NoCredentials').put(fileReadStream, 'bird-images/bird.jpeg'),
    ).rejects.toThrowError(UnauthenticatedError);
  }, 10000);
});
