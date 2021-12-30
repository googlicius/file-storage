import { Driver } from '../driver.class';
import { Class } from './class.type';

export interface DiskConfig {
  driver: string | Class<Driver>;
  name: string;
}
