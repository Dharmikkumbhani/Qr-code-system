import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen  from '../screens/DashboardScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';

const Stack = createNativeStackNavigator();

/**
 * DashboardStack — nested stack inside the Dashboard tab.
 * Enables navigating from the order list → order detail
 * without leaving the tab context.
 */
const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OrderList"   component={DashboardScreen}   />
    <Stack.Screen
      name="OrderDetail"
      component={OrderDetailScreen}
      options={{ animation: 'slide_from_right' }}
    />
  </Stack.Navigator>
);

export default DashboardStack;
