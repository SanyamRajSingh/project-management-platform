import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  type?: 'status' | 'priority';
}

export const Badge: React.FC<BadgeProps> = ({ label, type = 'status' }) => {
  let bg = '#F3F4F6';
  let color = '#4B5563';
  let border = '#E5E7EB';

  const normalized = label.toLowerCase();

  if (normalized === 'completed' || normalized === 'done') {
    bg = '#ECFDF5';
    color = '#047857';
    border = '#A7F3D0';
  } else if (normalized === 'in progress' || normalized === 'in_progress') {
    bg = '#EFF6FF';
    color = '#1D4ED8';
    border = '#BFDBFE';
  } else if (normalized === 'pending' || normalized === 'todo' || normalized === 'not started') {
    bg = '#FFFBEB';
    color = '#B45309';
    border = '#FDE68A';
  } else if (normalized === 'high' || normalized === 'urgent') {
    bg = '#FEF2F2';
    color = '#B91C1C';
    border = '#FECACA';
  } else if (normalized === 'medium') {
    bg = '#F5F3FF';
    color = '#6D28D9';
    border = '#DDD6FE';
  } else if (normalized === 'low') {
    bg = '#F0FDF4';
    color = '#15803D';
    border = '#BBF7D0';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
