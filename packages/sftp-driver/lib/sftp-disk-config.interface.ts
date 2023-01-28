import { Class, SftpDiskConfig as SftpDiskConfigCommon } from '@file-storage/common';
import { SftpDriver } from './sftp-driver';

export interface SftpDiskConfig extends SftpDiskConfigCommon {
  driver: Class<SftpDriver>;
}
