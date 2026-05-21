import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/designSystem';
import api from '../services/api';

const OrderDetailScreen = ({ route, navigation }) => {
  const { order } = route.params || {};
  const [loading, setLoading] = useState(false);

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Order Detail" showBack />
        <View style={styles.centered}>
          <Text>No order data available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate bill breakdown
  const finalTotal = parseFloat(order.totalAmount);

  const handleCheckout = async () => {
    Alert.alert(
      'Checkout & Clear Table',
      `Mark Order #${order.id.slice(-6)} as COMPLETED and PAID?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true);
              await api.patch(`/restaurants/${order.restaurantId}/orders/${order.id}/status`, {
                status: 'COMPLETED',
                paymentStatus: 'PAID'
              });
              Alert.alert('Success', 'Order completed and table cleared.');
              navigation.goBack();
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Failed to complete checkout.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return Colors.warning;
      case 'ACCEPTED': return Colors.primary;
      case 'COMPLETED': return Colors.success;
      default: return Colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title={`Table ${order.table?.tableNumber || '--'}`}
        subtitle={`Order #${order.id.slice(0, 8).toUpperCase()}`}
        showBack
      />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
        
        {/* Status Badge */}
        <View style={styles.statusRow}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Items</Text>
          {order.orderItems.map((item, index) => (
            <View key={item.id || index} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                <View>
                  <Text style={styles.itemName}>{item.menuItem?.name}</Text>
                  {item.specialInstructions && (
                    <Text style={styles.itemNote}>Note: {item.specialInstructions}</Text>
                  )}
                </View>
              </View>
              <Text style={styles.itemPrice}>${(item.quantity * item.unitPrice).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Bill Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bill Summary</Text>
          <View style={[styles.summaryRow, styles.totalRow, { borderTopWidth: 0, paddingTop: 0, marginTop: 0 }]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${finalTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Actions */}
        {order.status !== 'COMPLETED' ? (
          <TouchableOpacity 
            style={styles.checkoutBtn}
            onPress={handleCheckout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.checkoutBtnText}>Checkout & Clear Table</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>Order Completed & Paid</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, padding: Spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadows.sm,
  },
  cardTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  itemLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  itemQuantity: {
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginRight: Spacing.md,
    width: 24,
  },
  itemName: {
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  itemNote: {
    color: Colors.warning,
    fontSize: Typography.xs,
    marginTop: 4,
    fontStyle: 'italic',
  },
  itemPrice: {
    color: Colors.textPrimary,
    fontWeight: Typography.bold,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
  },
  summaryValue: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  totalRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  totalLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
  totalValue: {
    color: Colors.primary,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },

  checkoutBtn: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    ...Shadows.md,
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
  
  completedBadge: {
    backgroundColor: Colors.success + '20',
    padding: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1, borderColor: Colors.success,
  },
  completedText: {
    color: Colors.success,
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  }
});

export default OrderDetailScreen;
