import { TaskStatus } from './task-status.enum';
import { TaskPriority } from './task-priority.enum';
import { ProjectStatus } from './project-status.enum';

/**
 * Normalizes input status to internal TaskStatus enum ('todo', 'in_progress', 'done').
 * Accepts: 'Pending', 'In Progress', 'Completed', 'todo', 'in_progress', 'done'.
 */
export function normalizeTaskStatus(val?: string | null): TaskStatus | undefined {
  if (!val) return undefined;
  const lower = val.trim().toLowerCase().replace(/\s+/g, '_');
  switch (lower) {
    case 'pending':
    case 'todo':
      return TaskStatus.TODO;
    case 'in_progress':
      return TaskStatus.IN_PROGRESS;
    case 'completed':
    case 'done':
      return TaskStatus.DONE;
    default:
      return Object.values(TaskStatus).includes(val as TaskStatus)
        ? (val as TaskStatus)
        : undefined;
  }
}

/**
 * Formats internal TaskStatus to assignment-facing status label.
 */
export function formatTaskStatusLabel(status: TaskStatus | string): string {
  switch (status) {
    case TaskStatus.TODO:
    case 'todo':
    case 'Pending':
      return 'Pending';
    case TaskStatus.IN_PROGRESS:
    case 'in_progress':
    case 'In Progress':
      return 'In Progress';
    case TaskStatus.DONE:
    case 'done':
    case 'Completed':
      return 'Completed';
    default:
      return status;
  }
}

/**
 * Normalizes input priority to internal TaskPriority enum ('low', 'medium', 'high', 'urgent').
 * Accepts: 'Low', 'Medium', 'High', 'low', 'medium', 'high', 'urgent'.
 */
export function normalizeTaskPriority(val?: string | null): TaskPriority | undefined {
  if (!val) return undefined;
  const lower = val.trim().toLowerCase();
  switch (lower) {
    case 'low':
      return TaskPriority.LOW;
    case 'medium':
      return TaskPriority.MEDIUM;
    case 'high':
      return TaskPriority.HIGH;
    case 'urgent':
      return TaskPriority.URGENT;
    default:
      return Object.values(TaskPriority).includes(val as TaskPriority)
        ? (val as TaskPriority)
        : undefined;
  }
}

/**
 * Formats internal TaskPriority to assignment-facing priority label.
 */
export function formatTaskPriorityLabel(priority: TaskPriority | string): string {
  switch (priority) {
    case TaskPriority.LOW:
    case 'low':
      return 'Low';
    case TaskPriority.MEDIUM:
    case 'medium':
      return 'Medium';
    case TaskPriority.HIGH:
    case 'high':
      return 'High';
    case TaskPriority.URGENT:
    case 'urgent':
      return 'High'; // Spec only defines Low, Medium, High
    default:
      return priority;
  }
}

/**
 * Normalizes input project status to ProjectStatus enum ('Not Started', 'In Progress', 'Completed').
 */
export function normalizeProjectStatus(val?: string | null): ProjectStatus | undefined {
  if (!val) return undefined;
  const lower = val.trim().toLowerCase().replace(/[\s_-]+/g, '');
  switch (lower) {
    case 'notstarted':
      return ProjectStatus.NOT_STARTED;
    case 'inprogress':
      return ProjectStatus.IN_PROGRESS;
    case 'completed':
    case 'done':
      return ProjectStatus.COMPLETED;
    default:
      return Object.values(ProjectStatus).includes(val as ProjectStatus)
        ? (val as ProjectStatus)
        : undefined;
  }
}

export function formatProjectStatusLabel(status: ProjectStatus | string): string {
  return normalizeProjectStatus(status) || (status as string);
}

export const mapTaskStatus = normalizeTaskStatus;
export const mapTaskPriority = normalizeTaskPriority;
export const mapProjectStatus = normalizeProjectStatus;
export const toAssignmentTaskStatus = formatTaskStatusLabel;
export const toAssignmentPriority = formatTaskPriorityLabel;
export const toAssignmentProjectStatus = formatProjectStatusLabel;
