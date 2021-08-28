import { getExt } from '../dist';
import { getFileName } from './utils';

describe('Common utilities', () => {
  test('getFileName', () => {
    expect(getFileName('file-name.png')).toEqual('file-name.png');
    expect(getFileName('/file-name.png')).toEqual('file-name.png');
    expect(getFileName('path/to/file-name.png')).toEqual('file-name.png');
    expect(getFileName('path/to/file-name.png?v=foo&t=bar')).toEqual('file-name.png');
  });

  test('getExt', () => {
    expect(getExt('path/to/file-name.png')).toEqual('png');
    expect(getExt('path/to/file-name.png?v=foo&t=bar')).toEqual('png');
  });
});
