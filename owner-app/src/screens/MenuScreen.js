import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Switch, ScrollView, Alert } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/designSystem';
import api from '../services/api';
import { getStoredUser } from '../services/authService';

const MenuScreen = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const initialize = async () => {
      const user = await getStoredUser();
      if (user?.restaurants && user.restaurants.length > 0) {
        const rId = user.restaurants[0].id;
        setRestaurantId(rId);
        fetchMenu(rId);
      } else {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  const fetchMenu = async (rId) => {
    try {
      const response = await api.get(`/restaurants/${rId}/menu`);
      if (response.data.success) {
        setCategories(response.data.data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch menu:', error);
      Alert.alert('Error', 'Could not load menu.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (item) => {
    // Optimistic update
    const updatedCategories = categories.map(cat => ({
      ...cat,
      menuItems: cat.menuItems.map(m => 
        m.id === item.id ? { ...m, isAvailable: !m.isAvailable } : m
      )
    }));
    setCategories(updatedCategories);

    try {
      await api.put(`/restaurants/${restaurantId}/menu/items/${item.id}`, {
        isAvailable: !item.isAvailable
      });
    } catch (error) {
      console.error('Failed to update availability:', error);
      // Revert on error
      fetchMenu(restaurantId);
      Alert.alert('Error', 'Failed to update item status');
    }
  };

  // Flatten items for "All" view or filter by active category
  const displayedItems = activeCategory === 'All' 
    ? categories.flatMap(c => c.menuItems)
    : categories.find(c => c.id === activeCategory)?.menuItems || [];

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <View style={styles.titleRow}>
          {item.isVeg ? (
            <View style={[styles.vegBadge, { borderColor: Colors.success }]}><View style={[styles.vegDot, { backgroundColor: Colors.success }]} /></View>
          ) : (
            <View style={[styles.vegBadge, { borderColor: Colors.error }]}><View style={[styles.vegDot, { backgroundColor: Colors.error }]} /></View>
          )}
          <Text style={styles.itemName}>{item.name}</Text>
        </View>
        <Text style={styles.itemPrice}>${parseFloat(item.price).toFixed(2)}</Text>
      </View>
      <View style={styles.itemActions}>
        <Text style={[styles.statusText, { color: item.isAvailable ? Colors.success : Colors.error }]}>
          {item.isAvailable ? 'In Stock' : 'Out of Stock'}
        </Text>
        <Switch
          value={item.isAvailable}
          onValueChange={() => toggleAvailability(item)}
          trackColor={{ false: Colors.border, true: Colors.success + '80' }}
          thumbColor={item.isAvailable ? Colors.success : Colors.textMuted}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Menu</Text>
            <Text style={styles.headerSub}>Manage item availability</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : categories.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No menu categories found.</Text>
          </View>
        ) : (
          <>
            {/* Category pills */}
            <View style={styles.pillContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                <TouchableOpacity 
                  style={[styles.pill, activeCategory === 'All' && styles.pillActive]}
                  onPress={() => setActiveCategory('All')}
                >
                  <Text style={[styles.pillText, activeCategory === 'All' && styles.pillTextActive]}>All Items</Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity 
                    key={cat.id} 
                    style={[styles.pill, activeCategory === cat.id && styles.pillActive]}
                    onPress={() => setActiveCategory(cat.id)}
                  >
                    <Text style={[styles.pillText, activeCategory === cat.id && styles.pillTextActive]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Menu Items List */}
            <FlatList
              data={displayedItems}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: Spacing.xxl }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.centered}>
                  <Text style={styles.emptyText}>No items in this category.</Text>
                </View>
              }
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.xxl, fontWeight: Typography.bold },
  headerSub:   { color: Colors.textSecondary, fontSize: Typography.sm, marginTop: 2 },
  
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: Typography.md },

  pillContainer: {
    marginBottom: Spacing.lg,
  },
  pillRow: { 
    flexDirection: 'row', 
    gap: 8, 
    paddingRight: Spacing.xl 
  },
  pill: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border,
  },
  pillActive:      { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  pillText:        { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.medium },
  pillTextActive:  { color: Colors.primary, fontWeight: Typography.bold },

  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadows.sm,
  },
  itemInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vegBadge: {
    width: 12, height: 12,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
    borderRadius: 2,
  },
  vegDot: {
    width: 6, height: 6,
    borderRadius: 3,
  },
  itemName: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  itemPrice: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
    marginLeft: 20, // Align with text
  },
  itemActions: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    marginBottom: 4,
  }
});

export default MenuScreen;
