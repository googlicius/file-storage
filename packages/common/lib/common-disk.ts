import { Stream } from 'stream';

const request = require('request');

export abstract class CommonDisk {
  abstract put(stream: Stream, path: string): Promise<any>;

  uploadImageFromExternalUri(
    uri: string,
    path: string,
    ignoreHeaderContentType = false,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      request.head(uri, async (err: any, res: any) => {
        if (err) {
          reject(err);
        }
        if (
          ignoreHeaderContentType ||
          (res && res.headers['content-type'] && res.headers['content-type'].match(/image/))
        ) {
          try {
            const data = await this.put(request(uri), path);
            resolve(data);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('Not an image: ' + uri));
        }
      });
    });
  }
}
