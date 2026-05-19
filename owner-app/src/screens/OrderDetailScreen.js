import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { Colors, Typography, Spacing } from '../theme/designSystem';

const OrderDetailScreen = ({ route }) => {
  const orderId = route?.params?.orderId || '—';

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Order Detail"
        subtitle={`Order #${orderId}`}
        showBack
      />
      <View style={styles.body}>
        <Text style={styles.icon}>📋</Text>
        <Text style={styles.title}>Order Details</Text>
        <Text style={styles.sub}>
          Full order breakdown, status controls{'\n'}and bill generation — coming in Phase 5.
        </Text>
        <View style={styles.phaseTag}>
          <Text style={styles.phaseTagText}>PHASE 5</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxl },
  icon:  { fontSize: 48, marginBottom: 16 },
  title: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: Typography.bold, marginBottom: 8 },
  sub:   { color: Colors.textSecondary, fontSize: Typography.sm, textAlign: 'center', lineHeight: 22 },
  phaseTag: {
    marginTop: 20,
    backgroundColor: Colors.primaryGlow, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.primary,
    paddingHorizontal: 16, paddingVertical: 4,
  },
  phaseTagText: { color: Colors.primary, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2 },
});

export default OrderDetailScreen;
