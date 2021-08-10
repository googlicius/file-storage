import { AccessOptions, FTPContext } from 'basic-ftp';
import { Driver } from '../enums/driver.enum';
import { DiskConfig } from './disk-config.interface';

export interface FtpDiskConfig extends DiskConfig {
  driver: Driver.FTP;
  root?: string;
  accessOptions: AccessOptions;
  ftpContext?: Partial<FTPContext>;
}
