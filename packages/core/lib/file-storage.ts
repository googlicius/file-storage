import { Stream } from 'stream';
import {
  DiskConfig,
  DriverName,
  Driver,
  requireDefaultModule,
  LocalDiskConfig,
  Class,
  Plugin,
  PutResult,
  getFileName,
  ImageStats,
} from '@file-storage/common';
import LocalDriver from '@file-storage/local';
import { BuiltInDiskConfig, StorageConfiguration } from './types';
import { v4 as uuidv4 } from 'uuid';
import { parse, format } from 'path';

const defaultDiskConfig: LocalDiskConfig = {
  driver: DriverName.LOCAL,
  name: 'local',
  root: 'storage',
};

const drivers: Class<Driver>[] = [
  LocalDriver,
  // TODO Should remove all requires since drivers provided as their corresponding driver class from now on.
  requireDefaultModule('@file-storage/s3'),
  requireDefaultModule('@file-storage/ftp'),
  requireDefaultModule('@file-storage/sftp'),
  requireDefaultModule('@file-storage/gcs'),
].filter((item) => !!item);

function handleDiskConfigs(diskConfigs: DiskConfig[]) {
  const seen = new Set();
  const availableDisks: (DiskConfig | BuiltInDiskConfig)[] = [];

  const hasDuplicatesName = () =>
    diskConfigs.some((diskConfig) => seen.size === seen.add(diskConfig.name).size);

  if (hasDuplicatesName()) {
    throw new Error('Duplicated disk name.');
  }

  if (diskConfigs.length > 0) {
    availableDisks.push(...diskConfigs);
  } else {
    availableDisks.push(defaultDiskConfig);
  }

  return availableDisks;
}

function driverNotLoaded(driver: Class<Driver>): boolean {
  return !drivers.find((item) => item.name === driver.name);
}

export class StorageClass {
  private availableDisks: (DiskConfig | BuiltInDiskConfig)[] = [defaultDiskConfig];

  private plugins: Class<Plugin>[] = [];

  /**
   * Get default disk instance.
   */
  private defaultDisk: Driver;

  /**
   * All plugin instances.
   */
  private pluginInstances: Plugin[];

  private uniqueFileName = false;

  constructor() {
    this.config();
  }

  get name() {
    return this.defaultDisk.name;
  }

  private getDriversFromAvailableDisks(): Class<Driver>[] {
    return this.availableDisks
      .filter((disk) => typeof disk.driver !== 'string' && driverNotLoaded(disk.driver))
      .map((disk) => disk.driver as Class<Driver>);
  }

  /**
   * Config for storage methods supported in the application.
   */
  config<U extends DiskConfig>(options: StorageConfiguration<U> = {}) {
    const { diskConfigs, uniqueFileName } = options;
    let { defaultDiskName } = options;

    if (typeof diskConfigs !== 'undefined') {
      this.availableDisks = handleDiskConfigs(diskConfigs);
    }

    drivers.push(...this.getDriversFromAvailableDisks());

    if (options.plugins && options.plugins.length > 0) {
      this.plugins = options.plugins;
    }

    if (!defaultDiskName) {
      if (this.availableDisks.length > 1) {
        throw new Error('Please specify a default disk name.');
      }
      defaultDiskName = this.availableDisks[0].name;
    }

    if (typeof uniqueFileName !== 'undefined') {
      this.uniqueFileName = uniqueFileName;
    }

    this.defaultDisk = this.getDisk(defaultDiskName);

    this.pluginInstances = this.plugins.map((pluginClass) => {
      const plugin = new pluginClass();
      plugin.init(this.defaultDisk);
      return plugin;
    });
  }

  private getDisk<U extends Driver>(diskName: string): U {
    const diskConfig = this.availableDisks.find((item) => item.name === diskName);

    if (!diskConfig) {
      throw new Error(`Given disk is not defined: ${diskName}`);
    }

    const driver: Class<Driver> =
      typeof diskConfig.driver !== 'string'
        ? diskConfig.driver
        : drivers.find((item) => item['driverName'] === diskConfig.driver);

    if (!driver) {
      // Throw error missing built-in driver package.
      if ((<any>Object).values(DriverName).includes(diskConfig.driver)) {
        throw new Error(
          `Please install \`@file-storage/${diskConfig.driver}\` for ${diskConfig.driver} driver`,
        );
      }
      const name =
        typeof diskConfig.driver !== 'string' ? diskConfig.driver.name : diskConfig.driver;
      throw new Error(`Driver '${name}' is not declared.`);
    }

    return new driver(diskConfig) as U;
  }

  /**
   * Get current disk instance.
   */
  instance<U extends Driver>(): U {
    return this.defaultDisk as U;
  }

  /**
   * Get StorageClass instance by diskName.
   *
   * @param diskName Disk name.
   * @param options Adjust default settings on the fly.
   */
  disk(diskName: string): StorageClass;
  disk<U extends DiskConfig>(options: StorageConfiguration<U>): StorageClass;
  disk<U extends DiskConfig>(diskName: string, options: StorageConfiguration<U>): StorageClass;
  disk<U extends DiskConfig>(
    diskNameOrOptions: string | StorageConfiguration<U>,
    options?: StorageConfiguration<U>,
  ): StorageClass {
    options = typeof diskNameOrOptions === 'string' ? options : diskNameOrOptions;

    const storage: StorageClass = Object.assign(new StorageClass(), this);

    const diskName =
      typeof diskNameOrOptions === 'string'
        ? diskNameOrOptions
        : options.defaultDiskName || this.name;

    storage.config({
      ...options,
      defaultDiskName: diskName,
    });

    return storage;
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

  async put(data: Stream | Buffer, path: string): Promise<PutResult> {
    let result: PutResult = {
      success: true,
      message: 'Uploading success',
      name: getFileName(path),
      path,
    };

    if (this.uniqueFileName) {
      const parsedPath = parse(path);
      parsedPath.base = uuidv4() + parsedPath.ext;
      result.path = format(parsedPath);
    }

    const putData = await this.defaultDisk.put(data, result.path);

    result = Object.assign({}, result, putData);

    for (const plugin of this.pluginInstances || []) {
      if (plugin.afterPutKey && plugin.afterPut) {
        const afterPutData = await plugin.afterPut(result.path);
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

  copy(path: string, newPath: string): Promise<void> {
    return this.defaultDisk.copy(path, newPath);
  }

  move(path: string, newPath: string) {
    return this.defaultDisk.move(path, newPath);
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

  imageStats(path: string, keepBuffer: true): Promise<ImageStats & { buffer: Buffer }>;
  imageStats(path: string, keepBuffer?: boolean): Promise<ImageStats>;

  imageStats(path: string, keepBuffer = false) {
    return this.defaultDisk.imageStats(path, keepBuffer);
  }
}

/**
 * `Storage` provides a filesystem abstraction, simple way to uses drivers for working with local filesystems, Amazon S3,...
 */
export const Storage = new StorageClass();
