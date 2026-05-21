import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/designSystem';

const MenuItem = ({ icon, label, sub, danger }) => (
  <TouchableOpacity style={styles.menuItem} activeOpacity={0.75}>
    <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuLabel, danger && { color: Colors.error }]}>{label}</Text>
      {sub && <Text style={styles.menuSub}>{sub}</Text>}
    </View>
    <Text style={styles.menuChevron}>›</Text>
  </TouchableOpacity>
);

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Header */}
        <Text style={styles.headerTitle}>Profile</Text>

        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.name || 'Restaurant Owner'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'owner@restaurant.com'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{user?.role || 'OWNER'}</Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <Text style={styles.sectionLabel}>Settings</Text>
        <View style={styles.menuCard}>
          <MenuItem icon="🏪" label="Restaurant Info"   sub="Name, address, hours" />
          <View style={styles.divider} />
          <MenuItem icon="🔔" label="Notifications"    sub="Push alerts for orders" />
          <View style={styles.divider} />
          <MenuItem icon="🎨" label="Appearance"       sub="Theme & display" />
          <View style={styles.divider} />
          <MenuItem icon="🔐" label="Change Password"  sub="Update your credentials" />
        </View>

        {/* Danger Section */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={logout} activeOpacity={0.75}>
            <View style={[styles.menuIcon, styles.menuIconDanger]}>
              <Text style={{ fontSize: 18 }}>🚪</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuLabel, { color: Colors.error }]}>Sign Out</Text>
              <Text style={styles.menuSub}>You will be logged out</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>RestaurantOS v1.0</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.huge },

  headerTitle: { color: Colors.textPrimary, fontSize: Typography.xxl, fontWeight: Typography.bold, marginBottom: Spacing.xl },

  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
    ...Shadows.md,
  },
  avatar: {
    width: 60, height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 2, borderColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarEmoji: { fontSize: 28 },
  userName:    { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.bold, marginBottom: 2 },
  userEmail:   { color: Colors.textSecondary, fontSize: Typography.sm, marginBottom: 8 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryGlow,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.primary,
    paddingHorizontal: 10, paddingVertical: 2,
  },
  roleBadgeText: { color: Colors.primary, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 1 },

  sectionLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },

  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: 14,
  },
  menuIcon: {
    width: 38, height: 38,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center', alignItems: 'center',
  },
  menuIconDanger: { backgroundColor: Colors.errorBg },
  menuContent:   { flex: 1 },
  menuLabel:     { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: Typography.medium },
  menuSub:       { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
  menuChevron:   { color: Colors.textMuted, fontSize: 22, fontWeight: Typography.light },
  divider:       { height: 1, backgroundColor: Colors.border, marginLeft: 66 },

  versionText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: 'center',
    marginTop: 'auto',
    paddingBottom: 8,
  },
});

export default ProfileScreen;
