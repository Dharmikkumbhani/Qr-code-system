import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Alert, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/designSystem';
import api from '../services/api';
import { getStoredUser } from '../services/authService';
import { initiateSocketConnection } from '../services/socket';
import QRCode from 'react-native-qrcode-svg';

const TablesScreen = ({ navigation }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [addingTable, setAddingTable] = useState(false);

  // Add tables modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addCount, setAddCount] = useState('1');

  useEffect(() => {
    const initialize = async () => {
      const user = await getStoredUser();
      if (user?.restaurants && user.restaurants.length > 0) {
        const rId = user.restaurants[0].id;
        setRestaurantId(rId);

        const socket = initiateSocketConnection(rId);
        
        socket.on('newOrder', () => fetchTables(rId));
        socket.on('orderUpdated', () => fetchTables(rId));
        socket.on('billRequested', () => fetchTables(rId));

      } else {
        setLoading(false);
      }
    };
    initialize();
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
      if (restaurantId) fetchTables(restaurantId);
    }, [restaurantId])
  );

  const handleAddTable = async () => {
    if (!restaurantId) return;
    const countNum = parseInt(addCount) || 1;
    setAddingTable(true);
    try {
      await api.post(`/restaurants/${restaurantId}/tables`, { count: countNum });
      await fetchTables(restaurantId);
      setAddModalVisible(false);
      setAddCount('1');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add tables.');
    } finally {
      setAddingTable(false);
    }
  };

  const handleDeleteTable = async () => {
    if (!selectedTable || !restaurantId) return;
    try {
      await api.delete(`/restaurants/${restaurantId}/tables/${selectedTable.id}`);
      setModalVisible(false);
      await fetchTables(restaurantId);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete table.');
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete Table",
      `Are you sure you want to delete ${selectedTable?.tableNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: handleDeleteTable }
      ]
    );
  };

  const openTableOptions = (table) => {
    setSelectedTable(table);
    setModalVisible(true);
  };

  const occupiedCount = tables.filter(t => t.orders && t.orders.length > 0).length;
  const freeCount = tables.length - occupiedCount;

  const STATUS = [
    { label: 'Free',     count: freeCount, color: Colors.success, bg: Colors.successBg },
    { label: 'Occupied', count: occupiedCount, color: Colors.error,   bg: Colors.errorBg   },
    { label: 'Total',    count: tables.length, color: Colors.info,    bg: Colors.infoBg    },
  ];

  const sortedTables = [...tables].sort((a, b) => {
    const numA = parseInt(a.tableNumber.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.tableNumber.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  const paddedTables = [...sortedTables];
  while (paddedTables.length % 3 !== 0) {
    paddedTables.push({ id: `blank-${paddedTables.length}`, empty: true });
  }

  const tableUrl = selectedTable ? `http://localhost:5175${selectedTable.qrCodeUrl}?t=${selectedTable.id}` : '';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Tables</Text>
            <Text style={styles.headerSub}>Live floor overview</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setAddModalVisible(true)} 
          >
            <Text style={styles.addButtonText}>+ Add Tables</Text>
          </TouchableOpacity>
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
                data={paddedTables}
                keyExtractor={(item) => item.id}
                numColumns={3}
                columnWrapperStyle={{ gap: 16 }}
                contentContainerStyle={{ gap: 16, paddingBottom: Spacing.xxl }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  if (item.empty) {
                    return <View style={[styles.tableCell, styles.itemInvisible]} />;
                  }

                  const isOccupied = item.orders && item.orders.length > 0;
                  return (
                    <TouchableOpacity 
                      activeOpacity={0.8}
                      onPress={() => {
                        if (isOccupied) {
                          navigation.navigate('Dashboard', { screen: 'OrderList' });
                        } else {
                          openTableOptions(item);
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

      {/* Table Options / QR Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedTable?.tableNumber}</Text>
            
            {selectedTable && (
              <View style={styles.qrContainer}>
                <QRCode
                  value={tableUrl}
                  size={150}
                />
              </View>
            )}
            <Text style={styles.qrHelpText}>Customer scans this to order</Text>

            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: Colors.error }]} 
              onPress={confirmDelete}
            >
              <Text style={styles.modalButtonText}>Delete Table</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }]} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: Colors.textPrimary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Tables Modal */}
      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Tables</Text>
            <Text style={styles.qrHelpText}>How many tables would you like to add?</Text>

            <TextInput
              style={styles.numberInput}
              keyboardType="number-pad"
              value={addCount}
              onChangeText={setAddCount}
              maxLength={2}
            />

            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: Colors.primary, opacity: addingTable ? 0.7 : 1 }]} 
              onPress={handleAddTable}
              disabled={addingTable}
            >
              <Text style={styles.modalButtonText}>
                {addingTable ? 'Adding...' : 'Confirm'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.sm }]} 
              onPress={() => setAddModalVisible(false)}
              disabled={addingTable}
            >
              <Text style={[styles.modalButtonText, { color: Colors.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },

  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: Spacing.xl 
  },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.xxl, fontWeight: Typography.bold },
  headerSub:   { color: Colors.textSecondary, fontSize: Typography.sm, marginTop: 2 },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: Typography.bold,
    fontSize: Typography.sm,
  },

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
    flex: 1,
    aspectRatio: 1,
    borderRadius: Radius.lg,
    borderWidth: 1.5, 
    justifyContent: 'center', alignItems: 'center',
    padding: Spacing.sm,
    ...Shadows.md,
  },
  tableFree: {
    backgroundColor: '#ffffff',
    borderColor: Colors.success,
  },
  tableOccupied: {
    backgroundColor: Colors.errorBg,
    borderColor: Colors.error,
  },
  itemInvisible: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  tableCellNum: { 
    color: Colors.textPrimary, 
    fontSize: Typography.xl, 
    fontWeight: Typography.bold 
  },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptySub: { color: Colors.textSecondary, fontSize: Typography.sm, textAlign: 'center' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  qrContainer: {
    padding: Spacing.md,
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  qrHelpText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  modalButton: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    width: '100%',
    padding: Spacing.md,
    fontSize: Typography.xl,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    backgroundColor: '#fff',
  },
});

export default TablesScreen;
