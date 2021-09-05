export class MoveFailedError extends Error {
  message = 'File move failed.';
  code = 'MoveFailed';

  constructor(message?: string) {
    super(message);
    if (message) {
      this.message = message;
    }
  }
}
