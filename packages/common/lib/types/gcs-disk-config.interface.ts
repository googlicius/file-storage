import { StorageOptions } from '@google-cloud/storage';
import { Driver } from '../driver.class';
import { DriverName } from '../enums/driver-name.enum';
import { Class } from './class.type';
import { DiskConfig } from './disk-config.interface';

export interface GCSDiskConfig extends DiskConfig, StorageOptions {
  driver: DriverName.GCS | Class<Driver>;
  bucketName: string;
  /**
   * A custom public url instead of default public path.
   */
  publicUrl?: string;
}
