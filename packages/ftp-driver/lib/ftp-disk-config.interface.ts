import { Class, FtpDiskConfig as FtpDiskConfigCommon } from '@file-storage/common';
import { FtpDriver } from './ftp-driver';

export interface FtpDiskConfig extends FtpDiskConfigCommon {
  driver: Class<FtpDriver>;
}
