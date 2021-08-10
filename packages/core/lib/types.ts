import {
  DiskConfig,
  DriverDiskMap,
  LocalDiskConfig,
  S3DiskConfig,
  SftpDiskConfig,
} from '@file-storage/common';

export type BuitInDiskConfig = LocalDiskConfig | S3DiskConfig | SftpDiskConfig;

export interface StorageConfiguration<T extends DiskConfig> {
  /**
   * List of disks available in your application.
   */
  diskConfigs?: (T | BuitInDiskConfig)[];

  /**
   * Add one or more your custom drivers.
   */
  customDrivers?: DriverDiskMap[];
}