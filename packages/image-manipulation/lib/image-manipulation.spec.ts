import fs from 'fs';
import Storage from '@file-storage/core';
import { getRootCwd } from '@file-storage/common';
import ImageManipulation from '@file-storage/image-manipulation';

describe('Image Manipulation', () => {
  beforeAll(() => {
    Storage.config({
      plugins: [ImageManipulation],
    });
  });

  it('should generates 2 custom breakpoints: size1, size2', () => {
    const imageFileStream = fs.createReadStream(
      getRootCwd() + '/test/support/images/photo-1000x750.jpeg',
    );

    ImageManipulation.config({
      breakpoints: {
        size1: 400,
        size2: 600,
      },
    });

    return expect(Storage.put(imageFileStream, 'bird.jpeg')).resolves.toMatchSnapshot();
  });

  it('should generates custom thumbnail size', () => {
    const imageFileStream = fs.createReadStream(
      getRootCwd() + '/test/support/images/photo-1000x750.jpeg',
    );

    ImageManipulation.config({
      breakpoints: null,
      thumbnailResizeOptions: {
        width: 333,
        height: 222,
        fit: 'contain',
      },
    });

    return expect(Storage.put(imageFileStream, 'bird.jpeg')).resolves.toMatchSnapshot();
  });

  it('should have no responsive formats', () => {
    const imageFileStream = fs.createReadStream(
      getRootCwd() + '/test/support/images/photo-1000x750.jpeg',
    );

    ImageManipulation.config({
      breakpoints: null,
    });

    return expect(Storage.put(imageFileStream, 'bird.jpeg')).resolves.toMatchSnapshot();
  });

  it('should have no thumbnail', () => {
    const imageFileStream = fs.createReadStream(
      getRootCwd() + '/test/support/images/photo-1000x750.jpeg',
    );

    ImageManipulation.config({
      thumbnailResizeOptions: null,
    });

    return expect(Storage.put(imageFileStream, 'bird.jpeg')).resolves.toMatchSnapshot();
  });

  it('should not generate image sizes when uploading a file that not an image', () => {
    const fileStream = fs.createReadStream(getRootCwd() + '/test/support/files/test-file.txt');

    return expect(Storage.put(fileStream, 'test-file.txt')).resolves.toMatchSnapshot();
  });
});
