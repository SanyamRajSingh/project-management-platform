import { apiClient } from './client';
import { normalizeError } from './errors';
import type { ApiResponse, Project, PaginationParams } from '@/types';

export interface CreateProjectPayload {
  name: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export type UpdateProjectPayload = Partial<CreateProjectPayload>;

export interface ListProjectsParams extends PaginationParams {
  search?: string;
  status?: string;
}

export const projectsApi = {
  create(payload: CreateProjectPayload) {
    return apiClient.post<ApiResponse<Project>>('/projects', payload)
      .catch(normalizeError);
  },

  list(params?: ListProjectsParams) {
    return apiClient.get<ApiResponse<Project[]>>('/projects', { params })
      .catch(normalizeError);
  },

  getById(id: string) {
    return apiClient.get<ApiResponse<Project>>(`/projects/${id}`)
      .catch(normalizeError);
  },

  update(id: string, payload: UpdateProjectPayload) {
    return apiClient.patch<ApiResponse<Project>>(`/projects/${id}`, payload)
      .catch(normalizeError);
  },

  delete(id: string) {
    return apiClient.delete<ApiResponse<void>>(`/projects/${id}`)
      .catch(normalizeError);
  },
};
