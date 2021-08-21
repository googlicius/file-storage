export class FileNotFoundError extends Error {
  message = 'File not found';
  code = 'FileNotFound';

  constructor(message?: string) {
    super(message);
    if (message) {
      this.message = message;
    }
  }
}
