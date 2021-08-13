import S3 from 'aws-sdk/clients/s3';
import { DriverName } from '../enums/driver-name.enum';
import { DiskConfig } from './disk-config.interface';

export interface S3DiskConfig extends DiskConfig, S3.ClientConfiguration {
  driver: DriverName.S3;
  bucketName: string;
  /**
   * A custom public url instead of default s3 public path.
   */
  publicUrl?: string;
}
