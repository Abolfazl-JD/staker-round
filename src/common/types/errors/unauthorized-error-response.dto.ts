import { HttpStatus } from '@nestjs/common';
import { AbstractErrorResponse } from './abstract-error.response';

export class UnauthorizedErrorResponse extends AbstractErrorResponse {
  statusCode = HttpStatus.UNAUTHORIZED;

  error = 'Unauthorized';
}
