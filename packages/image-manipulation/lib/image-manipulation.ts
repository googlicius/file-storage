import { ImageStats, Plugin } from '@file-storage/common';
import { ResizeOptions } from 'sharp';
import {
  config,
  Breakpoints,
  DEFAULT_BREAKPOINTS,
  DEFAULT_THUBNAIL_RESIZE_OPTIONS,
} from './config';
import { generateResponsiveFormats, generateThumbnail } from './utils';

interface ImageManipulationOptions {
  /**
   * Thumbnail Resize Options, default:
   * ```
   * width: 245
   * height: 156
   * fit: inside
   * ```
   */
  thumbnailResizeOptions?: ResizeOptions;
  /**
   * Responsive formats breakpoints, defaults:
   * ```
   * large: 1000
   * medium: 750
   * small: 500
   * ```
   */
  breakpoints?: Breakpoints;
}

interface AfterPutData {
  [x: string]: ImageStats;
}

export class ImageManipulation extends Plugin {
  static readonly pluginName = 'image_manipulation';
  afterPutKey = 'formats';

  static config(options: ImageManipulationOptions = {}) {
    const {
      breakpoints = DEFAULT_BREAKPOINTS,
      thumbnailResizeOptions = DEFAULT_THUBNAIL_RESIZE_OPTIONS,
    } = options;

    config.setBreakpoints(breakpoints);
    config.setThumbnailResizeOptions(thumbnailResizeOptions);
  }

  async afterPut(path: string): Promise<AfterPutData> {
    let file: ImageStats & {
      buffer: Buffer;
    };

    try {
      file = await this.disk.imageStats(path, true);
    } catch (error) {
      return;
    }

    const thumbnailFile = await generateThumbnail(file);
    const fileData: { [x: string]: ImageStats } = {};

    if (thumbnailFile) {
      await this.disk.put(thumbnailFile.buffer, thumbnailFile.path);

      delete thumbnailFile.buffer;

      fileData.thumbnail = thumbnailFile;
    }

    const formats = await generateResponsiveFormats(file);

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
