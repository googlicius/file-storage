import fs from 'fs';
import Storage from '@file-storage/core';
import { DriverName, getRootCwd, SftpDiskConfig, streamToBuffer } from '@file-storage/common';

describe('Sftp Disk test', () => {
  beforeAll(() => {
    Storage.config<SftpDiskConfig>({
      diskConfigs: [
        {
          driver: DriverName.SFTP,
          name: 'sftp-test',
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

  // FIXME Timeout error on Github Actions
  // test('Upload image to sftp', () => {
  //   jest.setTimeout(15000);

  //   return expect(Storage.put(fileReadStream, 'dog.jpeg')).resolves.toMatchObject({
  //     success: true,
  //     message: 'Uploading success!',
  //   });
  // });

  // FIXME Timeout error on Github Actions
  // test('Upload sftp large image will uploaded to many formats', () => {
  //   jest.setTimeout(15000);

  //   const birdReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
  //   return expect(Storage.put(birdReadStream, 'my-photo/bird.jpeg')).resolves.toMatchObject({
  //     success: true,
  //     message: 'Uploading success!',
  //     formats: {
  //       thumbnail: {
  //         name: 'thumbnail_bird.jpeg',
  //         hash: null,
  //         ext: 'jpeg',
  //         mime: 'jpeg',
  //         width: 234,
  //         height: 156,
  //         size: 16.47,
  //         path: 'my-photo/thumbnail_bird.jpeg',
  //       },
  //       small: {
  //         name: 'small_bird.jpeg',
  //         hash: null,
  //         ext: 'jpeg',
  //         mime: 'jpeg',
  //         width: 500,
  //         height: 333,
  //         size: 34.76,
  //         path: 'my-photo/small_bird.jpeg',
  //       },
  //     },
  //   });
  // });

  // FIXME Timeout error on Github Actions
  // test('Download image from sftp', async () => {
  //   await Storage.disk('sftp-test').put(fileReadStream, 'bird-images/bird.jpeg');

  //   return expect(Storage.get('bird-images/bird.jpeg')).resolves.toBeTruthy();
  // });

  // FIXME Timeout error on Github Actions
  test.skip('Delete image from sftp', async () => {
    await Storage.disk('sftp-test').put(fileReadStream, 'bird-images/bird-delete.jpeg');

    return expect(Storage.delete('bird-images/bird-delete.jpeg')).resolves.toEqual(
      'Successfully deleted /upload/bird-images/bird-delete.jpeg',
    );
  });

  test.skip('File is exists', async () => {
    await Storage.disk('sftp-test').put(fileReadStream, 'bird-images/bird.jpeg');

    return expect(Storage.exists('bird-images/bird.jpeg')).resolves.toEqual(true);
  });

  test.skip('Check file is not exists', () => {
    return expect(Storage.disk('sftp-test').exists('not-exists.jpeg')).resolves.toEqual(false);
  });

  test.skip('Get file not exists', () => {
    return expect(Storage.get('my-file/not-exists.jpeg')).rejects.toThrowError();
  });

  test.skip('Get file size', async () => {
    const fileReadStream2 = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
    await Storage.disk('sftp-test').put(fileReadStream2, 'file-size/bird.jpeg');

    return expect(Storage.size('file-size/bird.jpeg')).resolves.toEqual(56199);
  });

  test.skip('Last modified', async () => {
    await Storage.disk('sftp-test').put(fileReadStream, 'bird-images/bird.jpeg');
    const lastMod = await Storage.lastModified('bird-images/bird.jpeg');
    expect(typeof lastMod).toBe('number');
  });

  // FIXME Failed when run all tests.
  // test('Move file', async () => {
  //   const fileReadStream = fs.createReadStream(getRootCwd() + '/test/support/images/bird.jpeg');
  //   const putResult = await Storage.put(fileReadStream, 'bird-images/bird.jpeg');
  //   await Storage.move(putResult.path, 'photos/new-path2.jpeg');

  //   const size = await Storage.size('photos/new-path2.jpeg');
  //   expect(typeof size).toBe('number');

  //   return expect(Storage.size('bird-images/bird.jpeg')).rejects.toThrowError();
  // });

  describe('append', () => {
    it.skip('should append a text to a file', async () => {
      const putResult = await Storage.put(Buffer.from('First line'), 'to-be-appended.txt');
      // await sleep(10);
      await Storage.append('\nAppended line', putResult.path);
      const buff = await streamToBuffer(await Storage.get(putResult.path));

      return expect(buff.toString()).toMatchSnapshot();
    });
  });
});
