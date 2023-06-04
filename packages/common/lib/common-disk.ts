import { Stream } from 'stream';
import bent from 'bent';

export abstract class CommonDisk {
  abstract put(stream: Stream, path: string): Promise<any>;

  async uploadImageFromExternalUri(
    uri: string,
    path: string,
    ignoreHeaderContentType = false,
  ): Promise<any> {
    const head = bent('HEAD');
    const get = bent('GET', 200, 'buffer');

    const res = await head(uri);
    if (
      ignoreHeaderContentType ||
      (res.headers['content-type'] && res.headers['content-type'].includes('image'))
    ) {
      const imageBuffer = await get(uri);
      return this.put(imageBuffer, path);
    }

    throw new Error('Not an image: ' + uri);
  }
}
