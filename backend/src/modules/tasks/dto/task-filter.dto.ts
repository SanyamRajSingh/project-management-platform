import {
  IsOptional,
  IsUUID,
  IsDateString,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../shared/dto/pagination.dto';
import {
  TaskStatus,
  TaskPriority,
  normalizeTaskStatus,
  normalizeTaskPriority,
} from '../../../shared/enums';

export class TaskFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  search?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeTaskStatus(value) ?? value)
  status?: TaskStatus;

  @IsOptional()
  @Transform(({ value }) => normalizeTaskPriority(value) ?? value)
  priority?: TaskPriority;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @IsOptional()
  @IsDateString()
  dueBefore?: string;

  @IsOptional()
  @IsDateString()
  dueAfter?: string;
}
