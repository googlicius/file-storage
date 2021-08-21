import fs from 'fs';
import { Storage } from './file-storage';
import { DriverName, getRootCwd } from '@file-storage/common';

describe('Storage test', () => {
  describe('Storage: No config specified.', () => {
    beforeAll(() => {
      Storage.config();
    });

    test('Default disk is local if there is no diskType specific.', () => {
      expect(Storage.defaultDisk.name).toEqual('local');
    });

    test('Upload image to local success.', () => {
      const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
      return expect(
        Storage.defaultDisk.put(fileReadStream, 'test_upload/bird.jpeg'),
      ).resolves.toMatchObject({
        success: true,
        message: 'Uploading success!',
      });
    });
  });

  describe('Storage as a disk test', () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');

    test('Upload image to local disk', async () => {
      const result = await Storage.put(fileReadStream, 'test_upload/bird.jpeg');
      expect(result).toMatchObject({
        success: true,
        message: 'Uploading success!',
      });
    });
  });

  describe('Storage: config errors.', () => {
    test('Not allows more than one default disk.', () => {
      expect(() =>
        Storage.config({
          diskConfigs: [
            {
              driver: DriverName.LOCAL,
              name: 'local',
              root: 'storage',
              isDefault: true,
            },
            {
              driver: DriverName.S3,
              name: 's3Default',
              bucketName: 'startover',
              isDefault: true,
            },
          ],
        }),
      ).toThrowError('Not allows more than one default disk.');
    });

    test('Duplicated disk name.', () => {
      expect(() =>
        Storage.config({
          diskConfigs: [
            {
              driver: DriverName.LOCAL,
              name: 'myDisk',
              root: 'storage',
              isDefault: true,
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

    test('Driver is not declared', () => {
      expect(() => {
        Storage.config({
          diskConfigs: [
            {
              driver: 'onedriver',
              name: 'not-exists-disk',
              isDefault: true,
            },
          ],
        });
        Storage.disk('not-exists-disk');
      }).toThrowError(`Driver 'onedriver' is not declared.`);
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
