import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/designSystem';

// Notification bell button rendered in the header's right slot
const NotifBell = () => (
  <TouchableOpacity style={styles.notifBtn} activeOpacity={0.75}>
    <Text style={{ fontSize: 20 }}>🔔</Text>
    <View style={styles.notifDot} />
  </TouchableOpacity>
);

// Skeleton shimmer block
const Skeleton = ({ width, height, style }) => (
  <View style={[styles.skeleton, { width, height }, style]} />
);

const DashboardScreen = () => (
  <SafeAreaView style={styles.safe}>
    {/* Shared header with notification bell */}
    <ScreenHeader
      title="Live Orders"
      subtitle="Good morning 👋"
      rightSlot={<NotifBell />}
    />

    <View style={styles.container}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Active',  value: '--', color: Colors.warning },
          { label: 'Done',    value: '--', color: Colors.success },
          { label: 'Tables',  value: '--', color: Colors.info    },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Placeholder */}
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>⚡</Text>
        <Text style={styles.emptyTitle}>Live Orders</Text>
        <Text style={styles.emptySub}>
          Real-time orders will appear here.{'\n'}Coming in Phase 4.
        </Text>
        <View style={styles.phaseTag}>
          <Text style={styles.phaseTagText}>PHASE 4</Text>
        </View>
      </View>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.lg },

  notifBtn: {
    width: 40, height: 40,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  notifDot: {
    position: 'absolute', top: 6, right: 6,
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1.5, borderColor: Colors.surface,
  },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.xxl },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  statValue: { fontSize: Typography.xl, fontWeight: Typography.bold, marginBottom: 2 },
  statLabel: { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: Typography.medium },

  skeleton: { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.xs },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  emptyIcon:  { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: Typography.bold, marginBottom: 8 },
  emptySub:   { color: Colors.textSecondary, fontSize: Typography.sm, textAlign: 'center', lineHeight: 22 },
  phaseTag: {
    marginTop: 20,
    backgroundColor: Colors.primaryGlow,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.primary,
    paddingHorizontal: 16, paddingVertical: 4,
  },
  phaseTagText: { color: Colors.primary, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2 },
});

export default DashboardScreen;
