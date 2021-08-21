import { Stream } from 'stream';
import {
  DiskConfig,
  DriverName,
  Driver,
  requireDefaultModule,
  LocalDiskConfig,
  Class,
  Plugin,
} from '@file-storage/common';
import { BuitInDiskConfig, StorageConfiguration } from './types';

let configableDefaultDiskName = 'local';

const defaultDiskConfig: LocalDiskConfig = {
  driver: DriverName.LOCAL,
  name: 'local',
  root: 'storage',
  isDefault: true,
};

let availableDisks: (DiskConfig | BuitInDiskConfig)[] = [defaultDiskConfig];

const drivers: Class<Driver>[] = [
  requireDefaultModule('@file-storage/s3'),
  requireDefaultModule('@file-storage/ftp'),
  requireDefaultModule('@file-storage/local'),
  requireDefaultModule('@file-storage/sftp'),
];

const plugins: Class<Plugin>[] = [requireDefaultModule('@file-storage/image-manipulation')].filter(
  (item) => !!item,
);

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

function addCustomDriver(customDrivers: Class<Driver>[] = []) {
  if (customDrivers.length > 0) {
    drivers.push(...customDrivers);
  }
}

function getDisk<U extends Driver>(diskName: string = configableDefaultDiskName): U {
  const diskConfig = availableDisks.find((item) => item.name === diskName);

  if (!diskConfig) {
    throw new Error(`Given disk is not defined: ${diskName}`);
  }

  try {
    const driver = drivers.find((item) => item['driverName'] === diskConfig.driver);
    return new driver(diskConfig) as U;
  } catch (error) {
    // Throw error missing bult-in driver package.
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
  defaultDisk: Driver;

  /**
   * All plugin instances.
   */
  private pluginInstances: Plugin[];

  constructor(diskName = configableDefaultDiskName) {
    this.initialize(diskName);
  }

  get name() {
    return this.defaultDisk.name;
  }

  /**
   * Initialize a storage.
   */
  private initialize(diskName = configableDefaultDiskName) {
    this.defaultDisk = getDisk(diskName);

    this.pluginInstances = plugins.map((pluginClass) => {
      const plugin = new pluginClass();
      plugin.init(this.defaultDisk);
      return plugin;
    });
  }

  /**
   * Config for storage methods supported in the application.
   */
  config<U extends DiskConfig = BuitInDiskConfig>(options: StorageConfiguration<U> = {}) {
    const { diskConfigs = [], customDrivers = [] } = options;

    addCustomDriver(customDrivers);
    handleDiskConfigs(diskConfigs);

    this.initialize(configableDefaultDiskName);
  }

  /**
   * Get disk instance by diskName.
   *
   * @param diskName Disk name.
   * @param asStorage Return a storage instance.
   */
  disk<U extends Driver>(diskName: string): U;
  disk(diskName: string, asStorage: true): StorageClass;

  disk(diskName: string, asStorage = false) {
    return asStorage ? new StorageClass(diskName) : getDisk(diskName);
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

  async put(data: Stream | Buffer, path: string): Promise<any> {
    let result: { [x: string]: any } = {};

    const putData = await this.defaultDisk.put(data, path);

    result = Object.assign({}, result, putData);

    for (const plugin of this.pluginInstances) {
      if (plugin.afterPutKey && plugin.afterPut) {
        const afterPutData = await plugin.afterPut(path);
        result[plugin.afterPutKey] = afterPutData;
      }
    }

    return result;
  }

  get(path: string): Stream | Promise<Stream> {
    return this.defaultDisk.get(path);
  }

  delete(path: string): Promise<any> {
    return this.defaultDisk.delete(path);
  }

  makeDir(dir: string): Promise<string> {
    return this.defaultDisk.makeDir(dir);
  }

  removeDir(dir: string): Promise<string> {
    return this.defaultDisk.removeDir(dir);
  }

  uploadImageFromExternalUri(
    uri: string,
    path: string,
    ignoreHeaderContentType = false,
  ): Promise<any> {
    return this.defaultDisk.uploadImageFromExternalUri(uri, path, ignoreHeaderContentType);
  }

  imageStats(path: string) {
    return this.defaultDisk.imageStats(path);
  }
}

export const Storage = new StorageClass();
