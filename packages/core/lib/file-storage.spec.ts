import fs from 'fs';
import { Storage } from './file-storage';
import { DriverName, getExt, getRootCwd } from '@file-storage/common';

describe('Storage', () => {
  test('Auto set default disk name when there is only one disk-config', () => {
    Storage.config({
      diskConfigs: [
        {
          driver: DriverName.LOCAL,
          name: 'my-local',
        },
      ],
    });

    expect(Storage.name).toEqual('my-local');
  });

  describe('Storage: No config specified.', () => {
    beforeAll(() => {
      Storage.config();
    });

    test('Default disk is local if there is no diskType specific.', () => {
      expect(Storage.name).toEqual('local');
    });

    test('Upload image to local success.', () => {
      const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
      return expect(Storage.put(fileReadStream, 'test_upload/bird.jpeg')).resolves.toMatchObject({
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
        Storage.config({
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
      expect(() =>
        Storage.config({
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
        Storage.config({
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
});
