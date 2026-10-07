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

interface TasksScreenProps {
  navigation: any;
}

export const TasksScreen: React.FC<TasksScreenProps> = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Modal State for Create / Edit
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskProjectId, setTaskProjectId] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskDesc, setTaskDesc] = useState<string>('');
  const [taskStatus, setTaskStatus] = useState<string>('Pending');
  const [taskPriority, setTaskPriority] = useState<string>('Medium');
  const [taskDueDate, setTaskDueDate] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchTasksAndProjects = useCallback(async () => {
    try {
      const [tasksData, projectsData] = await Promise.all([
        tasksApi.list({
          search: search.trim() || undefined,
          status: selectedStatus === 'ALL' ? undefined : selectedStatus,
          priority: selectedPriority === 'ALL' ? undefined : selectedPriority,
        }),
        projectsApi.list(),
      ]);
      setTasks(tasksData);
      setProjects(projectsData);
      if (projectsData.length > 0 && !taskProjectId) {
        setTaskProjectId(projectsData[0].id);
      }
    } catch {
      // Safely handled
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedStatus, selectedPriority, taskProjectId]);

  useEffect(() => {
    fetchTasksAndProjects();
  }, [fetchTasksAndProjects]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasksAndProjects();
  }, [fetchTasksAndProjects]);

  const openCreateModal = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskStatus('Pending');
    setTaskPriority('Medium');
    setTaskDueDate('');
    if (projects.length > 0) {
      setTaskProjectId(projects[0].id);
    }
    setFormError(null);
    setModalVisible(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTaskProjectId(task.projectId);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskStatus(task.status || 'Pending');
    setTaskPriority(task.priority || 'Medium');
    setTaskDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setFormError(null);
    setModalVisible(true);
  };

  const handleToggleComplete = async (task: Task) => {
    const isCompleted = task.status === 'Completed' || (task.status as string) === 'done';
    const nextStatus = isCompleted ? 'Pending' : 'Completed';

    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)),
      );
      await tasksApi.update(task.id, { status: nextStatus });
    } catch {
      fetchTasksAndProjects();
    }
  };

  const handleSaveTask = async () => {
    if (!taskTitle.trim()) {
      setFormError('Task title is required.');
      return;
    }

    if (!editingTask && !taskProjectId) {
      setFormError('Please select a project for this task.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        projectId: taskProjectId,
        title: taskTitle.trim(),
        description: taskDesc.trim() || undefined,
        status: taskStatus,
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
      };

      if (editingTask) {
        await tasksApi.update(editingTask.id, payload);
      } else {
        await tasksApi.create(payload);
      }

      setModalVisible(false);
      fetchTasksAndProjects();
    } catch (err: any) {
      setFormError(err?.response?.data?.error?.message || 'Failed to save task.');
    } finally {
      setSubmitting(false);
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

  const renderTaskItem = ({ item }: { item: Task }) => {
    const isCompleted = item.status === 'Completed' || (item.status as string) === 'done';
    const project = projects.find((p) => p.id === item.projectId);

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.checkboxTouch}
          onPress={() => handleToggleComplete(item)}
          accessibilityLabel="Toggle completion"
        >
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={isCompleted ? '#059669' : '#9CA3AF'}
          />
        </TouchableOpacity>

        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, isCompleted && styles.completedTitle]}>
            {item.title}
          </Text>

          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.badgeRow}>
            {project ? (
              <View style={styles.projectTag}>
                <Ionicons name="folder-outline" size={11} color="#4F46E5" />
                <Text style={styles.projectTagText} numberOfLines={1}>
                  {project.name}
                </Text>
              </View>
            ) : null}
            <Badge label={item.priority || 'Medium'} type="priority" />
            <Badge label={item.status || 'Pending'} type="status" />
            {item.dueDate ? (
              <Text style={styles.dueDateText}>📅 {item.dueDate.split('T')[0]}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.cardActionGroup}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openEditModal(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="pencil-outline" size={17} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleDeleteTask(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={17} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <OfflineBanner />
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <Text style={styles.screenHeading}>Tasks</Text>
          <TouchableOpacity style={styles.createBtn} onPress={openCreateModal}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.createBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
          <Input
            placeholder="Search tasks by name..."
            value={search}
            onChangeText={setSearch}
            containerStyle={styles.searchInputContainer}
            style={styles.searchInput}
          />
        </View>

        {/* Status Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Text style={styles.filterGroupLabel}>Status:</Text>
          {['ALL', 'Pending', 'In Progress', 'Completed'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[
                styles.chip,
                selectedStatus === st && styles.chipActive,
              ]}
              onPress={() => setSelectedStatus(st)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedStatus === st && styles.chipTextActive,
                ]}
              >
                {st === 'ALL' ? 'All' : st}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Priority Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filterRow, { paddingTop: 0 }]}
        >
          <Text style={styles.filterGroupLabel}>Priority:</Text>
          {['ALL', 'Low', 'Medium', 'High'].map((pr) => (
            <TouchableOpacity
              key={pr}
              style={[
                styles.chip,
                selectedPriority === pr && styles.chipActive,
              ]}
              onPress={() => setSelectedPriority(pr)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedPriority === pr && styles.chipTextActive,
                ]}
              >
                {pr === 'ALL' ? 'All' : pr}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List Content */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={renderTaskItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4F46E5']}
                tintColor="#4F46E5"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="checkbox-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No tasks found</Text>
                <Text style={styles.emptySub}>
                  {search || selectedStatus !== 'ALL' || selectedPriority !== 'ALL'
                    ? 'Try adjusting your filters'
                    : 'Tap + New to create your first task'}
                </Text>
              </View>
            }
          />
        )}

        {/* Create / Edit Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingTask ? 'Edit Task' : 'New Task'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled">
                {formError && (
                  <View style={styles.formErrorBox}>
                    <Text style={styles.formErrorText}>{formError}</Text>
                  </View>
                )}

                {/* Project Selection if creating */}
                {!editingTask && (
                  <View style={{ marginBottom: 14 }}>
                    <Text style={styles.fieldLabel}>Select Project *</Text>
                    {projects.length === 0 ? (
                      <Text style={{ fontSize: 13, color: '#EF4444' }}>
                        Please create a project first before creating tasks.
                      </Text>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 6 }}>
                        {projects.map((p) => (
                          <TouchableOpacity
                            key={p.id}
                            style={[
                              styles.projSelectChip,
                              taskProjectId === p.id && styles.projSelectChipActive,
                            ]}
                            onPress={() => setTaskProjectId(p.id)}
                          >
                            <Text
                              style={[
                                styles.projSelectChipText,
                                taskProjectId === p.id && styles.projSelectChipTextActive,
                              ]}
                            >
                              {p.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}

                <Input
                  label="Task Name *"
                  placeholder="e.g. Implement registration flow"
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                />

                <Input
                  label="Description"
                  placeholder="Task details and deliverables..."
                  multiline
                  numberOfLines={2}
                  value={taskDesc}
                  onChangeText={setTaskDesc}
                  style={{ height: 60, textAlignVertical: 'top' }}
                />

                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.selectRow}>
                  {['Pending', 'In Progress', 'Completed'].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.selectOption,
                        taskStatus === st && styles.selectOptionActive,
                      ]}
                      onPress={() => setTaskStatus(st)}
                    >
                      <Text
                        style={[
                          styles.selectOptionText,
                          taskStatus === st && styles.selectOptionTextActive,
                        ]}
                      >
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Priority</Text>
                <View style={styles.selectRow}>
                  {['Low', 'Medium', 'High'].map((pr) => (
                    <TouchableOpacity
                      key={pr}
                      style={[
                        styles.selectOption,
                        taskPriority === pr && styles.selectOptionActive,
                      ]}
                      onPress={() => setTaskPriority(pr)}
                    >
                      <Text
                        style={[
                          styles.selectOptionText,
                          taskPriority === pr && styles.selectOptionTextActive,
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
                    onPress={() => setModalVisible(false)}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <Button
                    title={editingTask ? 'Save Changes' : 'Create Task'}
                    onPress={handleSaveTask}
                    loading={submitting}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
  },
  screenHeading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  searchIcon: {
    position: 'absolute',
    top: 14,
    left: 12,
    zIndex: 1,
  },
  searchInputContainer: {
    marginBottom: 0,
  },
  searchInput: {
    paddingLeft: 38,
  },
  filterRow: {
    paddingVertical: 6,
    gap: 6,
    alignItems: 'center',
  },
  filterGroupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  chipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 30,
    paddingTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  checkboxTouch: {
    paddingTop: 2,
    marginRight: 10,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  cardDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  projectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  projectTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
    maxWidth: 90,
  },
  dueDateText: {
    fontSize: 11,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 6,
  },
  actionBtn: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
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
  projSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 6,
  },
  projSelectChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  projSelectChipText: {
    fontSize: 12,
    color: '#4B5563',
  },
  projSelectChipTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  selectRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  selectOption: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  selectOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
  },
  selectOptionTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 20,
  },
});
