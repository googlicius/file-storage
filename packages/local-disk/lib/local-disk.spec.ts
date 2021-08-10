import fs from 'fs';
import Storage from '@file-storage/core';
import { Driver, getRootCwd } from '@file-storage/common';

describe('Local Disk', () => {
  beforeAll(() => {
    Storage.config({
      diskConfigs: [
        {
          driver: Driver.LOCAL,
          name: 'local',
          root: 'storage',
        },
      ],
    });
  });

  const fileReadStream = fs.createReadStream(
    getRootCwd() + '/test/support/images/0266554465-1528092757338.jpeg',
  );

  test('Default disk is local', () => {
    expect(Storage.defaultDisk.name).toEqual('local');
  });

  test('Upload image to local success', () => {
    return expect(
      Storage.disk('local').put(fileReadStream, 'test_upload/bird.jpeg'),
    ).resolves.toEqual('Uploading success!');
  });

  test('Upload image to local success (Using default disk)', () => {
    return expect(
      Storage.defaultDisk.put(fileReadStream, 'test_upload/bird.jpeg'),
    ).resolves.toEqual('Uploading success!');
  });

  test('Upload image from URI to local', () => {
    return expect(
      Storage.disk('local').uploadImageFromExternalUri(
        'https://4.img-dpreview.com/files/p/E~TS590x0~articles/3925134721/0266554465.jpeg',
        'test_upload/test_image_from_uri.jpeg',
      ),
    ).resolves.toEqual('Uploading success!');
  });

  test('Upload image from URI to local (Using default disk)', () => {
    return expect(
      Storage.defaultDisk.uploadImageFromExternalUri(
        'https://4.img-dpreview.com/files/p/E~TS590x0~articles/3925134721/0266554465.jpeg',
        'test_upload/test_image_from_uri.jpeg',
      ),
    ).resolves.toEqual('Uploading success!');
  });

  test('Upload a file is not an image from URI to local', () => {
    const uri = 'https://previews.magnoliabox.com/kew/mb_hero/kewgar066/MUS-FAPC1114_850.jpg';
    return expect(
      Storage.disk('local').uploadImageFromExternalUri(uri, 'test_upload/test_image_from_uri.jpeg'),
    ).rejects.toEqual(new Error('Not an image: ' + uri));
  });

  test('Delete image from local (Using default disk)', async () => {
    const filePath = 'test_upload/image123.jpeg';
    await Storage.defaultDisk.put(fileReadStream, filePath);

    return expect(Storage.defaultDisk.delete(filePath)).resolves.toBeTruthy();
  });

  test('Delete file does not exists', async () => {
    return expect(Storage.defaultDisk.delete('not-exists.jpeg')).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  test('Download image from local', async () => {
    // Storage.put
    await Storage.defaultDisk.put(fileReadStream, 'test_upload/bird2.jpeg');
    return expect(Storage.defaultDisk.get('test_upload/bird2.jpeg')).resolves.toBeTruthy();
  });

  test('Download not exists image from local error', async () => {
    await Storage.defaultDisk.put(fileReadStream, 'test_upload/bird2.jpeg');
    return expect(Storage.defaultDisk.get('not-exist.jpeg')).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  test('File is exists', async () => {
    await Storage.defaultDisk.put(fileReadStream, 'bird-images/bird.jpeg');

    return expect(Storage.defaultDisk.exists('bird-images/bird.jpeg')).resolves.toEqual(true);
  });

  test('File is not exists', async () => {
    return expect(Storage.defaultDisk.exists('not-exists.jpeg')).resolves.toEqual(false);
  });

  test('Get file size', async () => {
    const fileReadStream2 = fs.createReadStream(
      getRootCwd() + '/test/support/images/0266554465-1528092757338.jpeg',
    );
    await Storage.disk('local').put(fileReadStream2, 'bird-images/bird.jpeg');

    return expect(Storage.defaultDisk.size('bird-images/bird.jpeg')).resolves.toEqual(56199);
  });

  test('Last modified', async () => {
    await Storage.disk('local').put(fileReadStream, 'bird-images/bird.jpeg');
    const lastMod = await Storage.defaultDisk.lastModified('bird-images/bird.jpeg');
    expect(typeof lastMod).toBe('number');
  });
});
