import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, Alert, Animated, RefreshControl,
  KeyboardAvoidingView, Platform, Dimensions, ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/designSystem';
import api from '../services/api';
import { getStoredUser } from '../services/authService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Parcel Screen ──────────────────────────────────────────────────────────
const ParcelScreen = () => {
  const [parcels, setParcels] = useState([]);
  const [stats, setStats] = useState({ active: 0, ready: 0, completedToday: 0, todayRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [restaurantId, setRestaurantId] = useState(null);

  // Menu & Cart State
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [tick, setTick] = useState(0);

  // Live timer — updates every 30s so "waiting X min" stays current
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate waiting time from createdAt
  const getWaitingTime = (createdAt) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return { text: 'Just now', color: '#10B981' };
    if (mins < 10) return { text: `${mins} min`, color: '#10B981' };
    if (mins < 20) return { text: `${mins} min`, color: Colors.warning };
    if (mins < 60) return { text: `${mins} min`, color: Colors.error };
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return { text: `${hrs}h ${remainMins}m`, color: Colors.error };
  };

  const fetchData = useCallback(async (showFullLoader = false) => {
    try {
      if (showFullLoader) setLoading(true);
      const user = await getStoredUser();
      if (user?.restaurants && user.restaurants.length > 0) {
        const rId = user.restaurants[0].id;
        setRestaurantId(rId);
        
        const [parcelRes, menuRes] = await Promise.all([
          api.get(`/restaurants/${rId}/parcels`),
          api.get(`/restaurants/${rId}/menu`)
        ]);

        if (parcelRes.data.success) {
          setParcels(parcelRes.data.data.parcels);
          setStats(parcelRes.data.data.stats);
        }
        if (menuRes.data.success) {
          setCategories(menuRes.data.data.categories);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      Alert.alert('Error', 'Could not load data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  const updateCart = (item, delta) => {
    setCart(prev => {
      const currentQty = prev[item.id]?.quantity || 0;
      const newQty = Math.max(0, currentQty + delta);
      if (newQty === 0) {
        const newCart = { ...prev };
        delete newCart[item.id];
        return newCart;
      }
      return { ...prev, [item.id]: { item, quantity: newQty } };
    });
  };

  const getCartTotal = () => {
    return Object.values(cart).reduce((sum, cartItem) => sum + (parseFloat(cartItem.item.price) * cartItem.quantity), 0);
  };

  const getCartDescription = () => {
    return Object.values(cart).map(c => `${c.quantity}x ${c.item.name}`).join(', ');
  };

  const handleAddParcel = async () => {
    const desc = getCartDescription();
    const totalAmount = getCartTotal();

    if (!desc) {
      Alert.alert('Empty Cart', 'Please add items to the parcel.');
      return;
    }
    
    try {
      setAdding(true);
      await api.post(`/restaurants/${restaurantId}/parcels`, {
        description: desc,
        amount: totalAmount
      });
      setCart({}); // clear cart
      setShowAddModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to add parcel:', error);
      Alert.alert('Error', 'Could not add parcel.');
    } finally {
      setAdding(false);
    }
  };

  const handleStatusUpdate = async (parcelId, newStatus) => {
    try {
      await api.patch(`/restaurants/${restaurantId}/parcels/${parcelId}/status`, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Failed to update parcel:', error);
      Alert.alert('Error', 'Could not update parcel status.');
    }
  };

  const handleRemove = (parcelId, parcelNumber) => {
    Alert.alert(
      'Mark as Picked Up',
      `Remove Parcel #${parcelNumber} from the list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Picked Up',
          style: 'destructive',
          onPress: () => handleStatusUpdate(parcelId, 'PICKED_UP')
        }
      ]
    );
  };

  // ─── Stat Card ──────────────────────────────────────────────────────────
  const StatCard = ({ emoji, value, label, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  // ─── Parcel Card ────────────────────────────────────────────────────────
  const ParcelCard = ({ item }) => {
    const isReady = item.status === 'READY';
    const statusColor = isReady ? '#10B981' : Colors.primary;
    const statusBg = isReady ? '#ECFDF5' : 'rgba(249,115,22,0.08)';
    const statusLabel = isReady ? 'Ready' : 'Waiting';

    return (
      <Animated.View style={[styles.parcelCard, Shadows.md, { opacity: fadeAnim }]}>
        {/* Top Row: Number + Status */}
        <View style={styles.parcelTopRow}>
          <View style={styles.parcelNumberBadge}>
            <Text style={styles.parcelNumberText}>#{item.parcelNumber}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionLabel}>Items</Text>
          <Text style={styles.descriptionText}>{item.description}</Text>
        </View>

        {/* Amount */}
        {parseFloat(item.amount) > 0 && (
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amountValue}>₹{parseFloat(item.amount).toLocaleString()}</Text>
          </View>
        )}

        {/* Time + Live Waiting Duration */}
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>
            {new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {(() => {
            const wait = getWaitingTime(item.createdAt);
            return (
              <View style={[styles.waitingBadge, { backgroundColor: wait.color + '18' }]}>
                <Text style={[styles.waitingText, { color: wait.color }]}>⏱ {wait.text}</Text>
              </View>
            );
          })()}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {!isReady ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
              onPress={() => handleStatusUpdate(item.id, 'READY')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>✓  Mark Ready</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
              onPress={() => handleRemove(item.id, item.parcelNumber)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>📦  Picked Up</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtnSmall]}
            onPress={() => {
              Alert.alert(
                'Cancel Parcel',
                `Cancel Parcel #${item.parcelNumber}?`,
                [
                  { text: 'No', style: 'cancel' },
                  { text: 'Cancel Parcel', style: 'destructive', onPress: () => handleStatusUpdate(item.id, 'CANCELLED') }
                ]
              );
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // ─── Empty State ────────────────────────────────────────────────────────
  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyTitle}>No Active Parcels</Text>
      <Text style={styles.emptySubtitle}>
        Tap the + button to add a new parcel{'\n'}when a customer requests takeaway
      </Text>
    </View>
  );

  // ─── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Parcels" subtitle="Takeaway Management" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Parcels"
        subtitle="Takeaway Management"
        rightSlot={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>+  Add</Text>
          </TouchableOpacity>
        }
      />

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard emoji="⏳" value={stats.active} label="Waiting" color={Colors.primary} />
        <StatCard emoji="✅" value={stats.ready} label="Ready" color="#10B981" />
        <StatCard emoji="📦" value={stats.completedToday} label="Done" color="#6366F1" />
        <StatCard emoji="💰" value={`₹${stats.todayRevenue}`} label="Revenue" color="#0EA5E9" />
      </View>

      {/* Parcel List */}
      <FlatList
        data={parcels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ParcelCard item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />

      {/* ─── POS Add Parcel Modal ──────────────────────────────────────── */}
      <Modal visible={showAddModal} animationType="slide" transparent={true} onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.posModalOverlay}>
          <View style={styles.posModalContainer}>
            <View style={styles.posModalHeader}>
              <View>
                <Text style={styles.posModalTitle}>New Parcel</Text>
                <Text style={styles.posModalSubtitle}>Select items for takeaway</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.posCloseBtn}>
                <Text style={{ fontSize: 24, color: Colors.textMuted, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Categories */}
            <View style={styles.posCategoriesWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.posCategories}>
                <TouchableOpacity
                  style={[styles.posCatPill, activeCategory === 'All' && styles.posCatPillActive]}
                  onPress={() => setActiveCategory('All')}
                >
                  <Text style={[styles.posCatText, activeCategory === 'All' && styles.posCatTextActive]}>All</Text>
                </TouchableOpacity>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.posCatPill, activeCategory === cat.id && styles.posCatPillActive]}
                    onPress={() => setActiveCategory(cat.id)}
                  >
                    <Text style={[styles.posCatText, activeCategory === cat.id && styles.posCatTextActive]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Menu Items */}
            <FlatList
              data={activeCategory === 'All' ? categories.flatMap(c => c.menuItems) : categories.find(c => c.id === activeCategory)?.menuItems || []}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.posMenuList}
              ListEmptyComponent={
                <View style={styles.centered}><Text style={{color: Colors.textMuted, marginTop: 40}}>No items available.</Text></View>
              }
              renderItem={({ item }) => {
                if (!item.isAvailable) return null;
                return (
                  <View style={styles.posMenuItem}>
                    <View style={styles.posMenuItemInfo}>
                      <View style={styles.posMenuTitleRow}>
                        <View style={[styles.posVegBadge, { borderColor: item.isVeg ? Colors.success : Colors.error }]}>
                          <View style={[styles.posVegDot, { backgroundColor: item.isVeg ? Colors.success : Colors.error }]} />
                        </View>
                        <Text style={styles.posMenuName}>{item.name}</Text>
                      </View>
                      <Text style={styles.posMenuPrice}>₹{parseFloat(item.price).toFixed(2)}</Text>
                    </View>
                    
                    <View style={styles.posQuantityControl}>
                      {cart[item.id] ? (
                        <>
                          <TouchableOpacity style={styles.posQtyBtn} onPress={() => updateCart(item, -1)}>
                            <Text style={styles.posQtyBtnText}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.posQtyText}>{cart[item.id].quantity}</Text>
                          <TouchableOpacity style={styles.posQtyBtn} onPress={() => updateCart(item, 1)}>
                            <Text style={styles.posQtyBtnText}>+</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity style={styles.posAddBtn} onPress={() => updateCart(item, 1)}>
                          <Text style={styles.posAddBtnText}>ADD</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              }}
            />

            {/* Cart Summary Footer */}
            {Object.keys(cart).length > 0 && (
              <View style={styles.posCartFooter}>
                <View style={styles.posCartInfo}>
                  <Text style={styles.posCartItemsText}>{Object.values(cart).reduce((s, c) => s + c.quantity, 0)} Items</Text>
                  <Text style={styles.posCartTotalText}>₹{getCartTotal().toLocaleString()}</Text>
                </View>
                <TouchableOpacity style={styles.posSubmitBtn} onPress={handleAddParcel} disabled={adding}>
                  {adding ? <ActivityIndicator color="#fff" /> : <Text style={styles.posSubmitText}>Confirm Parcel</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    borderLeftWidth: 3,
    ...Shadows.sm,
  },
  statEmoji: { fontSize: 16, marginBottom: 2 },
  statValue: { fontSize: Typography.lg, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', color: Colors.textMuted, marginTop: 1 },

  // List
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.huge + 40,
    gap: Spacing.md,
  },

  // Parcel Card
  parcelCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  parcelTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  parcelNumberBadge: {
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  parcelNumberText: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: Colors.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: Typography.xs,
    fontWeight: '700',
  },

  // Description
  descriptionContainer: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  descriptionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: Typography.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
    lineHeight: 20,
  },

  // Amount
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: 4,
  },
  amountLabel: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  amountValue: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  // Time + Waiting
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: 4,
  },
  timeText: {
    fontSize: Typography.xs,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  waitingText: {
    fontSize: Typography.xs,
    fontWeight: '700',
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: Typography.sm,
  },
  actionBtnSmall: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.textMuted,
  },

  // Add Button (header)
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    ...Shadows.glow(),
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: Typography.sm,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: Spacing.xxl,
  },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.lg },
  emptyTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.sm,
    fontWeight: '500',
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ─── POS Modal Styles ──────────────────────────────────────────────────
  posModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    justifyContent: 'flex-end',
  },
  posModalContainer: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    height: '92%',
    paddingTop: Spacing.lg,
  },
  posModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  posModalTitle: {
    fontSize: Typography.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  posModalSubtitle: {
    fontSize: Typography.sm,
    fontWeight: '500',
    color: Colors.textMuted,
    marginTop: 2,
  },
  posCloseBtn: {
    padding: Spacing.sm,
  },
  posCategoriesWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.md,
  },
  posCategories: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  posCatPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  posCatPillActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  posCatText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  posCatTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  posMenuList: {
    padding: Spacing.xl,
    paddingBottom: 100,
  },
  posMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  posMenuItemInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  posMenuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  posVegBadge: {
    width: 12, height: 12,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
    borderRadius: 2,
  },
  posVegDot: {
    width: 6, height: 6,
    borderRadius: 3,
  },
  posMenuName: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  posMenuPrice: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: 20,
  },
  posQuantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 36,
  },
  posAddBtn: {
    paddingHorizontal: Spacing.xl,
    height: '100%',
    justifyContent: 'center',
    backgroundColor: Colors.primaryGlow,
    borderRadius: Radius.sm,
  },
  posAddBtnText: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: Typography.sm,
  },
  posQtyBtn: {
    width: 36,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  posQtyBtnText: {
    fontSize: Typography.lg,
    fontWeight: '600',
    color: Colors.primary,
  },
  posQtyText: {
    fontSize: Typography.md,
    fontWeight: '800',
    color: Colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  posCartFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0, right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.lg,
  },
  posCartInfo: {
    flex: 1,
  },
  posCartItemsText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  posCartTotalText: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  posSubmitBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    ...Shadows.glow(),
  },
  posSubmitText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: Typography.md,
  },
});

export default ParcelScreen;
