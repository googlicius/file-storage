import { Driver } from '../driver.class';
import { DriverName } from '../enums/driver-name.enum';
import { Class } from './class.type';
import { DiskConfig } from './disk-config.interface';

export interface LocalDiskConfig extends DiskConfig {
  driver: DriverName.LOCAL | Class<Driver>;
  root?: string;
  publicUrl?: string;
}
