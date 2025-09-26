export abstract class AbstractErrorResponse {
  abstract statusCode: number;

  message: string;

  abstract error: string;
}
