import { Stream } from 'stream';
import {
  DiskConfig,
  DriverName,
  Driver,
  requireDefaultModule,
  LocalDiskConfig,
  Class,
} from '@file-storage/common';
import { BuitInDiskConfig, StorageConfiguration } from './types';
// import S3Driver2 from '@file-storage/local';

const S3Driver = requireDefaultModule('@file-storage/s3');
const LocalDriver = requireDefaultModule('@file-storage/local');
const SftpDriver = requireDefaultModule('@file-storage/sftp');

let configableDefaultDriverName = 'local';

const defaultDiskConfig: LocalDiskConfig = {
  driver: DriverName.LOCAL,
  name: 'local',
  root: 'storage',
  isDefault: true,
};

let availableDisks: (DiskConfig | BuitInDiskConfig)[] = [defaultDiskConfig];

const drivers: Class<Driver>[] = [S3Driver, LocalDriver, SftpDriver];

function handleDiskConfigs(diskConfigs: DiskConfig[]) {
  const seen = new Set();
  availableDisks = [];

  const isMoreThanOneDefault = () =>
    diskConfigs.filter((diskConfig) => !!diskConfig.isDefault).length > 1;

  const hasDuplicatesName = () =>
    diskConfigs.some((diskConfig) => seen.size === seen.add(diskConfig.name).size);

  const isNoDefaultAssigned = () =>
    typeof availableDisks.find((diskConfig) => !!diskConfig.isDefault) === 'undefined';

  if (isMoreThanOneDefault()) {
    throw new Error('Not allows more than one default disk.');
  }

  if (hasDuplicatesName()) {
    throw new Error('Duplicated disk name.');
  }

  if (diskConfigs.length === 0) {
    availableDisks.push(defaultDiskConfig);
  }

  availableDisks.push(...diskConfigs);

  if (isNoDefaultAssigned()) {
    availableDisks[0].isDefault = true;
  }

  // Set default disk.
  for (const diskConfig of availableDisks) {
    if (diskConfig.isDefault) {
      configableDefaultDriverName = diskConfig.name;
      break;
    }
  }
}

function addCustomDriver(map: Class<Driver>[] = []) {
  if (map.length > 0) {
    drivers.push(...map);
  }
}

function getDisk<U extends Driver>(diskName: string = configableDefaultDriverName): U {
  const diskConfig = availableDisks.find((item) => item.name === diskName);

  if (!diskConfig) {
    throw new Error(`Given disk is not defined: ${diskName}`);
  }

  try {
    const driver = drivers.find((item) => item['driverName'] === diskConfig.driver);
    return new driver(diskConfig) as U;
  } catch (error) {
    if ((<any>Object).values(DriverName).includes(diskConfig.driver)) {
      throw new Error(
        `Please install \`@file-storage/${diskConfig.driver}\` for ${diskConfig.driver} driver`,
      );
    }
    throw new Error(`Driver '${diskConfig.driver}' is not declared.`);
  }
}

/**
 * `Storage` provides a filesystem abstraction, simple way to uses drivers for working with local filesystems, Amazon S3,...
 */
class StorageClass implements Driver {
  /**
   * Get default disk instance.
   */
  defaultDisk: Driver = getDisk(configableDefaultDriverName);

  get name() {
    return this.defaultDisk.name;
  }

  // get driver() {
  //   return this.defaultDisk.driver;
  // }

  /**
   * Config for storage methods supported in the application.
   */
  config<U extends DiskConfig = BuitInDiskConfig>(options: StorageConfiguration<U> = {}) {
    const { diskConfigs = [], customDrivers = [] } = options;

    addCustomDriver(customDrivers);
    handleDiskConfigs(diskConfigs);

    this.defaultDisk = getDisk(configableDefaultDriverName);
  }

  /**
   * Get disk instance by diskName.
   */
  disk<U extends Driver>(diskName?: string): U {
    if (!diskName) {
      return this.defaultDisk as U;
    }

    return getDisk<U>(diskName);
  }

  url(path: string) {
    return this.defaultDisk.url(path);
  }

  exists(path: string) {
    return this.defaultDisk.exists(path);
  }

  size(path: string): Promise<number> {
    return this.defaultDisk.size(path);
  }

  lastModified(path: string): Promise<number> {
    return this.defaultDisk.lastModified(path);
  }

  put(stream: Stream, path: string): Promise<any> {
    return this.defaultDisk.put(stream, path);
  }

  get(path: string): Stream | Promise<Stream> {
    return this.defaultDisk.get(path);
  }

  delete(path: string): Promise<any> {
    return this.defaultDisk.delete(path);
  }

  uploadImageFromExternalUri(
    uri: string,
    path: string,
    ignoreHeaderContentType = false,
  ): Promise<any> {
    return this.defaultDisk.uploadImageFromExternalUri(uri, path, ignoreHeaderContentType);
  }

  makeDir(dir: string): Promise<string> {
    return this.defaultDisk.makeDir(dir);
  }

  removeDir(dir: string): Promise<string> {
    return this.defaultDisk.removeDir(dir);
  }
}

export const Storage = new StorageClass();
