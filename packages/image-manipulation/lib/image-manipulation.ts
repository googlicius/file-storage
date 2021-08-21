import { ImageStats, Plugin } from '@file-storage/common';
import { generateResponsiveFormats, generateThumbnail } from './utils';

export class ImageManipulation extends Plugin {
  static readonly pluginName = 'image_manipulation';
  afterPutKey = 'formats';

  async afterPut(path: string) {
    const file = await this.disk.imageStats(path, true);
    const thumbnailFile = await generateThumbnail(<ImageStats & { buffer: Buffer }>file);
    const fileData: { [x: string]: ImageStats } = {};

    if (thumbnailFile) {
      await this.disk.put(thumbnailFile.buffer, thumbnailFile.path);

      delete thumbnailFile.buffer;

      fileData.thumbnail = thumbnailFile;
    }

    const formats = await generateResponsiveFormats(<ImageStats & { buffer: Buffer }>file);

    if (Array.isArray(formats) && formats.length > 0) {
      for (const format of formats) {
        if (!format) continue;

        const { key, file } = format;

        await this.disk.put(file.buffer, file.path);

        delete file.buffer;

        fileData[key] = file;
      }
    }

    return fileData;
  }
}
