import { Class, LocalDiskConfig as LocalDiskConfigCommon } from '@file-storage/common';
import { LocalDriver } from './local-driver';

export interface LocalDiskConfig extends LocalDiskConfigCommon {
  driver: Class<LocalDriver>;
}
