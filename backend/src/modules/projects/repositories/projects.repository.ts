import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { normalizeProjectStatus } from '../../../shared/enums';

@Injectable()
export class ProjectsRepository {
  constructor(
    @InjectRepository(Project)
    private readonly repo: Repository<Project>,
  ) {}

  async create(data: Partial<Project>): Promise<Project> {
    const project = this.repo.create(data);
    return this.repo.save(project);
  }

  async findByIdAndOrg(
    id: string,
    organizationId: string,
  ): Promise<Project | null> {
    return this.repo.findOne({ where: { id, organizationId } });
  }

  async findByOrg(
    organizationId: string,
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ): Promise<[Project[], number]> {
    const normalizedStatus = normalizeProjectStatus(status) ?? status;
    const where: Record<string, unknown>[] = search
      ? [
          {
            organizationId,
            ...(normalizedStatus ? { status: normalizedStatus } : {}),
            name: ILike(`%${search}%`),
          },
          {
            organizationId,
            ...(normalizedStatus ? { status: normalizedStatus } : {}),
            description: ILike(`%${search}%`),
          },
        ]
      : [
          {
            organizationId,
            ...(normalizedStatus ? { status: normalizedStatus } : {}),
          },
        ];

    return this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async update(id: string, data: Partial<Project>): Promise<void> {
    await this.repo.update(id, data);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
