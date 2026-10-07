import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from '../src/modules/tasks/services/tasks.service';
import { TasksRepository } from '../src/modules/tasks/repositories/tasks.repository';
import { ProjectsService } from '../src/modules/projects/services/projects.service';
import { MembershipsService } from '../src/modules/organizations/services/memberships.service';
import { UsersService } from '../src/modules/users/services/users.service';
import { OrganizationsService } from '../src/modules/organizations/services/organizations.service';
import { MailService } from '../src/modules/mail/mail.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskStatus, TaskPriority, Role } from '../src/shared/enums';
import { AppError } from '../src/shared/errors/app-error';

describe('TasksService', () => {
  let service: TasksService;
  let repoMock: any;
  let projectsServiceMock: any;
  let membershipsServiceMock: any;
  let usersServiceMock: any;
  let orgsServiceMock: any;
  let mailServiceMock: any;
  let eventEmitterMock: any;

  beforeEach(async () => {
    repoMock = {
      create: jest.fn().mockImplementation((data) =>
        Promise.resolve({
          id: 'task-1',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      findByProject: jest.fn().mockResolvedValue([
        [
          {
            id: 'task-1',
            title: 'Setup PostgreSQL',
            status: TaskStatus.TODO,
            priority: TaskPriority.HIGH,
            projectId: 'proj-1',
          },
        ],
        1,
      ]),
      findByIdAndOrg: jest.fn().mockImplementation((id: string, orgId: string) => {
        if (id === 'task-1' && orgId === 'org-1') {
          return Promise.resolve({
            id: 'task-1',
            title: 'Setup PostgreSQL',
            status: TaskStatus.TODO,
            priority: TaskPriority.HIGH,
            projectId: 'proj-1',
            organizationId: 'org-1',
            createdBy: 'user-1',
          });
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockResolvedValue(undefined),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };

    projectsServiceMock = {
      findOne: jest.fn().mockResolvedValue({
        id: 'proj-1',
        name: 'Backend infrastructure',
        organizationId: 'org-1',
      }),
    };

    membershipsServiceMock = {
      getMembership: jest.fn().mockImplementation((userId: string, orgId: string) => {
        if (userId === 'user-valid' && orgId === 'org-1') {
          return Promise.resolve({ userId, organizationId: orgId, role: 'member' });
        }
        return Promise.resolve(null);
      }),
    };

    usersServiceMock = {
      findById: jest.fn().mockResolvedValue({
        id: 'user-valid',
        email: 'assignee@example.com',
        firstName: 'Assignee',
      }),
    };

    orgsServiceMock = {
      findById: jest.fn().mockResolvedValue({
        id: 'org-1',
        name: 'Workspace 1',
      }),
    };

    mailServiceMock = {
      sendTaskAssignedEmail: jest.fn().mockResolvedValue(undefined),
    };

    eventEmitterMock = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TasksRepository, useValue: repoMock },
        { provide: ProjectsService, useValue: projectsServiceMock },
        { provide: MembershipsService, useValue: membershipsServiceMock },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: OrganizationsService, useValue: orgsServiceMock },
        { provide: MailService, useValue: mailServiceMock },
        { provide: EventEmitter2, useValue: eventEmitterMock },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('create', () => {
    it('should create task under project with status and priority', async () => {
      const task = await service.create('proj-1', 'org-1', 'user-1', {
        title: 'Build API',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
      });

      expect(task.title).toBe('Build API');
      expect(task.status).toBe(TaskStatus.TODO);
      expect(task.priority).toBe(TaskPriority.HIGH);
      expect(repoMock.create).toHaveBeenCalled();
    });

    it('should validate that assignee belongs to organization', async () => {
      await expect(
        service.create('proj-1', 'org-1', 'user-1', {
          title: 'Build API',
          assignedTo: 'user-not-in-org',
        }),
      ).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('should update task status to completed', async () => {
      const updated = await service.update('task-1', 'org-1', 'user-1', {
        status: TaskStatus.DONE,
      });

      expect(updated.status).toBe(TaskStatus.DONE);
      expect(repoMock.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete task', async () => {
      await service.remove('task-1', 'org-1', 'user-1', Role.MEMBER);
      expect(repoMock.softDelete).toHaveBeenCalledWith('task-1');
    });
  });
});
