import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/designSystem';

import DashboardStack  from './DashboardStack';   // nested stack for orders
import MenuScreen      from '../screens/MenuScreen';
import TablesScreen    from '../screens/TablesScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ProfileScreen   from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

// ─── Tab Config ───────────────────────────────────────────────────────────────
const TAB_CONFIG = [
  { name: 'Dashboard', icon: '📋', label: 'Orders',  badge: true  },
  { name: 'Menu',      icon: '🍽️', label: 'Menu',    badge: false },
  { name: 'Tables',    icon: '🪑', label: 'Tables',  badge: false },
  { name: 'Analytics', icon: '📈', label: 'Analytics',badge: false },
  { name: 'Profile',   icon: '👤', label: 'Profile', badge: false },
];

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────
const CustomTabBar = ({ state, descriptors, navigation }) => (
  <View style={styles.outerContainer}>
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const config  = TAB_CONFIG[index] || {};

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.8}
          >
            {/* Top active pill */}
            {focused && <View style={styles.activePill} />}

            {/* Icon + optional badge */}
            <View style={styles.iconWrap}>
              <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
                <Text style={[styles.icon, focused && styles.iconActive]}>
                  {config.icon}
                </Text>
              </View>
              {/* Red badge dot (e.g. new orders) */}
              {config.badge && (
                <View style={styles.badge} />
              )}
            </View>

            {/* Label */}
            <Text style={[styles.label, focused && styles.labelActive]}>
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// ─── Navigator ────────────────────────────────────────────────────────────────
const TabNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Dashboard" component={DashboardStack} />
    <Tab.Screen name="Menu"      component={MenuScreen}     />
    <Tab.Screen name="Tables"    component={TablesScreen}   />
    <Tab.Screen name="Analytics" component={AnalyticsScreen} />
    <Tab.Screen name="Profile"   component={ProfileScreen}  />
  </Tab.Navigator>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: Colors.bg,
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 26 : 12,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },

  // Pill indicator at the very top of the active tab
  activePill: {
    position: 'absolute',
    top: -6,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },

  iconWrap: { position: 'relative' },

  iconBox: {
    width: 40,
    height: 36,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
  },
  iconBoxActive: {
    backgroundColor: Colors.primaryGlow,
  },
  icon:       { fontSize: 20, opacity: 0.45 },
  iconActive: { opacity: 1 },

  // Red notification dot on Dashboard tab
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },

  label: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
});

export default TabNavigator;
