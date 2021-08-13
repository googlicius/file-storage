import { AccessOptions, FTPContext } from 'basic-ftp';
import { DriverName } from '../enums/driver-name.enum';
import { DiskConfig } from './disk-config.interface';

export interface FtpDiskConfig extends DiskConfig {
  driver: DriverName.FTP;
  root?: string;
  accessOptions: AccessOptions;
  ftpContext?: Partial<FTPContext>;
}
