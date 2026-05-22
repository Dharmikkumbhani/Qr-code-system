import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Switch, ScrollView, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/designSystem';
import api from '../services/api';
import { getStoredUser } from '../services/authService';

const MenuScreen = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', description: '', isVeg: true, categoryId: '' });
  const [saving, setSaving] = useState(false);

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

  const openAddModal = () => {
    const defaultCat = (activeCategory !== 'All' ? activeCategory : categories[0]?.id) || '';
    setFormData({ name: '', price: '', description: '', isVeg: true, categoryId: defaultCat });
    setEditingItem(null);
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setFormData({
      name: item.name,
      price: item.price.toString(),
      description: item.description || '',
      isVeg: item.isVeg,
      categoryId: item.categoryId
    });
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleSaveItem = async () => {
    if (!formData.name || !formData.price || !formData.categoryId) {
      Alert.alert('Error', 'Please fill name, price, and category');
      return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        await api.put(`/restaurants/${restaurantId}/menu/items/${editingItem.id}`, formData);
      } else {
        await api.post(`/restaurants/${restaurantId}/menu/items`, formData);
      }
      setModalVisible(false);
      fetchMenu(restaurantId);
    } catch (error) {
      Alert.alert('Error', 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setSaving(true);
        try {
          await api.delete(`/restaurants/${restaurantId}/menu/items/${editingItem.id}`);
          setModalVisible(false);
          fetchMenu(restaurantId);
        } catch (error) {
          Alert.alert('Error', 'Failed to delete item');
        } finally {
          setSaving(false);
        }
      }}
    ]);
  };

  // Flatten items for "All" view or filter by active category
  const displayedItems = activeCategory === 'All' 
    ? categories.flatMap(c => c.menuItems)
    : categories.find(c => c.id === activeCategory)?.menuItems || [];

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemCard} onPress={() => openEditModal(item)} activeOpacity={0.7}>
      <View style={styles.itemInfo}>
        <View style={styles.titleRow}>
          {item.isVeg ? (
            <View style={[styles.vegBadge, { borderColor: Colors.success }]}><View style={[styles.vegDot, { backgroundColor: Colors.success }]} /></View>
          ) : (
            <View style={[styles.vegBadge, { borderColor: Colors.error }]}><View style={[styles.vegDot, { backgroundColor: Colors.error }]} /></View>
          )}
          <Text style={styles.itemName}>{item.name}</Text>
        </View>
        <Text style={styles.itemPrice}>₹{parseFloat(item.price).toFixed(2)}</Text>
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
    </TouchableOpacity>
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
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <Text style={styles.addBtnText}>+ Add Item</Text>
          </TouchableOpacity>
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

        {/* Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'Add Item'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Text style={{ fontSize: 20 }}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Name *</Text>
                <TextInput style={styles.input} value={formData.name} onChangeText={(text) => setFormData({...formData, name: text})} placeholder="Item name" />

                <Text style={styles.label}>Price (₹) *</Text>
                <TextInput style={styles.input} value={formData.price} onChangeText={(text) => setFormData({...formData, price: text})} placeholder="0.00" keyboardType="numeric" />

                <Text style={styles.label}>Description</Text>
                <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={formData.description} onChangeText={(text) => setFormData({...formData, description: text})} placeholder="Description" multiline />

                <View style={styles.switchRow}>
                  <Text style={styles.label}>Vegetarian?</Text>
                  <Switch value={formData.isVeg} onValueChange={(val) => setFormData({...formData, isVeg: val})} trackColor={{ false: Colors.border, true: Colors.success + '80' }} thumbColor={formData.isVeg ? Colors.success : Colors.textMuted} />
                </View>

                <Text style={styles.label}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.xl }}>
                  {categories.map(c => (
                    <TouchableOpacity key={c.id} style={[styles.catPickPill, formData.categoryId === c.id && styles.catPickPillActive]} onPress={() => setFormData({...formData, categoryId: c.id})}>
                      <Text style={[styles.catPickText, formData.categoryId === c.id && styles.catPickTextActive]}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </ScrollView>

              <View style={styles.modalFooter}>
                {editingItem && (
                  <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteItem} disabled={saving}>
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.saveBtn, editingItem ? {flex: 1, marginLeft: Spacing.md} : {flex: 1}]} onPress={handleSaveItem} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

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
  },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: Typography.bold,
    fontSize: Typography.sm,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  formScroll: {
    padding: Spacing.lg,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: Typography.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  catPickPill: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border,
    marginRight: 8,
  },
  catPickPillActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  catPickText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  catPickTextActive: {
    color: Colors.primary,
    fontWeight: Typography.bold,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  deleteBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    justifyContent: 'center', alignItems: 'center',
  },
  deleteBtnText: {
    color: Colors.error,
    fontWeight: Typography.bold,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: Typography.bold,
    fontSize: Typography.md,
  }
});

export default MenuScreen;
