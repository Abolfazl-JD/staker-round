import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
import { LoginDto, RegisterDto } from './dto';
import { isNil, isNotNil } from 'src/common';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.usersService.findByEmail(email);
    if (isNil(user)) throw new NotFoundException('User not found');

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async login(user: User) {
    const payload = { sub: user.id, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }

  async register(dto: RegisterDto) {
    const { email, password } = dto;

    const existing = await this.usersService.findByEmail(email);
    if (isNotNil(existing))
      throw new UnauthorizedException('Email already exists');

    const hash = await bcrypt.hash(password, 10);
    const created = await this.usersService.createUser(email, hash);

    return this.login(created);
  }
}
