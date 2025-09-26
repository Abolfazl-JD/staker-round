import { HttpStatus } from '@nestjs/common';
import { AbstractErrorResponse } from './abstract-error.response';

export class BadReqErrorResponse extends AbstractErrorResponse {
  statusCode = HttpStatus.BAD_REQUEST;

  error = 'Bad request';
}
