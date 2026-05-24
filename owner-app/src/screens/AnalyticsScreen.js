import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/designSystem';
import api from '../services/api';
import { getStoredUser } from '../services/authService';

const StatCard = ({ title, revenue, ordersCount, color }) => (
  <View style={styles.statCard}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={[styles.statRevenue, { color }]}>₹{revenue.toFixed(2)}</Text>
    <Text style={styles.statOrders}>{ordersCount} {ordersCount === 1 ? 'Order' : 'Orders'}</Text>
  </View>
);

const AnalyticsScreen = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchAnalytics = async () => {
        try {
          const user = await getStoredUser();
          if (user?.restaurants && user.restaurants.length > 0) {
            const rId = user.restaurants[0].id;
            const response = await api.get(`/restaurants/${rId}/analytics`);
            if (response.data.success) {
              setData(response.data.data);
            }
          }
        } catch (error) {
          console.error('Failed to fetch analytics:', error);
          Alert.alert('Error', 'Could not load analytics data.');
        } finally {
          setLoading(false);
        }
      };

      fetchAnalytics();
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Analytics" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Analytics" subtitle="How your business is doing 📈" />
      
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
        
        {/* Revenue Overview */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsRow}>
          <StatCard 
            title="Today's Sales" 
            revenue={data?.today?.revenue || 0} 
            ordersCount={data?.today?.orders || 0} 
            color={Colors.primary} 
          />
          <StatCard 
            title="This Month" 
            revenue={data?.monthly?.revenue || 0} 
            ordersCount={data?.monthly?.orders || 0} 
            color={Colors.success} 
          />
        </View>

        {/* Top Items */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Top Selling Items</Text>
        <Text style={styles.sectionSubtitle}>Most popular items by quantity sold</Text>

        <View style={styles.topItemsContainer}>
          {data?.topItems && data.topItems.length > 0 ? (
            data.topItems.map((item, index) => (
              <View key={item.id} style={styles.topItemRow}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                ) : (
                  <View style={styles.itemImagePlaceholder}>
                    <Text style={{ fontSize: 16 }}>🍽️</Text>
                  </View>
                )}

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemPrice}>₹{parseFloat(item.price || 0).toFixed(2)}</Text>
                </View>

                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyText}>{item.quantitySold} sold</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No sales data available yet.</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  sectionTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadows.sm,
  },
  statTitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
    marginBottom: Spacing.sm,
  },
  statRevenue: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    marginBottom: 4,
  },
  statOrders: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },

  topItemsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  topItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rankBadge: {
    width: 32,
    alignItems: 'center',
  },
  rankText: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
  },
  itemImage: {
    width: 44, height: 44,
    borderRadius: Radius.sm,
    marginHorizontal: Spacing.sm,
  },
  itemImagePlaceholder: {
    width: 44, height: 44,
    borderRadius: Radius.sm,
    marginHorizontal: Spacing.sm,
    backgroundColor: Colors.bg,
    borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  qtyBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  qtyText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
  }
});

export default AnalyticsScreen;
