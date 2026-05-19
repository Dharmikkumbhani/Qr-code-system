import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/designSystem';

const STATUS = [
  { label: 'Free',     count: '--', color: Colors.success, bg: Colors.successBg },
  { label: 'Occupied', count: '--', color: Colors.error,   bg: Colors.errorBg   },
  { label: 'Total',    count: '--', color: Colors.info,    bg: Colors.infoBg    },
];

const TablesScreen = () => (
  <SafeAreaView style={styles.safe}>
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tables</Text>
        <Text style={styles.headerSub}>Live floor overview</Text>
      </View>

      {/* Status summary */}
      <View style={styles.statusRow}>
        {STATUS.map((s) => (
          <View key={s.label} style={[styles.statusCard, { backgroundColor: s.bg, borderColor: s.color + '40' }]}>
            <Text style={[styles.statusCount, { color: s.color }]}>{s.count}</Text>
            <Text style={[styles.statusLabel, { color: s.color }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Table grid placeholder */}
      <View style={styles.gridLabel}>
        <Text style={styles.gridLabelText}>Floor Plan</Text>
      </View>
      <View style={styles.grid}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={styles.tableCell}>
            <Text style={styles.tableCellNum}>{i + 1}</Text>
          </View>
        ))}
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptySub}>Live table status comes in Phase 6.</Text>
        <View style={styles.phaseTag}>
          <Text style={styles.phaseTagText}>PHASE 6</Text>
        </View>
      </View>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.huge },

  header: { marginBottom: Spacing.xl },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.xxl, fontWeight: Typography.bold },
  headerSub:   { color: Colors.textSecondary, fontSize: Typography.sm, marginTop: 2 },

  statusRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.xxl },
  statusCard: {
    flex: 1, borderRadius: Radius.md,
    borderWidth: 1, padding: Spacing.md,
    alignItems: 'center',
  },
  statusCount: { fontSize: Typography.xxl, fontWeight: Typography.bold, marginBottom: 2 },
  statusLabel: { fontSize: Typography.xs, fontWeight: Typography.semibold },

  gridLabel: { marginBottom: Spacing.sm },
  gridLabelText: { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: Typography.semibold, letterSpacing: 1, textTransform: 'uppercase' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.xxl },
  tableCell: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
    ...Shadows.sm,
  },
  tableCellNum: { color: Colors.textMuted, fontSize: Typography.md, fontWeight: Typography.bold },

  emptyState: { alignItems: 'center' },
  emptySub: { color: Colors.textSecondary, fontSize: Typography.sm, textAlign: 'center', marginBottom: 12 },
  phaseTag: {
    backgroundColor: Colors.primaryGlow, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.primary,
    paddingHorizontal: 16, paddingVertical: 4,
  },
  phaseTagText: { color: Colors.primary, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2 },
});

export default TablesScreen;
