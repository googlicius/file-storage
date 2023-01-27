import { Driver } from '../driver.class';
import { DriverName } from '../enums/driver-name.enum';
import { Class } from './class.type';
import { DiskConfig } from './disk-config.interface';

export interface SftpDiskConfig extends DiskConfig {
  driver: DriverName.SFTP | Class<Driver>;
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
