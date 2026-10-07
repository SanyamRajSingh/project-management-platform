import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TasksService } from '../services/tasks.service';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto } from '../dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { OrgScoped } from '../../../common/decorators/org-scoped.decorator';
import { RequestContext } from '../../../shared/interfaces';
import { AppError } from '../../../shared/errors/app-error';
import { ErrorCodes } from '../../../shared/errors/error-codes';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @OrgScoped()
  @Post('projects/:projectId/tasks')
  async create(
    @CurrentUser() user: RequestContext,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(
      projectId,
      user.organizationId!,
      user.userId,
      dto,
    );
  }

  @OrgScoped()
  @Post('tasks')
  async createDirect(
    @CurrentUser() user: RequestContext,
    @Body() dto: CreateTaskDto,
  ) {
    const projectId = dto.projectId;
    if (!projectId) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'projectId is required to create a task',
        400,
      );
    }
    return this.tasksService.create(
      projectId,
      user.organizationId!,
      user.userId,
      dto,
    );
  }

  @OrgScoped()
  @Get('projects/:projectId/tasks')
  async findByProject(
    @CurrentUser() user: RequestContext,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() filters: TaskFilterDto,
  ) {
    return this.tasksService.findByProject(
      projectId,
      user.organizationId!,
      filters,
    );
  }

  @OrgScoped()
  @Get('tasks')
  async findAll(
    @CurrentUser() user: RequestContext,
    @Query() filters: TaskFilterDto,
  ) {
    return this.tasksService.findAll(user.organizationId!, filters);
  }

  @OrgScoped()
  @Get('tasks/:id')
  async findOne(
    @CurrentUser() user: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasksService.findOne(id, user.organizationId!);
  }

  @OrgScoped()
  @Put('tasks/:id')
  @Patch('tasks/:id')
  async update(
    @CurrentUser() user: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(
      id,
      user.organizationId!,
      user.userId,
      dto,
    );
  }

  @OrgScoped()
  @Delete('tasks/:id')
  async remove(
    @CurrentUser() user: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasksService.remove(
      id,
      user.organizationId!,
      user.userId,
      user.role!,
    );
  }
}
