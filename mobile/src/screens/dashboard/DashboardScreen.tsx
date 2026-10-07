import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi, projectsApi, tasksApi } from '../../services/api';
import { DashboardStats, Project, Task } from '../../types';
import { OfflineBanner } from '../../components/OfflineBanner';
import { Badge } from '../../components/Badge';
import { Ionicons } from '@expo/vector-icons';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    projectsInProgress: 0,
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setError(null);
      const [statsRes, projectsRes, tasksRes] = await Promise.all([
        dashboardApi.getStats().catch(() => null),
        projectsApi.list({ limit: 5 }).catch(() => []),
        tasksApi.list().catch(() => []),
      ]);

      if (statsRes) {
        setStats(statsRes);
      } else {
        // Fallback calculation from items
        const projects = projectsRes || [];
        const tasks = tasksRes || [];
        setStats({
          totalProjects: projects.length,
          totalTasks: tasks.length,
          completedTasks: tasks.filter(
            (t) => t.status === 'Completed' || (t.status as string) === 'done',
          ).length,
          pendingTasks: tasks.filter(
            (t) => t.status === 'Pending' || (t.status as string) === 'todo',
          ).length,
          projectsInProgress: projects.filter(
            (p) => p.status === 'In Progress' || (p.status as string) === 'in_progress',
          ).length,
        });
      }

      setRecentProjects((projectsRes || []).slice(0, 3));
      setRecentTasks((tasksRes || []).slice(0, 4));
    } catch (err: any) {
      setError('Could not load dashboard data. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
      >
        {/* User Greeting & Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hello, {user?.firstName || user?.fullName || 'there'} 👋
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logout}
            accessibilityLabel="Log out"
          >
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={16} color="#B91C1C" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : (
          <>
            {/* KPI Metrics Cards */}
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, styles.cardProjects]}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Total Projects</Text>
                  <Ionicons name="folder-outline" size={20} color="#4F46E5" />
                </View>
                <Text style={styles.metricValue}>{stats.totalProjects}</Text>
                <Text style={styles.metricSub}>Active workspace</Text>
              </View>

              <View style={[styles.metricCard, styles.cardTasks]}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Total Tasks</Text>
                  <Ionicons name="checkbox-outline" size={20} color="#2563EB" />
                </View>
                <Text style={styles.metricValue}>{stats.totalTasks}</Text>
                <Text style={styles.metricSub}>Across all projects</Text>
              </View>

              <View style={[styles.metricCard, styles.cardCompleted]}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Completed</Text>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#059669" />
                </View>
                <Text style={styles.metricValue}>{stats.completedTasks}</Text>
                <Text style={styles.metricSub}>Tasks done</Text>
              </View>

              <View style={[styles.metricCard, styles.cardPending]}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Pending</Text>
                  <Ionicons name="time-outline" size={20} color="#D97706" />
                </View>
                <Text style={styles.metricValue}>{stats.pendingTasks}</Text>
                <Text style={styles.metricSub}>Tasks awaiting</Text>
              </View>

              <View style={[styles.metricCardFull, styles.cardInProgress]}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Projects In Progress</Text>
                  <Ionicons name="rocket-outline" size={20} color="#7C3AED" />
                </View>
                <Text style={styles.metricValue}>{stats.projectsInProgress}</Text>
                <Text style={styles.metricSub}>Currently underway</Text>
              </View>
            </View>

            {/* Quick Links / Recent Projects */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Projects</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Projects')}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentProjects.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No projects yet</Text>
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={() => navigation.navigate('Projects')}
                >
                  <Text style={styles.emptyActionText}>+ Create your first project</Text>
                </TouchableOpacity>
              </View>
            ) : (
              recentProjects.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.itemCard}
                  onPress={() => navigation.navigate('Projects', { screen: 'ProjectDetail', params: { projectId: p.id } })}
                >
                  <View style={styles.itemMain}>
                    <Text style={styles.itemTitle}>{p.name}</Text>
                    {p.description ? (
                      <Text style={styles.itemDesc} numberOfLines={1}>
                        {p.description}
                      </Text>
                    ) : null}
                  </View>
                  <Badge label={p.status || 'Not Started'} />
                </TouchableOpacity>
              ))
            )}

            {/* Recent Tasks */}
            <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
              <Text style={styles.sectionTitle}>Recent Tasks</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentTasks.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No tasks yet</Text>
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={() => navigation.navigate('Tasks')}
                >
                  <Text style={styles.emptyActionText}>+ Create your first task</Text>
                </TouchableOpacity>
              </View>
            ) : (
              recentTasks.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.itemCard}
                  onPress={() => navigation.navigate('Tasks')}
                >
                  <View style={styles.itemMain}>
                    <Text style={styles.itemTitle}>{t.title}</Text>
                    <View style={styles.tagRow}>
                      <Badge label={t.priority || 'Medium'} type="priority" />
                      <View style={{ width: 6 }} />
                      <Badge label={t.status || 'Pending'} type="status" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 13,
    flex: 1,
  },
  loaderContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  metricCardFull: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardProjects: { borderLeftWidth: 4, borderLeftColor: '#4F46E5' },
  cardTasks: { borderLeftWidth: 4, borderLeftColor: '#2563EB' },
  cardCompleted: { borderLeftWidth: 4, borderLeftColor: '#059669' },
  cardPending: { borderLeftWidth: 4, borderLeftColor: '#D97706' },
  cardInProgress: { borderLeftWidth: 4, borderLeftColor: '#7C3AED' },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  metricSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemMain: {
    flex: 1,
    marginRight: 10,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  emptyAction: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
});
