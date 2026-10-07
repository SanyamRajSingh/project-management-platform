import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../src/modules/dashboard/services/dashboard.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Project } from '../src/modules/projects/entities/project.entity';
import { Task } from '../src/modules/tasks/entities/task.entity';
import { TaskStatus } from '../src/shared/enums';
import { ProjectStatus } from '../src/shared/enums/project-status.enum';

describe('DashboardService', () => {
  let service: DashboardService;
  let projectRepoMock: any;
  let taskRepoMock: any;

  beforeEach(async () => {
    projectRepoMock = {
      count: jest.fn().mockImplementation((options: any) => {
        if (options?.where?.status === ProjectStatus.IN_PROGRESS) {
          return Promise.resolve(2);
        }
        return Promise.resolve(5);
      }),
    };

    taskRepoMock = {
      count: jest.fn().mockImplementation((options: any) => {
        if (options?.where?.status === TaskStatus.DONE) {
          return Promise.resolve(7);
        }
        if (options?.where?.status === TaskStatus.TODO) {
          return Promise.resolve(3);
        }
        return Promise.resolve(10);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(Project),
          useValue: projectRepoMock,
        },
        {
          provide: getRepositoryToken(Task),
          useValue: taskRepoMock,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate aggregated metrics correctly for an organization', async () => {
    const orgId = 'org-123';
    const stats = await service.getStats(orgId);

    expect(stats).toEqual({
      totalProjects: 5,
      totalTasks: 10,
      completedTasks: 7,
      pendingTasks: 3,
      projectsInProgress: 2,
    });

    expect(projectRepoMock.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ organizationId: orgId }),
    });
    expect(taskRepoMock.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ organizationId: orgId }),
    });
    expect(taskRepoMock.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ organizationId: orgId, status: TaskStatus.DONE }),
    });
    expect(taskRepoMock.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ organizationId: orgId, status: TaskStatus.TODO }),
    });
    expect(projectRepoMock.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ organizationId: orgId, status: ProjectStatus.IN_PROGRESS }),
    });
  });
});
