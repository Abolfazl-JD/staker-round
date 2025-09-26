import { HttpStatus } from '@nestjs/common';
import { AbstractErrorResponse } from './abstract-error.response';

export class UnprocessableEntityErrorResponse extends AbstractErrorResponse {
  statusCode = HttpStatus.UNPROCESSABLE_ENTITY;

  error = 'Unprocessable Entity';
}
