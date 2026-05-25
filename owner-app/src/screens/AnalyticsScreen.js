import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert, Image, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { Typography, Spacing, Radius } from '../theme/designSystem';
import api from '../services/api';
import { getStoredUser } from '../services/authService';
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";

// Fintech Theme Colors
const FintechColors = {
  background: '#F8F9FB',
  card: '#FFFFFF',
  primary: '#FF7A00',      // Orange
  primaryLight: '#FFF0E5', // Orange tinted cream
  secondary: '#FFFBF5',    // Warm cream
  accentTeal: '#14B8A6',   // Teal
  success: '#10B981',      // Green
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#F1F5F9',
  danger: '#EF4444'
};

const FintechShadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  }
};

const RevenueOverview = ({ data }) => {
  const [tab, setTab] = useState('today');

  const activeData = data?.[tab] || { revenue: 0, orders: 0, growth: 0 };
  const isPositive = activeData.growth >= 0;

  // Static mock chart data for the beautiful bar chart effect (in a real app, backend would send last 4-6 periods)
  const barData = [
    { value: 40, frontColor: FintechColors.primaryLight },
    { value: 60, frontColor: FintechColors.primaryLight },
    { value: 30, frontColor: FintechColors.primaryLight },
    { value: 80, frontColor: FintechColors.primaryLight },
    { value: 100, frontColor: FintechColors.primary }, // Highlight last bar
  ];

  return (
    <View style={[styles.card, FintechShadows.card]}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['today', 'weekly', 'monthly'].map(t => (
          <TouchableOpacity 
            key={t} 
            style={[styles.tab, tab === t && styles.activeTab]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.revenueBody}>
        <View style={styles.revenueInfo}>
          <Text style={styles.revenueLabel}>Total Revenue</Text>
          <Text style={styles.revenueAmount}>₹{activeData.revenue.toLocaleString()}</Text>
          <View style={styles.growthBadge}>
            <Text style={{ fontSize: 12, marginRight: 4 }}>{isPositive ? '↗' : '↘'}</Text>
            <Text style={[styles.growthText, { color: isPositive ? FintechColors.success : FintechColors.danger }]}>
              {Math.abs(activeData.growth)}% vs last
            </Text>
          </View>
        </View>

        <View style={styles.revenueChart}>
          <BarChart
            data={barData}
            barWidth={12}
            spacing={8}
            roundedTop
            hideRules
            hideYAxisText
            hideAxesAndRules
            height={80}
            width={120}
            isAnimated
          />
        </View>
      </View>
    </View>
  );
};

const OrderAnalytics = ({ dailyData }) => {
  const lineData = dailyData?.map(d => ({ value: d.value, label: d.label })) || [];

  return (
    <View style={[styles.card, FintechShadows.card]}>
      <Text style={styles.cardTitle}>Daily Orders</Text>
      <Text style={styles.cardSubtitle}>Last 7 Days</Text>
      <View style={{ marginTop: 20, alignItems: 'center' }}>
        <LineChart
          data={lineData}
          color={FintechColors.primary}
          thickness={3}
          dataPointsColor={FintechColors.primary}
          hideRules
          hideYAxisText
          yAxisColor="transparent"
          xAxisColor={FintechColors.border}
          height={120}
          width={280}
          spacing={40}
          isAnimated
          initialSpacing={10}
          curved
        />
      </View>
    </View>
  );
};

const CustomerRetention = ({ data }) => {
  const { newUsers = 0, returningUsers = 0, avgOrdersPerUser = 0 } = data || {};
  const total = newUsers + returningUsers || 1;
  const newPct = Math.round((newUsers / total) * 100);
  const retPct = 100 - newPct;

  const pieData = [
    { value: newPct, color: FintechColors.accentTeal },
    { value: retPct, color: FintechColors.primary },
  ];

  return (
    <View style={[styles.card, FintechShadows.card]}>
      <Text style={styles.cardTitle}>Customer Insights</Text>
      <View style={styles.row}>
        <View style={{ marginRight: 20 }}>
          <PieChart
            donut
            data={pieData}
            radius={50}
            innerRadius={35}
            isAnimated
            centerLabelComponent={() => (
              <View style={{justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{fontSize: 20, fontWeight: 'bold', color: FintechColors.textPrimary}}>{total}</Text>
                <Text style={{fontSize: 10, color: FintechColors.textSecondary}}>Users</Text>
              </View>
            )}
          />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', gap: 12 }}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: FintechColors.primary }]} />
            <Text style={styles.legendText}>Returning ({retPct}%)</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: FintechColors.accentTeal }]} />
            <Text style={styles.legendText}>New ({newPct}%)</Text>
          </View>
          <View style={{ marginTop: 8, padding: 8, backgroundColor: FintechColors.secondary, borderRadius: Radius.sm }}>
            <Text style={{ fontSize: 12, color: FintechColors.textPrimary, fontWeight: '700' }}>
              Avg. {avgOrdersPerUser} orders/user
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const RushHourCard = ({ timeAnalytics }) => {
  const { peakOrderTime = "N/A", peakOrdersCount = 0, hourlyData = [] } = timeAnalytics || {};
  
  // Condense 24h into 8 columns for a mini bar chart
  const condensedData = [];
  if (hourlyData.length === 24) {
    for (let i = 8; i < 24; i += 2) {
      condensedData.push({ 
        value: hourlyData[i].value + hourlyData[i+1].value,
        frontColor: FintechColors.primaryLight 
      });
    }
  }

  // Highlight max
  if (condensedData.length > 0) {
    let maxIdx = 0;
    condensedData.forEach((d, i) => { if (d.value > condensedData[maxIdx].value) maxIdx = i; });
    condensedData[maxIdx].frontColor = FintechColors.primary;
  }

  return (
    <View style={[styles.card, FintechShadows.card, { backgroundColor: FintechColors.primary }]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', opacity: 0.8, marginBottom: 4 }}>
            Peak Rush Hour
          </Text>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>{peakOrderTime}</Text>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 4 }}>
            {peakOrdersCount} orders max
          </Text>
        </View>
        {condensedData.length > 0 && (
          <View style={{ height: 60, width: 120 }}>
            <BarChart
              data={condensedData}
              barWidth={8}
              spacing={4}
              roundedTop
              hideRules
              hideAxesAndRules
              height={60}
              width={120}
              isAnimated
            />
          </View>
        )}
      </View>
    </View>
  );
};

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
          <ActivityIndicator size="large" color={FintechColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Dashboard" subtitle="Business Insights" />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <RevenueOverview data={data} />
        
        <RushHourCard timeAnalytics={data?.timeAnalytics} />

        <OrderAnalytics dailyData={data?.orderAnalytics?.dailyData} />

        <CustomerRetention data={data?.customerAnalytics} />

        {/* Top Items Section */}
        <View style={[styles.card, FintechShadows.card, { paddingHorizontal: 0, paddingBottom: 0, overflow: 'hidden' }]}>
          <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm }}>
            <Text style={styles.cardTitle}>Top Selling Items</Text>
          </View>
          <View style={styles.listContainer}>
            {data?.topItems && data.topItems.length > 0 ? (
              data.topItems.map((item, index) => (
                <View key={item.id} style={[styles.listItem, index === data.topItems.length - 1 && { borderBottomWidth: 0 }]}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                  ) : (
                    <View style={styles.itemImagePlaceholder}>
                      <Text style={{ fontSize: 16 }}>🍽️</Text>
                    </View>
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.itemMetaRow}>
                      <Text style={styles.itemSubtitle}>{item.quantitySold} units</Text>
                      <View style={styles.dot} />
                      <Text style={[styles.itemSubtitle, { color: FintechColors.success }]}>₹{(item.revenueGenerated || 0).toLocaleString()}</Text>
                    </View>
                  </View>
                  <View style={styles.trendingIcon}>
                    <Text style={{ fontSize: 16, color: FintechColors.primary }}>↑</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No sales data available.</Text>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: FintechColors.background },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xxl + 40, gap: Spacing.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  
  card: {
    backgroundColor: FintechColors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  cardTitle: {
    fontSize: Typography.md,
    fontWeight: '800',
    color: FintechColors.textPrimary,
  },
  cardSubtitle: {
    fontSize: Typography.xs,
    color: FintechColors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },

  // Revenue Overview
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: FintechColors.background,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  activeTab: {
    backgroundColor: FintechColors.card,
    ...FintechShadows.card,
  },
  tabText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: FintechColors.textSecondary,
  },
  activeTabText: {
    color: FintechColors.primary,
    fontWeight: '800',
  },
  revenueBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  revenueInfo: {
    flex: 1,
  },
  revenueLabel: {
    fontSize: Typography.sm,
    color: FintechColors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  revenueAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: FintechColors.textPrimary,
    letterSpacing: -1,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FintechColors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  growthText: {
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  revenueChart: {
    width: 120,
    alignItems: 'center',
  },

  // Customer Retention
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8, height: 8, borderRadius: 4, marginRight: 8,
  },
  legendText: {
    fontSize: Typography.sm,
    color: FintechColors.textPrimary,
    fontWeight: '600',
  },

  // Top Items
  listContainer: {
    marginTop: Spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: FintechColors.border,
  },
  itemImage: {
    width: 44, height: 44,
    borderRadius: Radius.md,
    marginRight: Spacing.md,
  },
  itemImagePlaceholder: {
    width: 44, height: 44,
    borderRadius: Radius.md,
    marginRight: Spacing.md,
    backgroundColor: FintechColors.secondary,
    justifyContent: 'center', alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: FintechColors.textPrimary,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemSubtitle: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: FintechColors.textSecondary,
  },
  dot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: FintechColors.border,
    marginHorizontal: 6,
  },
  trendingIcon: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: FintechColors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyText: {
    padding: Spacing.xl,
    color: FintechColors.textSecondary,
    fontSize: Typography.sm,
    textAlign: 'center',
  }
});

export default AnalyticsScreen;
