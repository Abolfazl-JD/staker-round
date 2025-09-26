import { CreateBaseResponse } from 'src/common/types';

export class LoginResponseDto extends CreateBaseResponse {
  access_token: string;
}
