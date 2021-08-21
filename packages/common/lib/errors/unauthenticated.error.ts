export class UnauthenticatedError extends Error {
  code = 'Unauthenticated';
  message = 'Unauthenticated';

  constructor(message?: string) {
    super();
    if (message) {
      this.message = message;
    }
  }
}
