import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsDateString,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ProjectStatus, normalizeProjectStatus } from '../../../shared/enums';

@ValidatorConstraint({ name: 'isStartDateBeforeEndDate', async: false })
export class IsStartDateBeforeEndDateConstraint
  implements ValidatorConstraintInterface
{
  validate(_propertyValue: any, args: ValidationArguments) {
    const obj = args.object as any;
    if (obj.startDate && obj.endDate) {
      return (
        new Date(obj.startDate).getTime() <= new Date(obj.endDate).getTime()
      );
    }
    return true;
  }

  defaultMessage() {
    return 'startDate must be before or equal to endDate';
  }
}

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeProjectStatus(value) ?? value)
  status?: ProjectStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @Validate(IsStartDateBeforeEndDateConstraint)
  endDate?: string;
}
