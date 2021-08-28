import fs from 'fs';
import Storage from '@file-storage/core';
import { DriverName, FileNotFoundError, getRootCwd } from '@file-storage/common';

describe('Sftp Disk test', () => {
  beforeAll(() => {
    Storage.config({
      diskConfigs: [
        {
          driver: DriverName.SFTP,
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

  const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');

  test('Upload image to sftp', () => {
    return expect(Storage.put(fileReadStream, 'dog.jpeg')).resolves.toMatchObject({
      success: true,
      message: 'Uploading success!',
    });
  });

  test('Upload sftp large image will uploaded to many formats', () => {
    // const imageFileStream = fs.createReadStream(
    //   getRootCwd() + '/test/support/images/photo-1000x750.jpeg',
    // );
    const birdReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    return expect(Storage.put(birdReadStream, 'my-photo/bird.jpeg')).resolves.toMatchObject({
      success: true,
      message: 'Uploading success!',
      formats: {
        thumbnail: {
          name: 'thumbnail_bird.jpeg',
          hash: null,
          ext: 'jpeg',
          mime: 'jpeg',
          width: 234,
          height: 156,
          size: 16.47,
          path: 'my-photo/thumbnail_bird.jpeg',
        },
        small: {
          name: 'small_bird.jpeg',
          hash: null,
          ext: 'jpeg',
          mime: 'jpeg',
          width: 500,
          height: 333,
          size: 34.76,
          path: 'my-photo/small_bird.jpeg',
        },
      },
    });
  });

  test('Download image from sftp', async () => {
    await Storage.disk('sftp-test').put(fileReadStream, 'bird-images/bird.jpeg');

    return expect(Storage.get('bird-images/bird.jpeg')).resolves.toBeTruthy();
  });

  // test('Delete image from sftp', async () => {
  //   await Storage.disk('sftp-test').put(fileReadStream, 'bird-images/bird-delete.jpeg');

  //   return expect(Storage.delete('bird-images/bird-delete.jpeg')).resolves.toEqual(
  //     'Successfully deleted /upload/bird-images/bird-delete.jpeg',
  //   );
  // });

  test('File is exists', async () => {
    await Storage.disk('sftp-test').put(fileReadStream, 'bird-images/bird.jpeg');

    return expect(Storage.exists('bird-images/bird.jpeg')).resolves.toEqual(true);
  });

  test('Check file is not exists', () => {
    return expect(Storage.disk('sftp-test').exists('not-exists.jpeg')).resolves.toEqual(false);
  });

  test('Get file not exists', () => {
    return expect(Storage.get('my-file/not-exists.jpeg')).rejects.toThrowError(FileNotFoundError);
  });

  test('Get file size', async () => {
    const fileReadStream2 = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    await Storage.disk('sftp-test').put(fileReadStream2, 'file-size/bird.jpeg');

    return expect(Storage.size('file-size/bird.jpeg')).resolves.toEqual(56199);
  });

  test('Last modified', async () => {
    await Storage.disk('sftp-test').put(fileReadStream, 'bird-images/bird.jpeg');
    const lastMod = await Storage.lastModified('bird-images/bird.jpeg');
    expect(typeof lastMod).toBe('number');
  });
});
