import fs from 'fs';
import { Storage, StorageClass } from './file-storage';
import { DriverName, getExt, getRootCwd, LocalDiskConfig } from '@file-storage/common';
import S3Driver, { S3DiskConfig } from '@file-storage/s3';
import { BuiltInDiskConfig } from './types';

describe('Storage', () => {
  test('Auto set default disk name when there is only one disk-config', () => {
    const TestStorage = new StorageClass();

    TestStorage.config<LocalDiskConfig>({
      diskConfigs: [
        {
          driver: DriverName.LOCAL,
          name: 'my-local',
        },
      ],
    });

    expect(TestStorage.name).toEqual('my-local');
  });

  describe('Storage: No config specified.', () => {
    let TestStorage: StorageClass;

    beforeAll(() => {
      TestStorage = new StorageClass();
    });

    test('Default disk is local if there is no diskType specific.', () => {
      expect(TestStorage.name).toEqual('local');
    });

    test('Upload image to local success.', () => {
      const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
      return expect(
        TestStorage.put(fileReadStream, 'test_upload/bird.jpeg'),
      ).resolves.toMatchObject({
        success: true,
        message: 'Uploading success!',
      });
    });
  });

  describe('Storage as a disk', () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');

    test('Upload image to local disk', async () => {
      const result = await Storage.put(fileReadStream, 'test_upload/bird.jpeg');
      expect(result).toMatchObject({
        success: true,
        message: 'Uploading success!',
        path: 'test_upload/bird.jpeg',
        name: 'bird.jpeg',
      });
    });
  });

  describe('Unique file name', () => {
    beforeAll(() => {
      Storage.config({
        uniqueFileName: true,
      });
    });

    test('Put unique file name', async () => {
      const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
      const result = await Storage.put(fileReadStream, 'bird-image/bird.jpeg');
      expect(getExt(result.path)).toEqual('jpeg');
      expect(result.path).not.toEqual('bird-image/bird.jpeg');
      expect(result).toMatchObject({
        success: true,
        message: 'Uploading success!',
      });
    });
  });

  describe('Storage: config errors.', () => {
    test('Duplicated disk name.', () => {
      expect(() =>
        Storage.config<BuiltInDiskConfig>({
          defaultDiskName: 'myDisk',
          diskConfigs: [
            {
              driver: DriverName.LOCAL,
              name: 'myDisk',
              root: 'storage',
            },
            {
              driver: DriverName.S3,
              name: 'myDisk',
              bucketName: 'startover',
            },
          ],
        }),
      ).toThrowError('Duplicated disk name.');
    });

    test('Please specify a default disk name.', () => {
      const MyStorage = new StorageClass();

      expect(() =>
        MyStorage.config<BuiltInDiskConfig>({
          diskConfigs: [
            {
              driver: DriverName.LOCAL,
              name: 'myDisk',
              root: 'storage',
            },
            {
              driver: DriverName.S3,
              name: 's3',
              bucketName: 'startover',
            },
          ],
        }),
      ).toThrowError('Please specify a default disk name.');
    });

    test('Driver is not declared', () => {
      expect(() => {
        Storage.config({
          defaultDiskName: 'not-exists-disk',
          diskConfigs: [
            {
              driver: 'onedriver',
              name: 'not-exists-disk',
            },
          ],
        });
        Storage.disk('not-exists-disk');
      }).toThrowError(`Driver 'onedriver' is not declared.`);
    });

    test('Given disk is not defined', () => {
      expect(() => {
        Storage.config<BuiltInDiskConfig>({
          defaultDiskName: 'myDisk2',
          diskConfigs: [
            {
              driver: DriverName.LOCAL,
              name: 'myDisk',
              root: 'storage',
            },
          ],
        });
        Storage.disk('not-exists-disk');
      }).toThrowError('Given disk is not defined: myDisk2');
    });

    // TODO Able to test this case.
    // test('Driver is not installed', () => {
    //   expect(() => {
    //     Storage.config({
    //       diskConfigs: [
    //         {
    //           driver: Driver.S3,
    //           name: 'mys3',
    //           bucketName: 'myBucket',
    //         },
    //       ],
    //     });
    //   }).toThrowError('Please install `@file-storage/s3` for s3 driver');
    // });
  });

  describe('disk', () => {
    let NewStorage: StorageClass;

    beforeAll(async () => {
      NewStorage = new StorageClass();

      NewStorage.config({
        defaultDiskName: 'local',
        uniqueFileName: true,
        diskConfigs: [
          {
            driver: DriverName.LOCAL,
            name: 'local',
            root: 'storage',
          },
          {
            driver: S3Driver,
            name: 's3',
            bucketName: 'mybucket1',
            endpoint: 'http://localhost:4566',
            forcePathStyle: true,
            region: 'us-east-1',
            credentials: {
              accessKeyId: 'test',
              secretAccessKey: 'test123',
            },
          } as S3DiskConfig,
        ],
      });

      await NewStorage.disk('s3').instance<S3Driver>().setupMockS3('mybucket1');
    });

    it('should return storage of another disk', () => {
      expect(NewStorage.disk('s3').name).toEqual('s3');
    });

    it('should return current disk', () => {
      expect(NewStorage.disk({}).name).toEqual('local');
    });

    it('should respect uniqueFileName when changing to another disk', async () => {
      const result = await NewStorage.disk('s3').put(Buffer.from('Test text'), 'test.txt');

      expect(result.path.length).toEqual(36 + '.txt'.length);
    });

    it('should not mutate uniqueFileName of Storage facade', async () => {
      const s3Result = await NewStorage.disk('s3', {
        uniqueFileName: false,
      }).put(Buffer.from('Test text'), 'test.txt');

      const localResult = await NewStorage.put(Buffer.from('Test text'), 'test.txt');

      expect(s3Result.path).toEqual('test.txt');
      expect(localResult.path);
    });
  });
});
