import fs from 'fs';
import Storage from '@file-storage/core';
import {
  DriverName,
  FileNotFoundError,
  getRootCwd,
  UnauthenticatedError,
} from '@file-storage/common';
import { S3Driver } from './s3-driver';

describe('S3 Disk test', () => {
  const bucketName1 = 'mybucket1';
  const bucketName2 = 'mybucket2';

  beforeAll(async () => {
    Storage.config({
      defaultDiskName: 's3Default',
      diskConfigs: [
        {
          driver: DriverName.S3,
          name: 's3Test',
          bucketName: bucketName1,
          endpoint: 'http://localhost:4566',
          s3ForcePathStyle: true,
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
          s3ForcePathStyle: true,
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
          s3ForcePathStyle: true,
        },
      ],
    });

    await Promise.all([
      Storage.disk<S3Driver>('s3Test').setupMockS3(bucketName1),
      Storage.disk<S3Driver>('s3Test').setupMockS3(bucketName2),
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
        'https://4.img-dpreview.com/files/p/E~TS590x0~articles/3925134721/0266554465.jpeg',
        'test_upload/test_image_from_uri.jpeg',
      ),
    ).resolves.toMatchObject({
      Bucket: bucketName1,
      Key: 'test_upload/test_image_from_uri.jpeg',
    });
  });

  test('Upload image to s3 success', () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    return expect(
      Storage.disk('s3Test').put(fileReadStream, 'test_upload/bird2.jpeg'),
    ).resolves.toMatchObject({
      success: true,
      message: 'Uploading success!',
      Bucket: bucketName1,
      Key: 'test_upload/bird2.jpeg',
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
      Key: 'my-photo/photo-1000x750.jpeg',
      formats: {
        thumbnail: {
          name: 'thumbnail_photo-1000x750.jpeg',
          hash: null,
          ext: 'jpeg',
          mime: 'jpeg',
          width: 208,
          height: 156,
          size: 15.9,
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
          size: 105.12,
          path: 'my-photo/medium_photo-1000x750.jpeg',
        },
        small: {
          name: 'small_photo-1000x750.jpeg',
          hash: null,
          ext: 'jpeg',
          mime: 'jpeg',
          width: 500,
          height: 375,
          size: 52.33,
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
      Bucket: bucketName2,
      Key: 'test_upload/bird23.jpeg',
    });
  });

  test('Upload to s3 using Storage facade', () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    return expect(Storage.put(fileReadStream, 'bird.jpeg')).resolves.toMatchObject({
      success: true,
      message: 'Uploading success!',
      Bucket: bucketName2,
      Key: 'bird.jpeg',
    });
  });

  test('Download image from s3', async () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    await Storage.put(fileReadStream, 'test_upload/bird2.jpeg');
    return expect(Storage.get('test_upload/bird2.jpeg')).resolves.toBeTruthy();
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
    const s3Disk = <S3Driver>Storage.disk();
    await s3Disk.setupMockS3('another-bucket');

    return expect(
      s3Disk.put(fileReadStream, 'test_upload/image123.jpeg', {
        Bucket: 'another-bucket',
      }),
    ).resolves.toMatchObject({
      success: true,
      message: 'Uploading success!',
      Key: 'test_upload/image123.jpeg',
      Bucket: 'another-bucket',
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

  test('No credentials error', () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    return expect(
      Storage.disk('s3NoCredentials').put(fileReadStream, 'bird-images/bird.jpeg'),
    ).rejects.toThrowError(UnauthenticatedError);
  }, 10000);
});
