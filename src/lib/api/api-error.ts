export class ApiError extends Error {
  statusCode: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message: string, statusCode: number, payload?: any) {
    super(message);
    this.statusCode = statusCode;
    this.payload = payload;
  }
}
