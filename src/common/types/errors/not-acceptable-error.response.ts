import { HttpStatus } from '@nestjs/common';
import { AbstractErrorResponse } from './abstract-error.response';

export class NotAcceptableErrorResponse extends AbstractErrorResponse {
  statusCode = HttpStatus.NOT_ACCEPTABLE;

  error = 'Not Acceptable';
}
