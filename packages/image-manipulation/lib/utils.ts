import { dirname } from 'path';
import sharp from 'sharp';
import { FileStats } from './types';

interface Dimension {
  width: number;
  height: number;
}

const settings = {
  sizeOptimization: true,
  autoOrientation: true,
};

const getMetadatas = (buffer: Buffer): Promise<sharp.Metadata> =>
  sharp(buffer)
    .metadata()
    .catch(() => null);

const getDimensions = (buffer: Buffer): Promise<Dimension> =>
  getMetadatas(buffer).then(({ width = null, height = null }) => ({ width, height }));

const THUMBNAIL_RESIZE_OPTIONS = {
  width: 245,
  height: 156,
  fit: 'inside',
};

const DEFAULT_BREAKPOINTS = {
  large: 1000,
  medium: 750,
  small: 500,
};

const resizeTo = (buffer: Buffer, options: any) =>
  sharp(buffer)
    .withMetadata()
    .resize(options)
    .toBuffer()
    .catch(() => null);

const generateThumbnail = async (file: FileStats): Promise<FileStats> => {
  if (!(await canBeProccessed(file.buffer))) {
    return null;
  }

  const { width, height } = await getDimensions(file.buffer);

  if (width > THUMBNAIL_RESIZE_OPTIONS.width || height > THUMBNAIL_RESIZE_OPTIONS.height) {
    const newBuff = await resizeTo(file.buffer, THUMBNAIL_RESIZE_OPTIONS);

    if (newBuff) {
      const { width, height, size } = await getMetadatas(newBuff);
      const thumbnailName = `thumbnail_${file.name}`;

      return {
        name: thumbnailName,
        hash: null,
        ext: file.ext,
        mime: file.mime,
        width,
        height,
        size: bytesToKbytes(size),
        buffer: newBuff,
        path: `${dirname(file.path)}/${thumbnailName}`,
      };
    }
  }

  return null;
};

const optimize = async (buffer: Buffer) => {
  const { sizeOptimization = false, autoOrientation = false } = settings;

  if (!sizeOptimization || !(await canBeProccessed(buffer))) {
    return { buffer };
  }

  const sharpInstance = autoOrientation ? sharp(buffer).rotate() : sharp(buffer);

  return sharpInstance
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      const output = buffer.length < data.length ? buffer : data;

      return {
        buffer: output,
        info: {
          width: info.width,
          height: info.height,
          size: bytesToKbytes(output.length),
        },
      };
    })
    .catch(() => ({ buffer }));
};

const getBreakpoints = () => DEFAULT_BREAKPOINTS;

const generateResponsiveFormats = async (file: FileStats) => {
  if (!(await canBeProccessed(file.buffer))) {
    return [];
  }

  const originalDimensions = await getDimensions(file.buffer);

  const breakpoints = getBreakpoints();
  return Promise.all(
    Object.keys(breakpoints).map((key) => {
      const breakpoint: number = breakpoints[key];

      if (breakpointSmallerThan(breakpoint, originalDimensions)) {
        return generateBreakpoint(key, { file, breakpoint });
      }
    }),
  );
};

interface GenerateBreakpointOptions {
  file: FileStats;
  breakpoint: number;
}

const generateBreakpoint = async (
  key: string,
  { file, breakpoint }: GenerateBreakpointOptions,
): Promise<{ key: string; file: FileStats }> => {
  const newBuff = await resizeTo(file.buffer, {
    width: breakpoint,
    height: breakpoint,
    fit: 'inside',
  });

  if (newBuff) {
    const { width, height, size } = await getMetadatas(newBuff);
    const name = `${key}_${file.name}`;

    return {
      key,
      file: {
        name,
        hash: null,
        ext: file.ext,
        mime: file.mime,
        width,
        height,
        size: bytesToKbytes(size),
        buffer: newBuff,
        path: `${dirname(file.path)}/${name}`,
      },
    };
  }
};

const breakpointSmallerThan = (breakpoint: number, { width, height }: Dimension) => {
  return breakpoint < width || breakpoint < height;
};

const formatsToProccess = ['jpeg', 'png', 'webp', 'tiff'];
const canBeProccessed = async (buffer: Buffer) => {
  const { format } = await getMetadatas(buffer);
  return format && formatsToProccess.includes(format);
};

const bytesToKbytes = (bytes: number) => Math.round((bytes / 1000) * 100) / 100;

export { generateThumbnail, generateResponsiveFormats, optimize };
