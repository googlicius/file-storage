import { Disk } from './disk.interface';
import { Class } from './class.type';

export interface DriverDiskMap {
  name: string;
  disk: Class<Disk>;
}
