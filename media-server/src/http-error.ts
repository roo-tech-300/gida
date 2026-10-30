/** Error carrying an HTTP status; @tus/server also understands this shape. */
export class HttpError extends Error {
  readonly status_code: number;
  readonly body: string;

  constructor(status: number, message: string) {
    super(message);
    this.status_code = status;
    this.body = message;
  }
}
