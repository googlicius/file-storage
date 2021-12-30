import { StorageOptions } from '@google-cloud/storage';
import { DriverName } from '../enums/driver-name.enum';
import { DiskConfig } from './disk-config.interface';

export interface GCSDiskConfig extends DiskConfig, StorageOptions {
  driver: DriverName.GCS;
  bucketName: string;
  /**
   * A custom public url instead of default public path.
   */
  publicUrl?: string;
}
