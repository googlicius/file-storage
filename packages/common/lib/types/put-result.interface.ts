export interface PutResult {
  success: boolean;
  message: string;
  name?: string;
  path: string;
  [x: string]: any;
}
