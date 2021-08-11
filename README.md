```
 ____|_) |       ___|  |
 |     | |  _ \\___ \  __|  _ \   __| _` |  _` |  _ \
 __|   | |  __/      | |   (   | |   (   | (   |  __/
_|    _|_|\___|_____/ \__|\___/ _|  \__,_|\__, |\___|
A file system abstraction for Node.js     |___/
```

A simple abstraction for interact with file system inspired by [Laravel File System](https://laravel.com/docs/8.x/filesystem), provides one interface for many kind of drivers: `local`, `ftp`, `sftp`, `Amazon S3`, and `Google Cloud Storage`, even your custom driver.

## Intallation

```bash
yarn add @file-storage/core

# Or npm

npm install @file-storage/core
```

And upload a file to local, it will be stored in `storage` folder in your root project directory by default:

```javascript
import Storage from '@file-storage/core';

// Upload from file path.
Storage.put('/my-image.png', '/path/of/destination/my-image.png');

// Or from a read-stream/buffer:
Storage.put(stream, '/path/of/destination/my-image.png');
```

## Configuration

By default only local driver is supported, if you want to use another driver, you need to install corresponding package:

- Amazon S3: `yarn add @file-storage/s3`
- FTP: `yarn add @file-storage/ftp`
- SFTP: `yarn add @file-storage/sftp`
- Google Cloud Storage: `yarn add @file-storage/gcs`

With no configuration, it will uploads to local disk. You can specific yours by using `config` method:

```javascript
import Storage from '@file-storage/core';
import { Driver } from '@file-storage/common';

Storage.config({
  diskConfigs: [
    {
      driver: Driver.LOCAL,
      name: 'local',
      root: 'public',
    },
    {
      driver: Driver.S3,
      name: 'mys3',
      bucketName: 'mybucket',
      isDefault: true, // Default disk that you can access directly via Storage facade.
      // Uncomment if you want specify credentials manually.
      // region: 'ap-southeast-1',
      // credentials: {
      //   accessKeyId: '123abc',
      //   secretAccessKey: '123abc',
      // },
    },
  ],
});

// Somewhere in your code...
// Get file from s3:
Storage.get('/path/to/s3-bucket/my-image.png');
```

## Obtain disk instance:

If you want to interact with a specific disk instead of the default, use `disk` method to get that disk instance:

```javascript
Storage.disk('local').get('/path/to/local/my-image.png');
```

## Your custom driver

If you want another storage, just defines a custom disk by implement `Disk` interface:

```typescript
import Storage from '@file-storage/core';
import { Disk } from '@file-storage/common';

class OneDriveDisk implement Disk {
  // Fill all Disk's properties and methods.
}

// And provide it to Storage config:
Storage.config({
  diskConfigs: [
    {
      driver: 'oneDriver',
      name: 'myCustomDisk',
      isDefault: true,
      ...
    }
  ],
  customDrivers: [
    {
      name: 'oneDriver',
      disk: OneDriveDisk,
    },
  ],
});
```

## TODO

- Create interface for all result (Need same result format for all drivers).
- Refactor `customDrivers` option: provides disk is enough.
- Implement GCS disk.
- API section: detailed of each driver.

## License

MIT
