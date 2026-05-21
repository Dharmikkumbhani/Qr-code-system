import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/designSystem';

/**
 * ScreenHeader — reusable top bar for every screen.
 *
 * Props:
 *   title        {string}          — main heading
 *   subtitle     {string}          — optional grey subtitle below
 *   showBack     {boolean}         — show ‹ back arrow
 *   rightSlot    {ReactElement}    — custom element on the right side
 */
const ScreenHeader = ({ title, subtitle, showBack = false, rightSlot }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.wrapper}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      {rightSlot ? <View style={styles.right}>{rightSlot}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Platform.OS === 'android' ? Spacing.huge : Spacing.xxl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: Colors.textPrimary,
    fontSize: 22,
    lineHeight: 24,
    fontWeight: Typography.semibold,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    lineHeight: 26,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    marginTop: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default ScreenHeader;
