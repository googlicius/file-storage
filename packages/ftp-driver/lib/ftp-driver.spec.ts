import fs from 'fs';
import Storage from '@file-storage/core';
import { DriverName, FtpDiskConfig, getRootCwd, streamToBuffer } from '@file-storage/common';
import ImageManipulation from '@file-storage/image-manipulation';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('FTP Disk test', () => {
  beforeAll(() => {
    Storage.config<FtpDiskConfig>({
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
      plugins: [ImageManipulation],
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
    ).resolves.toMatchSnapshot();
  });

  // FIXME Request timed out even this test success.
  // test('Download image from ftp', async () => {
  //   const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
  //   await Storage.disk('sammy').put(fileReadStream, 'test_upload/bird.jpeg');

  //   return expect(Storage.disk('sammy').get('test_upload/bird.jpeg')).resolves.toBeTruthy();
  // });

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

  // TODO Should test this case.
  // test('Copy file', async () => {
  //   const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
  //   const putResult = await Storage.put(fileReadStream, 'bird-images/bird.jpeg');
  //   await Storage.copy(putResult.path, 'photos/bird-copy.jpeg');

  //   const size = await Storage.size('photos/bird-copy.jpeg');
  //   expect(typeof size).toBe('number');
  // });

  test('Move file', async () => {
    const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    const putResult = await Storage.put(fileReadStream, 'bird-images/bird.jpeg');
    await Storage.move(putResult.path, 'photos/new-path.jpeg');

    const size = await Storage.size('photos/new-path.jpeg');
    expect(typeof size).toBe('number');

    return expect(Storage.size('bird-images/bird.jpeg')).rejects.toThrowError();
  });

  describe('append', () => {
    it('should append a text to a file', async () => {
      const putResult = await Storage.put(Buffer.from('First line'), 'to-be-appended.txt');
      await sleep(10);
      await Storage.append('\nAppended line', putResult.path);
      const buff = await streamToBuffer(await Storage.get(putResult.path));

      return expect(buff.toString()).toMatchSnapshot();
    });
  });
});
