import {
  Body,
  Controller,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { RoundsService } from './rounds.service';
import { SetProfitRateDto } from './dto';
import {
  BadReqErrorResponse,
  OKBaseResponse,
  Roles,
  RolesGuard,
  User,
} from 'src/common';
import { Role } from 'src/users/enums';

@ApiBearerAuth()
@Controller('rounds')
@ApiBadRequestResponse({
  description: 'body validation error',
  type: BadReqErrorResponse,
})
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  @ApiParam({
    name: 'roundId',
    type: 'number',
    required: true,
    example: 1,
  })
  @ApiOkResponse({
    description: "round's profit rate has been updated",
  })
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @Post(':roundId')
  async setProfitRate(
    @Param('roundId') roundId: number,
    @Body() body: SetProfitRateDto,
    @User('id') adminId: number,
  ): Promise<OKBaseResponse> {
    await this.roundsService.setProfitRate(
      roundId,
      body.profitRatePencent,
      adminId,
    );
    return {
      statusCode: HttpStatus.OK,
    };
  }
}
