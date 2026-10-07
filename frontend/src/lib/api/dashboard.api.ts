import { apiClient } from './client';
import { normalizeError } from './errors';
import type { ApiResponse } from '@/types';

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  projectsInProgress: number;
}

export const dashboardApi = {
  getStats() {
    return apiClient.get<ApiResponse<DashboardStats>>('/dashboard')
      .catch(normalizeError);
  },
};
