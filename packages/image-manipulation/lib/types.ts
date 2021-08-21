import { ImageStats } from '@file-storage/common';

export interface FileStats extends ImageStats {
  buffer: Buffer;
}
