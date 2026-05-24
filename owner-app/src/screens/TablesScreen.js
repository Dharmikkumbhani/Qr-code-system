import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/designSystem';
import api from '../services/api';
import { getStoredUser } from '../services/authService';
import { initiateSocketConnection, disconnectSocket } from '../services/socket';

const TablesScreen = ({ navigation }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      const user = await getStoredUser();
      if (user?.restaurants && user.restaurants.length > 0) {
        const rId = user.restaurants[0].id;
        setRestaurantId(rId);
        fetchTables(rId);

        // Optional: We can listen to socket events to live-update table occupation
        const socket = initiateSocketConnection(rId);
        
        socket.on('newOrder', () => {
          fetchTables(rId); // Re-fetch to update table occupation
        });
        socket.on('orderUpdated', () => {
          fetchTables(rId); // Re-fetch to update table occupation if completed
        });
        socket.on('billRequested', () => {
          fetchTables(rId); 
        });

      } else {
        setLoading(false);
      }
    };
    initialize();

    // No need to disconnect socket here since it's shared, or we can just leave it to DashboardScreen to manage.
  }, []);

  const fetchTables = async (rId) => {
    try {
      const response = await api.get(`/restaurants/${rId}/tables`);
      if (response.data.success) {
        setTables(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error);
      Alert.alert('Error', 'Could not load tables.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (restaurantId) {
        fetchTables(restaurantId);
      }
    }, [restaurantId])
  );

  const occupiedCount = tables.filter(t => t.orders && t.orders.length > 0).length;
  const freeCount = tables.length - occupiedCount;

  const STATUS = [
    { label: 'Free',     count: freeCount, color: Colors.success, bg: Colors.successBg },
    { label: 'Occupied', count: occupiedCount, color: Colors.error,   bg: Colors.errorBg   },
    { label: 'Total',    count: tables.length, color: Colors.info,    bg: Colors.infoBg    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tables</Text>
          <Text style={styles.headerSub}>Live floor overview</Text>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            {/* Status summary */}
            <View style={styles.statusRow}>
              {STATUS.map((s) => (
                <View key={s.label} style={[styles.statusCard, { backgroundColor: s.bg, borderColor: s.color + '40' }]}>
                  <Text style={[styles.statusCount, { color: s.color }]}>{s.count}</Text>
                  <Text style={[styles.statusLabel, { color: s.color }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Table grid */}
            <View style={styles.gridLabel}>
              <Text style={styles.gridLabelText}>Floor Plan</Text>
            </View>

            {tables.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptySub}>No tables configured for this restaurant.</Text>
              </View>
            ) : (
              <FlatList
                data={tables}
                keyExtractor={(item) => item.id}
                numColumns={4}
                columnWrapperStyle={{ gap: 12 }}
                contentContainerStyle={{ gap: 12, paddingBottom: Spacing.xxl }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isOccupied = item.orders && item.orders.length > 0;
                  // If occupied, maybe we want to allow tapping to go to Dashboard/Orders? 
                  // For now, we just show it.
                  return (
                    <TouchableOpacity 
                      activeOpacity={isOccupied ? 0.8 : 1}
                      onPress={() => {
                        if (isOccupied) {
                          navigation.navigate('Dashboard', { screen: 'OrderList' });
                        }
                      }}
                      style={[
                        styles.tableCell,
                        isOccupied ? styles.tableOccupied : styles.tableFree
                      ]}
                    >
                      <Text style={[styles.tableCellNum, isOccupied && { color: '#fff' }]}>
                        {item.tableNumber.replace('Table ', '')}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },

  header: { marginBottom: Spacing.xl },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.xxl, fontWeight: Typography.bold },
  headerSub:   { color: Colors.textSecondary, fontSize: Typography.sm, marginTop: 2 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  statusRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.xxl },
  statusCard: {
    flex: 1, borderRadius: Radius.md,
    borderWidth: 1, padding: Spacing.md,
    alignItems: 'center',
  },
  statusCount: { fontSize: Typography.xxl, fontWeight: Typography.bold, marginBottom: 2 },
  statusLabel: { fontSize: Typography.xs, fontWeight: Typography.semibold },

  gridLabel: { marginBottom: Spacing.md },
  gridLabelText: { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: Typography.semibold, letterSpacing: 1, textTransform: 'uppercase' },

  tableCell: {
    flex: 1, // makes it grow equally
    aspectRatio: 1,
    borderRadius: Radius.md,
    borderWidth: 1, 
    justifyContent: 'center', alignItems: 'center',
    ...Shadows.sm,
  },
  tableFree: {
    backgroundColor: Colors.surface,
    borderColor: Colors.success,
  },
  tableOccupied: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  tableCellNum: { 
    color: Colors.textPrimary, 
    fontSize: Typography.lg, 
    fontWeight: Typography.bold 
  },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptySub: { color: Colors.textSecondary, fontSize: Typography.sm, textAlign: 'center' },
});

export default TablesScreen;
