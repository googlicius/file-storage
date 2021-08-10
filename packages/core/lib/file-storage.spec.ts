import fs from 'fs';
import { Storage } from './file-storage';
import { Driver, getRootCwd } from '@file-storage/common';

describe('Storage: No config specified.', () => {
  beforeAll(() => {
    Storage.config();
  });

  const fileReadStream = fs.createReadStream(
    getRootCwd() + '/test/support/images/0266554465-1528092757338.jpeg',
  );

  test('Default disk is local if there is no diskType specific.', () => {
    expect(Storage.defaultDisk.name).toEqual('local');
  });

  test('Upload image to local success.', () => {
    return expect(
      Storage.defaultDisk.put(fileReadStream, 'test_upload/bird.jpeg'),
    ).resolves.toEqual('Uploading success!');
  });
});

describe('Storage: config errors.', () => {
  test('Not allows more than one default disk.', () => {
    expect(() =>
      Storage.config({
        diskConfigs: [
          {
            driver: Driver.LOCAL,
            name: 'local',
            root: 'storage',
            isDefault: true,
          },
          {
            driver: Driver.S3,
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
            driver: Driver.LOCAL,
            name: 'myDisk',
            root: 'storage',
            isDefault: true,
          },
          {
            driver: Driver.S3,
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

describe('Storage initialize', () => {
  test('Error when trying initialize storage class', () => {
    const t = () => {
      new Storage();
    };

    expect(t).toThrowError();
  });
});
