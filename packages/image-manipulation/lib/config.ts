import { ResizeOptions } from 'sharp';

export interface Breakpoints {
  [x: string]: number;
}

export const DEFAULT_THUBNAIL_RESIZE_OPTIONS: ResizeOptions = {
  width: 245,
  height: 156,
  fit: 'inside',
};

export const DEFAULT_BREAKPOINTS: Breakpoints = {
  large: 1000,
  medium: 750,
  small: 500,
};

class ImageManipulationConfig {
  private thumbnailResizeOptions: ResizeOptions = DEFAULT_THUBNAIL_RESIZE_OPTIONS;

  private breakpoints: Breakpoints = DEFAULT_BREAKPOINTS;

  getThumbnailResizeOptions(): ResizeOptions {
    return this.thumbnailResizeOptions;
  }

  setThumbnailResizeOptions(options: ResizeOptions) {
    this.thumbnailResizeOptions = options;
  }

  getBreakpoints(): Breakpoints {
    return this.breakpoints;
  }

  setBreakpoints(newBreakpoints: Breakpoints) {
    this.breakpoints = newBreakpoints;
  }
}

export const config = new ImageManipulationConfig();
