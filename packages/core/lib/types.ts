import {
  Class,
  DiskConfig,
  FtpDiskConfig,
  GCSDiskConfig,
  LocalDiskConfig,
  Plugin,
  S3DiskConfig,
  SftpDiskConfig,
} from '@file-storage/common';

/**
 * @deprecated Use interface/type from specific package instead.
 */
export type BuiltInDiskConfig =
  | LocalDiskConfig
  | S3DiskConfig
  | SftpDiskConfig
  | FtpDiskConfig
  | GCSDiskConfig;

export interface StorageConfiguration<T extends DiskConfig> {
  /**
   * Default disk name.
   */
  defaultDiskName?: string;

  /**
   * List of disks available in your application.
   */
  diskConfigs?: T[];

  /**
   * List of plugins available in your application.
   */
  plugins?: Class<Plugin>[];

  /**
   * Enable unique file name.
   */
  uniqueFileName?: boolean;
}

// export interface GetDiskOptions {
//   /**
//    * Return a storage instance.
//    */
//   asStorage?: boolean;
// }
