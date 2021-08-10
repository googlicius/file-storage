import S3 from 'aws-sdk/clients/s3';
import { Driver } from '../enums/driver.enum';
import { DiskConfig } from './disk-config.interface';

export interface S3DiskConfig extends DiskConfig, S3.ClientConfiguration {
  driver: Driver.S3;
  bucketName: string;
  /**
   * A custom public url instead of default s3 public path.
   */
  publicUrl?: string;
}
