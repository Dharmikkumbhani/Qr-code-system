import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, Alert, Animated, RefreshControl,
  KeyboardAvoidingView, Platform, Dimensions
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
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [adding, setAdding] = useState(false);
  const [restaurantId, setRestaurantId] = useState(null);

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

  const fetchParcels = useCallback(async (showFullLoader = false) => {
    try {
      if (showFullLoader) setLoading(true);
      const user = await getStoredUser();
      if (user?.restaurants && user.restaurants.length > 0) {
        const rId = user.restaurants[0].id;
        setRestaurantId(rId);
        const response = await api.get(`/restaurants/${rId}/parcels`);
        if (response.data.success) {
          setParcels(response.data.data.parcels);
          setStats(response.data.data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch parcels:', error);
      Alert.alert('Error', 'Could not load parcels.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchParcels(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  const handleAddParcel = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter a description of the parcel items.');
      return;
    }
    try {
      setAdding(true);
      await api.post(`/restaurants/${restaurantId}/parcels`, {
        description: description.trim(),
        amount: parseFloat(amount) || 0
      });
      setDescription('');
      setAmount('');
      setShowAddModal(false);
      fetchParcels();
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
      fetchParcels();
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
            onRefresh={() => { setRefreshing(true); fetchParcels(); }}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />

      {/* ─── Add Parcel Modal ──────────────────────────────────────────── */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowAddModal(false)}
          >
            <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
              {/* Handle */}
              <View style={styles.modalHandle} />

              <Text style={styles.modalTitle}>New Parcel</Text>
              <Text style={styles.modalSubtitle}>
                Add items the customer wants for takeaway
              </Text>

              {/* Description Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>What does the customer want? *</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="e.g. 2x Butter Chicken, 3x Naan, 1x Dal..."
                  placeholderTextColor={Colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Amount Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textMuted}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, adding && styles.submitBtnDisabled]}
                onPress={handleAddParcel}
                disabled={adding}
                activeOpacity={0.8}
              >
                {adding ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>📦  Add Parcel</Text>
                )}
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setShowAddModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
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

  // ─── Modal ────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xxl,
    paddingBottom: Platform.OS === 'ios' ? 44 : Spacing.xxl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: Typography.sm,
    fontWeight: '500',
    color: Colors.textMuted,
    marginBottom: Spacing.xxl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.sm,
    padding: Spacing.lg,
    fontSize: Typography.md,
    fontWeight: '500',
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: Spacing.md,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    ...Shadows.glow(),
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: Typography.md,
  },
  cancelModalBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginTop: Spacing.xs,
  },
  cancelModalText: {
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: Typography.sm,
  },
});

export default ParcelScreen;
