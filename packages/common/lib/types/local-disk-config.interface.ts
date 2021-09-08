import { DriverName } from '../enums/driver-name.enum';
import { DiskConfig } from './disk-config.interface';

export interface LocalDiskConfig extends DiskConfig {
  driver: DriverName.LOCAL;
  root?: string;
  publicUrl?: string;
}
