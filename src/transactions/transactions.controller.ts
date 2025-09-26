import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotAcceptableResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Transaction } from './entities/transaction.entity';
import {
  CreateTransactionDto,
  CreateTransactionResponseDto,
  GetTransactionsResponseDto,
  UpdateTransactionStatusDto,
} from './dto';
import {
  BadReqErrorResponse,
  NotAcceptableErrorResponse,
  NotFoundErrorResponse,
  OKBaseResponse,
  UnprocessableEntityErrorResponse,
} from 'src/common/types';
import { ExcludeFieldsInterceptor, Roles, RolesGuard, User } from 'src/common';
import { Status } from './enums';
import { Role } from 'src/users/enums';

@ApiBearerAuth()
@Controller('transactions')
@ApiBadRequestResponse({
  description: 'body validation error',
  type: BadReqErrorResponse,
})
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @UseInterceptors(
    new ExcludeFieldsInterceptor<Transaction>([
      'modifierAdminId',
      'modifierAdmin',
    ]),
  )
  @ApiCreatedResponse({
    description: 'transaction created successfully',
    type: CreateTransactionResponseDto,
  })
  @ApiNotAcceptableResponse({
    description: 'User already has a pending transaction',
    type: NotAcceptableErrorResponse,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Insufficient balance',
    type: UnprocessableEntityErrorResponse,
  })
  @Post()
  async create(
    @User('id') userId: number,
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<CreateTransactionResponseDto> {
    const result = await this.transactionsService.create(
      userId,
      createTransactionDto,
    );
    return {
      statusCode: HttpStatus.CREATED,
      result,
    };
  }

  @ApiQuery({
    name: 'status',
    enum: Status,
    default: Status.PENDING,
    required: false,
  })
  @ApiOkResponse({
    description: 'transactions retrieved successfully',
    type: GetTransactionsResponseDto,
  })
  @UseInterceptors(
    new ExcludeFieldsInterceptor<Transaction>([
      'modifierAdminId',
      'modifierAdmin',
    ]),
  )
  @Get('history')
  async getHistory(
    @Query('status') status: Status,
    @User('id') userId: number,
  ): Promise<GetTransactionsResponseDto> {
    const result = await this.transactionsService.getUserTransactions(
      userId,
      status || Status.PENDING,
    );

    return {
      statusCode: HttpStatus.OK,
      result,
      total: result.length,
    };
  }

  @ApiQuery({
    name: 'status',
    enum: Status,
    default: Status.PENDING,
    required: false,
  })
  @ApiOkResponse({
    description: 'transactions retrieved successfully',
    type: GetTransactionsResponseDto,
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @Get('all')
  async getAllTransactions(
    @Query('status') status: Status,
  ): Promise<GetTransactionsResponseDto> {
    const result = await this.transactionsService.getAllTransactions(
      status || Status.PENDING,
    );

    return {
      statusCode: HttpStatus.OK,
      result,
      total: result.length,
    };
  }

  @ApiParam({
    name: 'transactionId',
    type: 'number',
    required: true,
    example: 1,
  })
  @ApiOkResponse({
    description: 'Transaction updated successfully',
    type: OKBaseResponse,
  })
  @ApiNotFoundResponse({
    description: 'Transaction not found',
    type: NotFoundErrorResponse,
  })
  @ApiNotAcceptableResponse({
    description: 'Transaction is not pending',
    type: NotAcceptableErrorResponse,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Transaction type is not valid',
    type: UnprocessableEntityErrorResponse,
  })
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @Post(':transactionId')
  async updateTransactionStatus(
    @Body() dto: UpdateTransactionStatusDto,
    @Param('transactionId') transactionId: number,
    @User('id') modifierAdminId: number,
  ): Promise<OKBaseResponse> {
    await this.transactionsService.updateTransactionStatus(
      dto,
      transactionId,
      modifierAdminId,
    );
    return {
      statusCode: HttpStatus.OK,
    };
  }
}
