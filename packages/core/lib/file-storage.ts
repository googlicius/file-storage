/**
 * _____ _ _        ____  _
 * |  ___(_) | ___  / ___|| |_ ___  _ __ __ _  __ _  ___
 * | |_  | | |/ _ \ \___ \| __/ _ \| '__/ _` |/ _` |/ _ \
 * |  _| | | |  __/  ___) | || (_) | | | (_| | (_| |  __/
 * |_|   |_|_|\___| |____/ \__\___/|_|  \__,_|\__, |\___|
 *                                            |___/
 */

import { Stream } from 'stream';
import {
  DiskConfig,
  Driver,
  Disk,
  DriverDiskMap,
  requireDefaultModule,
  LocalDiskConfig,
} from '@file-storage/common';
import { BuitInDiskConfig, StorageConfiguration } from './types';

const S3Disk = requireDefaultModule('@file-storage/s3');
const LocalDisk = requireDefaultModule('@file-storage/local');
const SftpDisk = requireDefaultModule('@file-storage/sftp');

let configableDefaultDiskName = 'local';

const defaultDiskConfig: LocalDiskConfig = {
  driver: Driver.LOCAL,
  name: 'local',
  root: 'storage',
  isDefault: true,
};

let availableDisks: (DiskConfig | BuitInDiskConfig)[] = [defaultDiskConfig];

const driverDiskMaps: DriverDiskMap[] = [
  {
    name: Driver.S3,
    disk: S3Disk,
  },
  {
    name: Driver.LOCAL,
    disk: LocalDisk,
  },
  {
    name: Driver.SFTP,
    disk: SftpDisk,
  },
];

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
      configableDefaultDiskName = diskConfig.name;
      break;
    }
  }
}

function addCustomDriver(map: DriverDiskMap[] = []) {
  if (map.length > 0) {
    driverDiskMaps.push(...map);
  }
}

function getDisk<U extends Disk>(diskName: string = configableDefaultDiskName): U {
  const diskConfig = availableDisks.find((item) => item.name === diskName);

  if (!diskConfig) {
    throw new Error(`Given disk is not defined: ${diskName}`);
  }

  const driverDiskMap = driverDiskMaps.find((item) => item.name === diskConfig.driver);

  if (!driverDiskMap) {
    throw new Error(`Driver '${diskConfig.driver}' is not declared.`);
  }

  try {
    return new driverDiskMap.disk(diskConfig) as U;
  } catch (error) {
    throw new Error(
      `Please install \`@file-storage/${diskConfig.driver}\` for ${diskConfig.driver} driver`,
    );
  }
}

/**
 * `Storage` provides a filesystem abstraction, simple way to uses drivers for working with local filesystems, Amazon S3,...
 */
class StorageClass implements Disk {
  /**
   * Get default disk instance.
   */
  defaultDisk: Disk = getDisk(configableDefaultDiskName);

  get name() {
    return this.defaultDisk.name;
  }

  get driver() {
    return this.defaultDisk.driver;
  }

  /**
   * Config for storage methods supported in the application.
   */
  config<U extends DiskConfig = BuitInDiskConfig>(options: StorageConfiguration<U> = {}) {
    const { diskConfigs = [], customDrivers = [] } = options;

    addCustomDriver(customDrivers);
    handleDiskConfigs(diskConfigs);

    this.defaultDisk = getDisk(configableDefaultDiskName);
  }

  /**
   * Get disk instance by diskName.
   */
  disk<U extends Disk>(diskName?: string): U {
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
