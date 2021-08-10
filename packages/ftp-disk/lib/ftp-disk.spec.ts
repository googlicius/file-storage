import fs from 'fs';
import Storage from '@file-storage/core';
import { Driver, FtpDiskConfig, getRootCwd } from '@file-storage/common';
import { FtpDisk } from './ftp-disk';

describe('FTP Disk', () => {
  beforeAll(() => {
    Storage.config<FtpDiskConfig>({
      diskConfigs: [
        {
          driver: Driver.FTP,
          name: 'sammy',
          isDefault: true,
          root: '/upload',
          accessOptions: {
            host: '127.0.0.1',
            user: 'usertest',
            password: 'P@ssw0rd',
          },
        },
      ],
      customDrivers: [
        {
          name: Driver.FTP,
          disk: FtpDisk,
        },
      ],
    });
  });

  const fileReadStream = fs.createReadStream(
    getRootCwd() + '/test/support/images/0266554465-1528092757338.jpeg',
  );

  test('Default disk is sammy', () => {
    expect(Storage.defaultDisk.name).toEqual('sammy');
  });

  test('Upload image to ftp', async () => {
    return expect(Storage.disk('sammy').put(fileReadStream, 'bird.jpeg')).resolves.toMatchObject({
      code: 226,
      message: '226 Transfer complete.',
    });
  });

  test('Download image from ftp', async () => {
    await Storage.disk('sammy').put(fileReadStream, 'test_upload/bird.jpeg');

    return expect(Storage.disk('sammy').get('test_upload/bird.jpeg')).resolves.toBeTruthy();
  });

  test('Delete image from ftp', async () => {
    await Storage.disk('sammy').put(fileReadStream, 'test_upload/bird.jpeg');

    return expect(Storage.disk('sammy').delete('test_upload/bird.jpeg')).resolves.toMatchObject({
      code: 250,
      message: '250 Delete operation successful.',
    });
  });

  test('File is exists', async () => {
    await Storage.disk('sammy').put(fileReadStream, 'test_upload/bird.jpeg');

    return expect(Storage.defaultDisk.exists('test_upload/bird.jpeg')).resolves.toEqual(true);
  });

  test('File is not exists', async () => {
    return expect(Storage.disk('sammy').exists('not-exists.jpeg')).resolves.toEqual(false);
  });

  test('Get file size', async () => {
    const fileReadStream2 = fs.createReadStream(
      getRootCwd() + '/test/support/images/0266554465-1528092757338.jpeg',
    );
    await Storage.disk('sammy').put(fileReadStream2, 'bird-images/bird.jpeg');

    return expect(Storage.defaultDisk.size('bird-images/bird.jpeg')).resolves.toEqual(56199);
  });

  test('Last modified', async () => {
    await Storage.disk('sammy').put(fileReadStream, 'bird-images/bird2.jpeg');
    const lastMod = await Storage.defaultDisk.lastModified('bird-images/bird2.jpeg');
    expect(typeof lastMod).toBe('number');
  });
});
