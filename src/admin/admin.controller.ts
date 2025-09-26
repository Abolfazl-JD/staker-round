import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Role } from 'src/users/enums';
import { AdminService } from './admin.service';
import {
  BadReqErrorResponse,
  OKBaseResponse,
  Roles,
  RolesGuard,
} from 'src/common';
import { GetSettingsResponseDto, UpdateTaxDto } from './dto';

@UseGuards(RolesGuard)
@Roles(Role.Admin)
@ApiBearerAuth()
@Controller('admin')
@ApiBadRequestResponse({
  description: 'body validation error',
  type: BadReqErrorResponse,
})
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOkResponse({
    description: 'get setting',
    type: GetSettingsResponseDto,
  })
  @Get('settings')
  async getSettings(): Promise<GetSettingsResponseDto> {
    const result = await this.adminService.getSettings();
    return {
      statusCode: HttpStatus.OK,
      result,
    };
  }

  @ApiOkResponse({
    description: 'update tax',
    type: OKBaseResponse,
  })
  @Put('settings/tax')
  async updateTax(@Body() dto: UpdateTaxDto): Promise<OKBaseResponse> {
    await this.adminService.updateTax(dto.taxPercent);
    return {
      statusCode: HttpStatus.OK,
    };
  }
}
