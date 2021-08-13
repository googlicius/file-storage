import { DriverName } from '../enums/driver-name.enum';
import { DiskConfig } from './disk-config.interface';

export interface SftpDiskConfig extends DiskConfig {
  driver: DriverName.SFTP;
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
