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
import { projectsApi } from '../../services/api';
import { Project, ProjectStatus } from '../../types';
import { OfflineBanner } from '../../components/OfflineBanner';
import { Badge } from '../../components/Badge';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Ionicons } from '@expo/vector-icons';

interface ProjectsScreenProps {
  navigation: any;
}

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({ navigation }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal State for Create / Edit
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [projectStatus, setProjectStatus] = useState<string>('Not Started');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await projectsApi.list({
        search: search.trim() || undefined,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
      });
      setProjects(data);
    } catch {
      // Error handled safely
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedStatus]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProjects();
  }, [fetchProjects]);

  const openCreateModal = () => {
    setEditingProject(null);
    setProjectName('');
    setProjectDescription('');
    setProjectStatus('Not Started');
    setStartDate('');
    setEndDate('');
    setFormError(null);
    setModalVisible(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description || '');
    setProjectStatus(project.status || 'Not Started');
    setStartDate(project.startDate ? project.startDate.split('T')[0] : '');
    setEndDate(project.endDate ? project.endDate.split('T')[0] : '');
    setFormError(null);
    setModalVisible(true);
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      setFormError('Project name is required.');
      return;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setFormError('Start date must be before or equal to end date.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
        status: projectStatus,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      if (editingProject) {
        await projectsApi.update(editingProject.id, payload);
      } else {
        await projectsApi.create(payload);
      }

      setModalVisible(false);
      fetchProjects();
    } catch (err: any) {
      setFormError(err?.response?.data?.error?.message || 'Failed to save project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = (project: Project) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await projectsApi.delete(project.id);
              fetchProjects();
            } catch {
              Alert.alert('Error', 'Failed to delete project.');
            }
          },
        },
      ],
    );
  };

  const renderProjectCard = ({ item }: { item: Project }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBox}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <Badge label={item.status || 'Not Started'} />
      </View>

      {item.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      <View style={styles.cardFooter}>
        <View style={styles.dateBox}>
          <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
          <Text style={styles.dateText}>
            {item.startDate ? item.startDate.split('T')[0] : 'No start'} →{' '}
            {item.endDate ? item.endDate.split('T')[0] : 'No end'}
          </Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openEditModal(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="pencil-outline" size={17} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleDeleteProject(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={17} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <OfflineBanner />
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <Text style={styles.screenHeading}>Projects</Text>
          <TouchableOpacity style={styles.createBtn} onPress={openCreateModal}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.createBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
          <Input
            placeholder="Search projects by name..."
            value={search}
            onChangeText={setSearch}
            containerStyle={styles.searchInputContainer}
            style={styles.searchInput}
          />
        </View>

        {/* Status Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {['ALL', 'Not Started', 'In Progress', 'Completed'].map((st) => (
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

        {/* List Content */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : (
          <FlatList
            data={projects}
            keyExtractor={(item) => item.id}
            renderItem={renderProjectCard}
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
                <Ionicons name="folder-open-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No projects found</Text>
                <Text style={styles.emptySub}>
                  {search ? 'Try clearing your search query' : 'Create your first project to start tracking'}
                </Text>
              </View>
            }
          />
        )}

        {/* Create / Edit Project Modal */}
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
                  {editingProject ? 'Edit Project' : 'New Project'}
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

                <Input
                  label="Project Name *"
                  placeholder="e.g. Website Redesign"
                  value={projectName}
                  onChangeText={setProjectName}
                />

                <Input
                  label="Description"
                  placeholder="Brief description of goals..."
                  multiline
                  numberOfLines={3}
                  value={projectDescription}
                  onChangeText={setProjectDescription}
                  style={{ height: 75, textAlignVertical: 'top' }}
                />

                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.statusSelectRow}>
                  {['Not Started', 'In Progress', 'Completed'].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusOption,
                        projectStatus === st && styles.statusOptionActive,
                      ]}
                      onPress={() => setProjectStatus(st)}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          projectStatus === st && styles.statusOptionTextActive,
                        ]}
                      >
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.dateRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Input
                      label="Start Date (YYYY-MM-DD)"
                      placeholder="2026-10-01"
                      value={startDate}
                      onChangeText={setStartDate}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Input
                      label="End Date (YYYY-MM-DD)"
                      placeholder="2026-10-31"
                      value={endDate}
                      onChangeText={setEndDate}
                    />
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <Button
                    title="Cancel"
                    variant="secondary"
                    onPress={() => setModalVisible(false)}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <Button
                    title={editingProject ? 'Save Changes' : 'Create Project'}
                    onPress={handleSaveProject}
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
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  chipText: {
    fontSize: 13,
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
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleBox: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
    marginTop: 4,
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  statusSelectRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 8,
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
  dateRow: {
    flexDirection: 'row',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 20,
  },
});
