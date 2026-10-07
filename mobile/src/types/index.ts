export enum ProjectStatus {
  NOT_STARTED = 'Not Started',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

export enum TaskStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  currentOrganizationId?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status?: ProjectStatus | string;
  startDate?: string | null;
  endDate?: string | null;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus | string;
  priority: TaskPriority | string;
  projectId: string;
  assignedTo?: string | null;
  dueDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  projectsInProgress: number;
}
