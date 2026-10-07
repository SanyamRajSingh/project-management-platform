import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  TaskStatus,
  TaskPriority,
  normalizeTaskStatus,
  normalizeTaskPriority,
} from '../../../shared/enums';

export class CreateTaskDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  /** Supports 'title' or assignment-facing 'name' */
  @ValidateIf((o) => !o.name)
  @IsString()
  @MaxLength(300)
  title?: string;

  @ValidateIf((o) => !o.title)
  @IsString()
  @MaxLength(300)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

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
  dueDate?: string;
}
