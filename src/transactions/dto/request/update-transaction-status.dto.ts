import { IsEnum, IsNotEmpty } from 'class-validator';
import { Status } from '../../enums';

export class UpdateTransactionStatusDto {
  /**
   * @example "APPROVED"
   **/
  @IsEnum([Status.APPROVED, Status.REJECTED])
  @IsNotEmpty()
  newStatus: Status.APPROVED | Status.REJECTED;
}
