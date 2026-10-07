import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { projectsApi, tasksApi } from '../../services/api';
import { Project, Task, TaskPriority, TaskStatus } from '../../types';
import { OfflineBanner } from '../../components/OfflineBanner';
import { Badge } from '../../components/Badge';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Ionicons } from '@expo/vector-icons';

interface ProjectDetailScreenProps {
  route: any;
  navigation: any;
}

export const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { projectId } = route.params;
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // New task modal
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskDesc, setTaskDesc] = useState<string>('');
  const [taskStatus, setTaskStatus] = useState<string>('Pending');
  const [taskPriority, setTaskPriority] = useState<string>('Medium');
  const [taskDueDate, setTaskDueDate] = useState<string>('');
  const [submittingTask, setSubmittingTask] = useState<boolean>(false);
  const [taskFormError, setTaskFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [projData, tasksData] = await Promise.all([
        projectsApi.getById(projectId),
        tasksApi.list({ projectId }),
      ]);
      setProject(projData);
      setTasks(tasksData);
    } catch {
      // Safely handled
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleToggleTaskStatus = async (task: Task) => {
    const isCompleted = task.status === 'Completed' || (task.status as string) === 'done';
    const newStatus = isCompleted ? 'Pending' : 'Completed';

    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
      );
      await tasksApi.update(task.id, { status: newStatus });
    } catch {
      loadData();
    }
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) {
      setTaskFormError('Task title is required.');
      return;
    }

    try {
      setSubmittingTask(true);
      setTaskFormError(null);
      await tasksApi.create({
        projectId,
        title: taskTitle.trim(),
        description: taskDesc.trim() || undefined,
        status: taskStatus,
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
      });

      setCreateModalVisible(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      loadData();
    } catch (err: any) {
      setTaskFormError(err?.response?.data?.error?.message || 'Failed to create task.');
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleDeleteTask = (task: Task) => {
    Alert.alert('Delete Task', `Are you sure you want to delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await tasksApi.delete(task.id);
            setTasks((prev) => prev.filter((t) => t.id !== task.id));
          } catch {
            Alert.alert('Error', 'Failed to delete task.');
          }
        },
      },
    ]);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <OfflineBanner />
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {project?.name || 'Project Details'}
          </Text>
          <TouchableOpacity
            style={styles.addTaskBtn}
            onPress={() => setCreateModalVisible(true)}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addTaskText}>Task</Text>
          </TouchableOpacity>
        </View>

        {/* Project Meta Card */}
        {project && (
          <View style={styles.projectCard}>
            <View style={styles.projHeaderRow}>
              <Text style={styles.projName}>{project.name}</Text>
              <Badge label={project.status || 'Not Started'} />
            </View>

            {project.description ? (
              <Text style={styles.projDesc}>{project.description}</Text>
            ) : null}

            <View style={styles.projDates}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={styles.dateLabel}>
                {project.startDate ? project.startDate.split('T')[0] : 'No start'} →{' '}
                {project.endDate ? project.endDate.split('T')[0] : 'No end'}
              </Text>
            </View>
          </View>
        )}

        {/* Project Tasks Header */}
        <View style={styles.tasksHeaderRow}>
          <Text style={styles.tasksHeading}>
            Tasks ({tasks.length})
          </Text>
        </View>

        {/* Tasks List */}
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4F46E5']}
              tintColor="#4F46E5"
            />
          }
          renderItem={({ item }) => {
            const isCompleted =
              item.status === 'Completed' || (item.status as string) === 'done';
            return (
              <View style={styles.taskCard}>
                <TouchableOpacity
                  style={styles.checkboxTouch}
                  onPress={() => handleToggleTaskStatus(item)}
                >
                  <Ionicons
                    name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={isCompleted ? '#059669' : '#9CA3AF'}
                  />
                </TouchableOpacity>

                <View style={styles.taskContent}>
                  <Text
                    style={[
                      styles.taskTitle,
                      isCompleted && styles.taskTitleCompleted,
                    ]}
                  >
                    {item.title}
                  </Text>
                  {item.description ? (
                    <Text style={styles.taskDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}

                  <View style={styles.taskBadges}>
                    <Badge label={item.priority || 'Medium'} type="priority" />
                    <View style={{ width: 6 }} />
                    <Badge label={item.status || 'Pending'} type="status" />
                    {item.dueDate ? (
                      <Text style={styles.dueDateBadge}>
                        📅 {item.dueDate.split('T')[0]}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.taskDeleteBtn}
                  onPress={() => handleDeleteTask(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={17} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkbox-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No tasks under this project</Text>
              <Text style={styles.emptySub}>Tap '+ Task' above to add one.</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 30 }}
        />

        {/* Create Task Modal */}
        <Modal
          visible={createModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setCreateModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Task</Text>
                <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled">
                {taskFormError && (
                  <View style={styles.formErrorBox}>
                    <Text style={styles.formErrorText}>{taskFormError}</Text>
                  </View>
                )}

                <Input
                  label="Task Name *"
                  placeholder="e.g. Set up authentication"
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                />

                <Input
                  label="Description"
                  placeholder="Details about this task..."
                  multiline
                  numberOfLines={2}
                  value={taskDesc}
                  onChangeText={setTaskDesc}
                  style={{ height: 60, textAlignVertical: 'top' }}
                />

                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.statusSelectRow}>
                  {['Pending', 'In Progress', 'Completed'].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusOption,
                        taskStatus === st && styles.statusOptionActive,
                      ]}
                      onPress={() => setTaskStatus(st)}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          taskStatus === st && styles.statusOptionTextActive,
                        ]}
                      >
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Priority</Text>
                <View style={styles.statusSelectRow}>
                  {['Low', 'Medium', 'High'].map((pr) => (
                    <TouchableOpacity
                      key={pr}
                      style={[
                        styles.statusOption,
                        taskPriority === pr && styles.statusOptionActive,
                      ]}
                      onPress={() => setTaskPriority(pr)}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          taskPriority === pr && styles.statusOptionTextActive,
                        ]}
                      >
                        {pr}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Input
                  label="Due Date (YYYY-MM-DD)"
                  placeholder="2026-10-31"
                  value={taskDueDate}
                  onChangeText={setTaskDueDate}
                />

                <View style={styles.modalActions}>
                  <Button
                    title="Cancel"
                    variant="secondary"
                    onPress={() => setCreateModalVisible(false)}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <Button
                    title="Add Task"
                    onPress={handleCreateTask}
                    loading={submittingTask}
                    style={{ flex: 1, marginLeft: 8 }}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  backBtn: {
    padding: 6,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginHorizontal: 10,
  },
  addTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 3,
  },
  addTaskText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  projHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  projName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  projDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
    lineHeight: 18,
  },
  projDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  tasksHeaderRow: {
    marginBottom: 10,
  },
  tasksHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxTouch: {
    paddingTop: 2,
    marginRight: 10,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  taskDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },
  taskBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  dueDateBadge: {
    fontSize: 11,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  taskDeleteBtn: {
    padding: 4,
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  formErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  formErrorText: {
    color: '#991B1B',
    fontSize: 13,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  statusSelectRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
  },
  statusOptionTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 20,
  },
});
