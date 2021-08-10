import fs from 'fs';
import Storage from '@file-storage/core';
import { Driver, getRootCwd } from '@file-storage/common';
import { S3Disk } from './s3-disk';

describe('S3 Disk test', () => {
  const bucketName1 = 'mybucket1';
  const bucketName2 = 'mybucket2';

  beforeAll(async () => {
    Storage.config({
      diskConfigs: [
        {
          driver: Driver.S3,
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
          driver: Driver.S3,
          name: 's3Default',
          bucketName: bucketName2,
          isDefault: true,
          endpoint: 'http://localhost:4566',
          s3ForcePathStyle: true,
          region: 'us-east-1',
          credentials: {
            accessKeyId: 'test',
            secretAccessKey: 'test123',
          },
        },
      ],
    });

    await Promise.all([
      Storage.disk<S3Disk>('s3Test').setupMockS3(bucketName1),
      Storage.disk<S3Disk>('s3Test').setupMockS3(bucketName2),
    ]);
  });

  const fileReadStream = fs.createReadStream(
    getRootCwd() + '/test/support/images/0266554465-1528092757338.jpeg',
  );

  test('Default disk is s3Default', () => {
    expect(Storage.defaultDisk.name).toEqual('s3Default');
  });

  test('Disk name is s3Test', () => {
    expect(Storage.disk('s3Test').name).toEqual('s3Test');
  });

  // test('Default disk does not have any bucket', async () => {
  //   const bucketListResult = await (Storage.defaultDisk as S3Disk).s3Instance
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
    return expect(
      Storage.disk('s3Test').put(fileReadStream, 'test_upload/bird2.jpeg'),
    ).resolves.toMatchObject({
      Bucket: bucketName1,
      Key: 'test_upload/bird2.jpeg',
    });
  });

  test('Upload image to s3 success (Using default disk)', () => {
    return expect(
      Storage.defaultDisk.put(fileReadStream, 'test_upload/bird2.jpeg'),
    ).resolves.toMatchObject({
      Bucket: bucketName2,
      Key: 'test_upload/bird2.jpeg',
    });
  });

  test('Download image from s3', async () => {
    await Storage.defaultDisk.put(fileReadStream, 'test_upload/bird2.jpeg');
    return expect(Storage.defaultDisk.get('test_upload/bird2.jpeg')).resolves.toBeTruthy();
  });

  test('Download not exists image from s3 error', async () => {
    return expect(Storage.disk('s3Test').get('not-exists.jpeg')).rejects.toMatchObject({
      code: 'NotFound',
      statusCode: 404,
    });
  });

  test('Delete image from s3 bucket (Using default disk)', async () => {
    const filePath = 'test_upload/image123.jpeg';
    await Storage.defaultDisk.put(fileReadStream, filePath);

    return expect(Storage.defaultDisk.delete(filePath)).resolves.toBeTruthy();
  });

  test('Upload to another bucket', async () => {
    const s3Disk = <S3Disk>Storage.defaultDisk;
    await s3Disk.setupMockS3('another-bucket');

    return expect(
      s3Disk.put(fileReadStream, 'test_upload/image123.jpeg', {
        Bucket: 'another-bucket',
      }),
    ).resolves.toMatchObject({
      Key: 'test_upload/image123.jpeg',
      Bucket: 'another-bucket',
    });
  });

  test('File is exists', async () => {
    await Storage.disk('s3Default').put(fileReadStream, 'bird-images/bird.jpeg');

    return expect(Storage.defaultDisk.exists('bird-images/bird.jpeg')).resolves.toEqual(true);
  });

  test('File is not exists', async () => {
    return expect(Storage.disk('s3Test').exists('not-exists.jpeg')).resolves.toEqual(false);
  });

  test('Get file size', async () => {
    const fileReadStream2 = fs.createReadStream(
      getRootCwd() + '/test/support/images/0266554465-1528092757338.jpeg',
    );
    await Storage.disk('s3Default').put(fileReadStream2, 'bird-images/bird-size.jpeg');

    return expect(Storage.defaultDisk.size('bird-images/bird-size.jpeg')).resolves.toEqual(56199);
  });

  test('Last modified', async () => {
    await Storage.disk('s3Default').put(fileReadStream, 'bird-images/bird.jpeg');
    const lastMod = await Storage.defaultDisk.lastModified('bird-images/bird.jpeg');
    expect(typeof lastMod).toBe('number');
  });
});
