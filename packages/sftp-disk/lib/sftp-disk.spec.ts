import fs from 'fs';
import Storage from '@file-storage/core';
import { Driver, getRootCwd } from '@file-storage/common';

describe('Sftp Disk test', () => {
  beforeAll(() => {
    Storage.config({
      diskConfigs: [
        {
          driver: Driver.SFTP,
          name: 'sftp-test',
          isDefault: true,
          root: '/upload',
          accessOptions: {
            host: '127.0.0.1',
            port: 2222,
            username: 'usertest',
            password: 'P@ssw0rd',
          },
        },
      ],
    });
  });

  const fileReadStream = fs.createReadStream(
    getRootCwd() + '/test/support/images/0266554465-1528092757338.jpeg',
  );

  test('Upload image to sftp', () => {
    return expect(Storage.defaultDisk.put(fileReadStream, 'dog.jpeg')).resolves.toEqual(
      'Uploaded data stream to /upload/dog.jpeg',
    );
  });

  test('Download image from sftp', async () => {
    await Storage.disk('sftp-test').put(fileReadStream, 'bird-images/bird.jpeg');

    return expect(Storage.defaultDisk.get('bird-images/bird.jpeg')).resolves.toBeTruthy();
  });

  // test('Delete image from sftp', async () => {
  //   await Storage.disk('sftp-test').put(fileReadStream, 'bird-images/bird-delete.jpeg');

  //   return expect(Storage.defaultDisk.delete('bird-images/bird-delete.jpeg')).resolves.toEqual(
  //     'Successfully deleted /upload/bird-images/bird-delete.jpeg',
  //   );
  // });

  test('File is exists', async () => {
    await Storage.disk('sftp-test').put(fileReadStream, 'bird-images/bird.jpeg');

    return expect(Storage.defaultDisk.exists('bird-images/bird.jpeg')).resolves.toEqual(true);
  });

  test('File is not exists', async () => {
    return expect(Storage.disk('sftp-test').exists('not-exists.jpeg')).resolves.toEqual(false);
  });

  test('Get file size', async () => {
    const fileReadStream2 = fs.createReadStream(
      getRootCwd() + '/test/support/images/0266554465-1528092757338.jpeg',
    );
    await Storage.disk('sftp-test').put(fileReadStream2, 'file-size/bird.jpeg');

    return expect(Storage.defaultDisk.size('file-size/bird.jpeg')).resolves.toEqual(56199);
  });

  test('Last modified', async () => {
    await Storage.disk('sftp-test').put(fileReadStream, 'bird-images/bird.jpeg');
    const lastMod = await Storage.defaultDisk.lastModified('bird-images/bird.jpeg');
    expect(typeof lastMod).toBe('number');
  });
});
