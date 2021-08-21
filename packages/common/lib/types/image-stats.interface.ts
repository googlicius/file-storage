export interface ImageStats {
  name?: string;
  hash?: string;
  ext: string;
  mime: string;
  width?: number;
  height?: number;
  size: number;
  path: string;
  buffer?: Buffer;
}
