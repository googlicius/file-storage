import { Class, S3DiskConfig as S3DiskConfigCommon } from '@file-storage/common';
import { S3Driver } from './s3-driver';

export interface S3DiskConfig extends S3DiskConfigCommon {
  driver: Class<S3Driver>;
}
