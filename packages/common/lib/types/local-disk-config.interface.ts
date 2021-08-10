import { Driver } from '../enums/driver.enum';
import { DiskConfig } from './disk-config.interface';

export interface LocalDiskConfig extends DiskConfig {
  driver: Driver.LOCAL;
  root?: string;
}
