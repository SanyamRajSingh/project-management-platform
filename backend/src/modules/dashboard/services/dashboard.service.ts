import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Task } from '../../tasks/entities/task.entity';
import { ProjectStatus, TaskStatus } from '../../../shared/enums';
import { DashboardResponseDto } from '../dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  async getStats(organizationId: string): Promise<DashboardResponseDto> {
    const [totalProjects, projectsInProgress] = await Promise.all([
      this.projectRepo.count({
        where: { organizationId, deletedAt: IsNull() },
      }),
      this.projectRepo.count({
        where: {
          organizationId,
          status: ProjectStatus.IN_PROGRESS,
          deletedAt: IsNull(),
        },
      }),
    ]);

    const [totalTasks, completedTasks, pendingTasks] = await Promise.all([
      this.taskRepo.count({
        where: { organizationId, deletedAt: IsNull() },
      }),
      this.taskRepo.count({
        where: {
          organizationId,
          status: TaskStatus.DONE,
          deletedAt: IsNull(),
        },
      }),
      this.taskRepo.count({
        where: {
          organizationId,
          status: TaskStatus.TODO,
          deletedAt: IsNull(),
        },
      }),
    ]);

    return {
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      projectsInProgress,
    };
  }
}
