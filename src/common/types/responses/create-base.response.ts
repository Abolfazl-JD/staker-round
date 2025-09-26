import { HttpStatus } from '@nestjs/common';
import { AbstractBaseResponse } from './abstract-base.response';

export class CreateBaseResponse implements AbstractBaseResponse {
  statusCode = HttpStatus.CREATED;
}
