import {
  Class,
  DiskConfig,
  Driver,
  FtpDiskConfig,
  GCSDiskConfig,
  LocalDiskConfig,
  S3DiskConfig,
  SftpDiskConfig,
} from '@file-storage/common';

export type BuitInDiskConfig =
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
   * Add one or more your custom drivers.
   * @deprecated
   */
  customDrivers?: Class<Driver>[];

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
