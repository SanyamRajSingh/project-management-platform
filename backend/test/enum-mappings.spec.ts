import {
  mapTaskStatus,
  mapTaskPriority,
  mapProjectStatus,
  toAssignmentTaskStatus,
  toAssignmentPriority,
  toAssignmentProjectStatus,
} from '../src/shared/enums/enum-mappings';
import { TaskStatus, TaskPriority } from '../src/shared/enums';
import { ProjectStatus } from '../src/shared/enums/project-status.enum';

describe('Enum Normalization & Mappings', () => {
  describe('TaskStatus Mapping', () => {
    it('should map Pending to TODO', () => {
      expect(mapTaskStatus('Pending')).toBe(TaskStatus.TODO);
      expect(mapTaskStatus('pending')).toBe(TaskStatus.TODO);
    });

    it('should map In Progress to IN_PROGRESS', () => {
      expect(mapTaskStatus('In Progress')).toBe(TaskStatus.IN_PROGRESS);
      expect(mapTaskStatus('in_progress')).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should map Completed to DONE', () => {
      expect(mapTaskStatus('Completed')).toBe(TaskStatus.DONE);
      expect(mapTaskStatus('completed')).toBe(TaskStatus.DONE);
      expect(mapTaskStatus('done')).toBe(TaskStatus.DONE);
    });

    it('should convert internal status to assignment label', () => {
      expect(toAssignmentTaskStatus(TaskStatus.TODO)).toBe('Pending');
      expect(toAssignmentTaskStatus(TaskStatus.IN_PROGRESS)).toBe('In Progress');
      expect(toAssignmentTaskStatus(TaskStatus.DONE)).toBe('Completed');
    });
  });

  describe('TaskPriority Mapping', () => {
    it('should normalize Low, Medium, High', () => {
      expect(mapTaskPriority('Low')).toBe(TaskPriority.LOW);
      expect(mapTaskPriority('Medium')).toBe(TaskPriority.MEDIUM);
      expect(mapTaskPriority('High')).toBe(TaskPriority.HIGH);
    });

    it('should map Urgent to URGENT internally', () => {
      expect(mapTaskPriority('urgent')).toBe(TaskPriority.URGENT);
    });

    it('should convert internal priority to assignment label', () => {
      expect(toAssignmentPriority(TaskPriority.LOW)).toBe('Low');
      expect(toAssignmentPriority(TaskPriority.MEDIUM)).toBe('Medium');
      expect(toAssignmentPriority(TaskPriority.HIGH)).toBe('High');
      expect(toAssignmentPriority(TaskPriority.URGENT)).toBe('High');
    });
  });

  describe('ProjectStatus Mapping', () => {
    it('should map Not Started, In Progress, Completed', () => {
      expect(mapProjectStatus('Not Started')).toBe(ProjectStatus.NOT_STARTED);
      expect(mapProjectStatus('In Progress')).toBe(ProjectStatus.IN_PROGRESS);
      expect(mapProjectStatus('Completed')).toBe(ProjectStatus.COMPLETED);
    });

    it('should handle legacy lowercase snake_case values', () => {
      expect(mapProjectStatus('not_started')).toBe(ProjectStatus.NOT_STARTED);
      expect(mapProjectStatus('in_progress')).toBe(ProjectStatus.IN_PROGRESS);
      expect(mapProjectStatus('completed')).toBe(ProjectStatus.COMPLETED);
    });

    it('should convert to assignment display format', () => {
      expect(toAssignmentProjectStatus(ProjectStatus.NOT_STARTED)).toBe('Not Started');
      expect(toAssignmentProjectStatus(ProjectStatus.IN_PROGRESS)).toBe('In Progress');
      expect(toAssignmentProjectStatus(ProjectStatus.COMPLETED)).toBe('Completed');
    });
  });
});
