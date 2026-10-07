import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from '../src/modules/projects/services/projects.service';
import { ProjectsRepository } from '../src/modules/projects/repositories/projects.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectStatus } from '../src/shared/enums/project-status.enum';
import { Role } from '../src/shared/enums';
import { AppError } from '../src/shared/errors/app-error';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repoMock: any;
  let eventEmitterMock: any;

  beforeEach(async () => {
    repoMock = {
      create: jest.fn().mockImplementation((data) =>
        Promise.resolve({
          id: 'proj-1',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      findByOrg: jest.fn().mockResolvedValue([
        [
          {
            id: 'proj-1',
            name: 'API Redesign',
            status: ProjectStatus.IN_PROGRESS,
            startDate: new Date('2026-10-01'),
            endDate: new Date('2026-10-31'),
          },
        ],
        1,
      ]),
      findByIdAndOrg: jest.fn().mockImplementation((id: string, orgId: string) => {
        if (id === 'proj-1' && orgId === 'org-1') {
          return Promise.resolve({
            id: 'proj-1',
            name: 'API Redesign',
            createdBy: 'user-creator',
            organizationId: 'org-1',
            status: ProjectStatus.IN_PROGRESS,
          });
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockResolvedValue(undefined),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };

    eventEmitterMock = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: ProjectsRepository, useValue: repoMock },
        { provide: EventEmitter2, useValue: eventEmitterMock },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  describe('create', () => {
    it('should create project with status and dates', async () => {
      const dto = {
        name: 'Mobile App',
        description: 'Android implementation',
        status: ProjectStatus.NOT_STARTED,
        startDate: '2026-10-01',
        endDate: '2026-10-20',
      };

      const result = await service.create('org-1', 'user-1', dto);

      expect(result.name).toBe('Mobile App');
      expect(result.status).toBe(ProjectStatus.NOT_STARTED);
      expect(repoMock.create).toHaveBeenCalled();
      expect(eventEmitterMock.emit).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should pass status and search filters to repository', async () => {
      const result = await service.findAll('org-1', {
        page: 1,
        limit: 10,
        search: 'API',
        status: 'In Progress',
      });

      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
      expect(repoMock.findByOrg).toHaveBeenCalledWith(
        'org-1',
        1,
        10,
        'API',
        'In Progress',
      );
    });
  });

  describe('ownership & permissions', () => {
    it('should allow project creator to update', async () => {
      const updated = await service.update(
        'proj-1',
        'org-1',
        'user-creator',
        Role.MEMBER,
        { name: 'Updated Name' },
      );

      expect(updated.name).toBe('Updated Name');
      expect(repoMock.update).toHaveBeenCalled();
    });

    it('should allow admin to update any project', async () => {
      const updated = await service.update(
        'proj-1',
        'org-1',
        'other-user',
        Role.ADMIN,
        { name: 'Admin Updated' },
      );

      expect(updated.name).toBe('Admin Updated');
      expect(repoMock.update).toHaveBeenCalled();
    });

    it('should reject non-creator member from updating project', async () => {
      await expect(
        service.update('proj-1', 'org-1', 'other-member', Role.MEMBER, {
          name: 'Hacked Name',
        }),
      ).rejects.toThrow(AppError);
    });
  });
});
