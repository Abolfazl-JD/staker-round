import { Settings } from 'src/admin/entities/settings.entity';
import { OKBaseResponse } from 'src/common/types';

export class GetSettingsResponseDto extends OKBaseResponse {
  result: Settings;
}
