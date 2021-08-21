import fs from 'fs';
import Storage from '@file-storage/core';
import { DriverName, FileNotFoundError, getRootCwd } from '@file-storage/common';

describe('Local Disk', () => {
  beforeAll(() => {
    Storage.config({
      diskConfigs: [
        {
          driver: DriverName.LOCAL,
          name: 'local',
          root: 'storage',
        },
      ],
    });
  });

  test('Default disk is local', () => {
    expect(Storage.name).toEqual('local');
  });

  test('Upload image to local success', () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    return expect(
      Storage.disk('local').put(fileReadStream, 'test_upload/bird.jpeg'),
    ).resolves.toMatchObject({
      success: true,
      message: 'Uploading success!',
    });
  });

  test('Upload image to local success (Using default disk)', () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    return expect(Storage.put(fileReadStream, 'test_upload/bird$$.jpeg')).resolves.toMatchObject({
      success: true,
      message: 'Uploading success!',
    });
  });

  test('Upload local large image will uploaded to many formats', () => {
    const imageFileStream = fs.createReadStream(
      getRootCwd() + '/test/support/images/photo-1000x750.jpeg',
    );
    return expect(
      Storage.put(imageFileStream, 'my-photo/photo-1000x750.jpeg'),
    ).resolves.toMatchObject({
      success: true,
      message: 'Uploading success!',
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

  test('Upload image from URI to local', () => {
    return expect(
      Storage.disk('local').uploadImageFromExternalUri(
        'https://4.img-dpreview.com/files/p/E~TS590x0~articles/3925134721/0266554465.jpeg',
        'test_upload/test_image_from_uri.jpeg',
      ),
    ).resolves.toMatchObject({
      success: true,
      message: 'Uploading success!',
    });
  });

  test('Upload image from URI to local (Using default disk)', () => {
    return expect(
      Storage.uploadImageFromExternalUri(
        'https://4.img-dpreview.com/files/p/E~TS590x0~articles/3925134721/0266554465.jpeg',
        'test_upload/test_image_from_uri.jpeg',
      ),
    ).resolves.toMatchObject({
      success: true,
      message: 'Uploading success!',
    });
  });

  test('Upload a file is not an image from URI to local', () => {
    const uri = 'https://previews.magnoliabox.com/kew/mb_hero/kewgar066/MUS-FAPC1114_850.jpg';
    return expect(
      Storage.disk('local').uploadImageFromExternalUri(uri, 'test_upload/test_image_from_uri.jpeg'),
    ).rejects.toEqual(new Error('Not an image: ' + uri));
  });

  test('Delete image from local (Using default disk)', async () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    const filePath = 'test_upload/image123.jpeg';
    await Storage.put(fileReadStream, filePath);

    return expect(Storage.delete(filePath)).resolves.toBeTruthy();
  });

  test('Delete file does not exists', () => {
    return expect(Storage.delete('not-exists.jpeg')).rejects.toThrowError(FileNotFoundError);
  });

  test('Download image from local', async () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    // Storage.put
    await Storage.put(fileReadStream, 'test_upload/bird2.jpeg');
    return expect(Storage.get('test_upload/bird2.jpeg')).resolves.toBeTruthy();
  });

  test('Download not exists image from local error', async () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    await Storage.put(fileReadStream, 'test_upload/bird2.jpeg');
    return expect(Storage.get('not-exist.jpeg')).rejects.toThrowError(FileNotFoundError);
  });

  test('File is exists', async () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    await Storage.put(fileReadStream, 'bird-images/bird.jpeg');

    return expect(Storage.exists('bird-images/bird.jpeg')).resolves.toEqual(true);
  });

  test('File is not exists', async () => {
    return expect(Storage.exists('not-exists.jpeg')).resolves.toEqual(false);
  });

  test('Get file size', async () => {
    const fileReadStream2 = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    await Storage.disk('local').put(fileReadStream2, 'bird-images/bird.jpeg');

    return expect(Storage.size('bird-images/bird.jpeg')).resolves.toEqual(56199);
  });

  test('Last modified', async () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    await Storage.disk('local').put(fileReadStream, 'bird-images/bird.jpeg');
    const lastMod = await Storage.lastModified('bird-images/bird.jpeg');
    expect(typeof lastMod).toBe('number');
  });
});
