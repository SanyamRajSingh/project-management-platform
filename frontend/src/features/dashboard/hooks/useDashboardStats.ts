'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi, type DashboardStats } from '@/lib/api/dashboard.api';
import { useOrgWorkspaceContext } from '@/features/organizations/hooks/useOrgWorkspaceContext';

export const dashboardKeys = {
  stats: ['dashboard', 'stats'] as const,
};

export function useDashboardStats() {
  const { hasValidOrgContext } = useOrgWorkspaceContext();

  return useQuery<DashboardStats>({
    queryKey: dashboardKeys.stats,
    queryFn: async () => {
      const res = await dashboardApi.getStats();
      return res.data?.data ?? {
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        projectsInProgress: 0,
      };
    },
    enabled: hasValidOrgContext,
  });
}
