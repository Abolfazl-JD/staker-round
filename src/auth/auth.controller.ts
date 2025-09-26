import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  BadReqErrorResponse,
  NotFoundErrorResponse,
  Public,
  UnauthorizedErrorResponse,
} from 'src/common';
import { LoginDto, LoginResponseDto, RegisterDto } from './dto';

@Public()
@Controller('auth')
@ApiBadRequestResponse({
  description: 'body validation error',
  type: BadReqErrorResponse,
})
@ApiCreatedResponse({
  description: "user's access token",
  type: LoginResponseDto,
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<LoginResponseDto> {
    const { access_token } = await this.authService.register(dto);
    return {
      statusCode: HttpStatus.CREATED,
      access_token,
    };
  }

  @ApiNotFoundResponse({
    description: 'User not found',
    type: NotFoundErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
    type: UnauthorizedErrorResponse,
  })
  @Post('login')
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.authService.validateUser(dto);

    const { access_token } = await this.authService.login(user);
    return {
      statusCode: HttpStatus.CREATED,
      access_token,
    };
  }
}
