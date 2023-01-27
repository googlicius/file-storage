import { AccessOptions, FTPContext } from 'basic-ftp';
import { Driver } from '../driver.class';
import { DriverName } from '../enums/driver-name.enum';
import { Class } from './class.type';
import { DiskConfig } from './disk-config.interface';

export interface FtpDiskConfig extends DiskConfig {
  driver: DriverName.FTP | Class<Driver>;
  root?: string;
  accessOptions: AccessOptions;
  ftpContext?: Partial<FTPContext>;
}
