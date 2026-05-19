import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/designSystem';

const MenuScreen = () => (
  <SafeAreaView style={styles.safe}>
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Menu</Text>
          <Text style={styles.headerSub}>Manage item availability</Text>
        </View>
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar mock */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>Search menu items…</Text>
      </View>

      {/* Category pills mock */}
      <View style={styles.pillRow}>
        {['All', 'Starters', 'Mains', 'Drinks', 'Desserts'].map((cat, i) => (
          <View key={cat} style={[styles.pill, i === 0 && styles.pillActive]}>
            <Text style={[styles.pillText, i === 0 && styles.pillTextActive]}>{cat}</Text>
          </View>
        ))}
      </View>

      {/* Empty state */}
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🍽️</Text>
        <Text style={styles.emptyTitle}>Menu Management</Text>
        <Text style={styles.emptySub}>Toggle item availability and{'\n'}manage your menu. Coming in Phase 6.</Text>
        <View style={styles.phaseTag}>
          <Text style={styles.phaseTagText}>PHASE 6</Text>
        </View>
      </View>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.xxl, fontWeight: Typography.bold },
  headerSub:   { color: Colors.textSecondary, fontSize: Typography.sm, marginTop: 2 },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 8,
    ...Shadows.glow(),
  },
  addBtnText: { color: Colors.white, fontSize: Typography.sm, fontWeight: Typography.bold },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, height: 48,
    marginBottom: Spacing.lg,
  },
  searchIcon:        { fontSize: 16, marginRight: 8 },
  searchPlaceholder: { color: Colors.textMuted, fontSize: Typography.sm },

  pillRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.xxl },
  pill: {
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border,
  },
  pillActive:      { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  pillText:        { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: Typography.medium },
  pillTextActive:  { color: Colors.primary, fontWeight: Typography.semibold },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyIcon:  { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: Typography.bold, marginBottom: 8 },
  emptySub:   { color: Colors.textSecondary, fontSize: Typography.sm, textAlign: 'center', lineHeight: 22 },
  phaseTag: {
    marginTop: 20,
    backgroundColor: Colors.primaryGlow, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.primary,
    paddingHorizontal: 16, paddingVertical: 4,
  },
  phaseTagText: { color: Colors.primary, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2 },
});

export default MenuScreen;
