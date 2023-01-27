import { Class, GCSDiskConfig as GCSDiskConfigCommon } from '@file-storage/common';
import { GoogleCloudStorageDriver } from './gcs-driver';

export interface GCSDiskConfig extends GCSDiskConfigCommon {
  driver: Class<GoogleCloudStorageDriver>;
}
