import { Driver } from '../enums/driver.enum';
import { DiskConfig } from './disk-config.interface';

export interface SftpDiskConfig extends DiskConfig {
  driver: Driver.SFTP;
  root?: string;
  accessOptions: {
    host: string;
    port?: number;
    username: string;
    password: string;
    privateKey?: string | Buffer;
    [x: string]: any;
  };
}
