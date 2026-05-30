import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/designSystem';
import api from '../services/api';
import { getStoredUser } from '../services/authService';
import { initiateSocketConnection, disconnectSocket } from '../services/socket';
import { registerForPushNotificationsAsync } from '../services/pushNotifications';

// Notification bell button rendered in the header's right slot
const NotifBell = ({ hasNew }) => (
  <TouchableOpacity style={styles.notifBtn} activeOpacity={0.75}>
    <Text style={{ fontSize: 20 }}>🔔</Text>
    {hasNew && <View style={styles.notifDot} />}
  </TouchableOpacity>
);

// Calculate live waiting time from createdAt
const getWaitingTime = (createdAt) => {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return { text: 'Just now', color: '#10B981' };
  if (mins < 10) return { text: `${mins} min`, color: '#10B981' };
  if (mins < 20) return { text: `${mins} min`, color: '#B45309' };
  if (mins < 60) return { text: `${mins} min`, color: '#DC2626' };
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return { text: `${hrs}h ${remainMins}m`, color: '#DC2626' };
};

const OrderCard = ({ order, onUpdateStatus, onPress }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return Colors.warning;
      case 'ACCEPTED': return Colors.primary;
      case 'COMPLETED': return Colors.success;
      default: return Colors.textSecondary;
    }
  };

  const getNextAction = (status) => {
    if (status === 'ACCEPTED' || status === 'PENDING') return { label: 'Checkout', nextStatus: 'COMPLETED' };
    return null;
  };

  const action = getNextAction(order.status);
  const timeElapsed = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity style={styles.orderCard} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.orderHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <View style={styles.tableBadge}>
              <Text style={styles.tableBadgeText}>{order.table?.tableNumber || 'Table --'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
            </View>
            {order.billRequested && (
              <View style={[styles.statusBadge, { backgroundColor: Colors.error + '20' }]}>
                <Text style={[styles.statusText, { color: Colors.error }]}>Bill Requested</Text>
              </View>
            )}
          </View>
          <Text style={styles.customerName}>{order.customer?.name || 'Walk-in Customer'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.timeText}>{timeElapsed}</Text>
          {(() => {
            const wait = getWaitingTime(order.createdAt);
            return (
              <View style={[styles.waitBadge, { backgroundColor: wait.color + '18' }]}>
                <Text style={[styles.waitBadgeText, { color: wait.color }]}>⏱ {wait.text}</Text>
              </View>
            );
          })()}
        </View>
      </View>

      <View style={styles.itemsList}>
        {order.orderItems.map((item, index) => (
          <View key={item.id || index} style={styles.itemRow}>
            <Text style={styles.itemQuantity}>{item.quantity}x</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.menuItem?.name}</Text>
              {item.specialInstructions && (
                <Text style={styles.itemNote}>Note: {item.specialInstructions}</Text>
              )}
            </View>
            <Text style={styles.itemPrice}>₹{(item.quantity * item.unitPrice).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.totalText}>Total: <Text style={styles.totalAmount}>₹{parseFloat(order.totalAmount).toFixed(2)}</Text></Text>
        {action && (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: getStatusColor(order.status) }]}
            onPress={() => onUpdateStatus(order.id, action.nextStatus)}
          >
            <Text style={styles.actionBtnText}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const DashboardScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState(null);
  const [hasNewNotif, setHasNewNotif] = useState(false);
  const [tick, setTick] = useState(0);

  // Live timer — updates every 30s so "waiting X min" stays fresh
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const initialize = async () => {
      const user = await getStoredUser();
      if (user?.restaurants && user.restaurants.length > 0) {
        const rId = user.restaurants[0].id;
        setRestaurantId(rId);
        
        // Setup Push Notifications
        registerForPushNotificationsAsync();

        // Setup Socket
        const socket = initiateSocketConnection(rId);
        
        socket.on('newOrder', (newOrder) => {
          setOrders(prev => [newOrder, ...prev]);
          setHasNewNotif(true);
          Alert.alert('New Order! 🍽️', `A new order has been placed at ${newOrder.table?.tableNumber || 'a table'}.`);
        });

        socket.on('orderUpdated', (updatedOrder) => {
          setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
          // Alert.alert('Items Added! 🍽️', `Customer at ${updatedOrder.table?.tableNumber || 'a table'} added more items.`);
        });

        socket.on('billRequested', (data) => {
          setHasNewNotif(true);
          Alert.alert('Bill Requested 🛎️', `${data.tableNumber} is ready to checkout!`);
          setOrders(prev => prev.map(o => o.tableId === data.tableId && o.paymentStatus !== 'PAID' ? { ...o, billRequested: true } : o));
        });
      } else {
        setLoading(false);
      }
    };

    initialize();

    return () => {
      disconnectSocket();
    };
  }, []);

  const fetchOrders = async (rId) => {
    try {
      const response = await api.get(`/restaurants/${rId}/orders`);
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      Alert.alert('Error', 'Could not load active orders.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (restaurantId) {
        fetchOrders(restaurantId);
      }
    }, [restaurantId])
  );

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Optimistic update
      setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: newStatus,
            ...(newStatus === 'COMPLETED' ? { paymentStatus: 'PAID' } : {})
          };
        }
        return o;
      }));
      
      const payload = { status: newStatus };
      if (newStatus === 'COMPLETED') {
        payload.paymentStatus = 'PAID';
      }
      
      await api.patch(`/restaurants/${restaurantId}/orders/${orderId}/status`, payload);
    } catch (error) {
      console.error('Failed to update status:', error);
      // Revert on error (could be better handled)
      fetchOrders(restaurantId);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const activeOrders = orders.filter(o => o.paymentStatus !== 'PAID');
  const completedCount = orders.filter(o => o.paymentStatus === 'PAID').length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Live Orders"
        subtitle="Good morning 👋"
        rightSlot={<NotifBell hasNew={hasNewNotif} />}
      />

      <View style={styles.container}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Active',  value: activeOrders.length, color: Colors.warning },
            { label: 'Done',    value: completedCount, color: Colors.success },
            { label: 'Total',   value: orders.length, color: Colors.info },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : activeOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>No Active Orders</Text>
            <Text style={styles.emptySub}>
              New orders will appear here automatically when placed by customers.
            </Text>
          </View>
        ) : (
          <FlatList
            data={activeOrders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <OrderCard 
                order={item} 
                onUpdateStatus={updateOrderStatus}
                onPress={() => navigation.navigate('OrderDetail', { order: item })}
              />
            )}
            contentContainerStyle={{ paddingBottom: Spacing.xxl }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },

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

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.xl },
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

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  emptyIcon:  { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: Typography.bold, marginBottom: 8 },
  emptySub:   { color: Colors.textSecondary, fontSize: Typography.sm, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },

  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadows.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tableBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  tableBadgeText: {
    color: Colors.primary,
    fontWeight: Typography.bold,
    fontSize: Typography.sm,
  },
  timeText: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
  },
  waitBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  waitBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  customerName: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  
  itemsList: {
    marginBottom: Spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  itemQuantity: {
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
    width: 25,
  },
  itemName: {
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  itemNote: {
    color: Colors.warning,
    fontSize: Typography.xs,
    marginTop: 2,
    fontStyle: 'italic',
  },
  itemPrice: {
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },

  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  totalText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
  },
  totalAmount: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  actionBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: Typography.bold,
    fontSize: Typography.sm,
  }
});

export default DashboardScreen;
