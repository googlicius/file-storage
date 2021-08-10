import {
  DiskConfig,
  Driver,
  Disk,
  DriverDiskMap,
  requireDefaultModule,
} from '@file-storage/common';
import { BuitInDiskConfig, StorageConfiguration } from './types';

const S3Disk = requireDefaultModule('@file-storage/s3');
const LocalDisk = requireDefaultModule('@file-storage/local');
const SftpDisk = requireDefaultModule('@file-storage/sftp');

let configableDefaultDiskName = 'local';
let defaultStorage: Storage;
let availableDisks: (DiskConfig | BuitInDiskConfig)[] = [];

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
    availableDisks.push({
      driver: Driver.LOCAL,
      name: 'local',
      root: 'storage',
      isDefault: true,
    });
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

  defaultStorage = new Storage();
}

function addCustomDriver(map: DriverDiskMap[] = []) {
  if (map.length > 0) {
    driverDiskMaps.push(...map);
  }
}

/**
 * `Storage` provides a filesystem abstraction, simple way to uses drivers for working with local filesystems, Amazon S3,...
 */
export class Storage {
  private readonly disk: Disk;
  private static initAble = false;

  constructor(diskName: string = configableDefaultDiskName) {
    if (!Storage.initAble) {
      throw new Error(
        'Cannot instantialize this class, it serves as an entry point of this library.',
      );
    }
    Storage.initAble = false;
    const diskConfig = availableDisks.find((item) => item.name === diskName);

    if (!diskConfig) {
      throw new Error(`Given disk is not defined: ${diskName}`);
    }

    const driverDiskMap = driverDiskMaps.find((item) => item.name === diskConfig.driver);

    if (!driverDiskMap) {
      throw new Error(`Driver '${diskConfig.driver}' is not declared.`);
    }

    try {
      this.disk = new driverDiskMap.disk(diskConfig);
    } catch (error) {
      throw new Error(
        `Please install \`@file-storage/${diskConfig.driver}\` for ${diskConfig.driver} driver`,
      );
    }
  }

  /**
   * Config for storage methods supported in the application.
   */
  static config<U extends DiskConfig = BuitInDiskConfig>(options: StorageConfiguration<U> = {}) {
    const { diskConfigs = [], customDrivers = [] } = options;

    Storage.initAble = true;
    addCustomDriver(customDrivers);
    handleDiskConfigs(diskConfigs);
  }

  /**
   * Get disk instance by diskName.
   */
  static disk<U extends Disk>(diskName: string): U {
    Storage.initAble = true;
    const storage = new Storage(diskName);
    return storage.disk as U;
  }

  /**
   * Get default disk instance.
   */
  static get defaultDisk(): Disk {
    return defaultStorage.disk;
  }
}
