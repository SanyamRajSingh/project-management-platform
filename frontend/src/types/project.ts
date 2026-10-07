import { ProjectStatus } from './enums';

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status?: ProjectStatus | string;
  startDate?: string | null;
  endDate?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFilters {
  search?: string;
  status?: ProjectStatus | string;
  page?: number;
  limit?: number;
}
