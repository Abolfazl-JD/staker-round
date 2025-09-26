import { AbstractErrorResponse } from './abstract-error.response';
import { HttpStatus } from '@nestjs/common';

export class NotFoundErrorResponse extends AbstractErrorResponse {
  statusCode = HttpStatus.NOT_FOUND;

  error = 'Not Found';
}
