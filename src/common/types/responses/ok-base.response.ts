import { HttpStatus } from '@nestjs/common';
import { AbstractBaseResponse } from './abstract-base.response';

export class OKBaseResponse implements AbstractBaseResponse {
  statusCode = HttpStatus.OK;
}
