import fs from 'fs';
import Storage from '@file-storage/core';
import { DriverName, getRootCwd } from '@file-storage/common';

describe('FTP Disk test', () => {
  beforeAll(() => {
    Storage.config({
      diskConfigs: [
        {
          driver: DriverName.FTP,
          name: 'sammy',
          root: '/upload',
          accessOptions: {
            host: '127.0.0.1',
            user: 'usertest',
            password: 'P@ssw0rd',
          },
        },
      ],
    });
  });

  test('Default disk is sammy', () => {
    expect(Storage.name).toEqual('sammy');
  });

  test('Upload image to ftp', async () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    return expect(Storage.disk('sammy').put(fileReadStream, 'bird.jpeg')).resolves.toMatchObject({
      success: true,
      code: 226,
      message: '226 Transfer complete.',
    });
  });

  test('Upload ftp using Storage facade', () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    return expect(Storage.put(fileReadStream, 'path/to/bird.jpeg')).resolves.toMatchObject({
      success: true,
      code: 226,
      message: '226 Transfer complete.',
      name: 'bird.jpeg',
      path: 'path/to/bird.jpeg',
    });
  });

  test('Upload ftp large image will uploaded to many formats', () => {
    const imageFileStream = fs.createReadStream(
      getRootCwd() + '/test/support/images/photo-1000x750.jpeg',
    );
    return expect(
      Storage.put(imageFileStream, 'my-photo/photo-1000x750.jpeg'),
    ).resolves.toMatchObject({
      success: true,
      code: 226,
      message: '226 Transfer complete.',
      name: 'photo-1000x750.jpeg',
      path: 'my-photo/photo-1000x750.jpeg',
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

  test('Download image from ftp', async () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    await Storage.disk('sammy').put(fileReadStream, 'test_upload/bird.jpeg');

    return expect(Storage.disk('sammy').get('test_upload/bird.jpeg')).resolves.toBeTruthy();
  });

  test('Delete image from ftp', async () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    await Storage.disk('sammy').put(fileReadStream, 'test_upload/bird.jpeg');

    return expect(Storage.disk('sammy').delete('test_upload/bird.jpeg')).resolves.toMatchObject({
      code: 250,
      message: '250 Delete operation successful.',
    });
  });

  test('File is exists', async () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    await Storage.disk('sammy').put(fileReadStream, 'test_upload/bird.jpeg');

    return expect(Storage.exists('test_upload/bird.jpeg')).resolves.toEqual(true);
  });

  test('File is not exists', async () => {
    return expect(Storage.disk('sammy').exists('not-exists.jpeg')).resolves.toEqual(false);
  });

  test('Get file size', async () => {
    const fileReadStream2 = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    await Storage.disk('sammy').put(fileReadStream2, 'bird-images/bird.jpeg');

    return expect(Storage.size('bird-images/bird.jpeg')).resolves.toEqual(56199);
  });

  test('Last modified', async () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    await Storage.disk('sammy').put(fileReadStream, 'bird-images/bird2.jpeg');
    const lastMod = await Storage.lastModified('bird-images/bird2.jpeg');
    expect(typeof lastMod).toBe('number');
  });
});
