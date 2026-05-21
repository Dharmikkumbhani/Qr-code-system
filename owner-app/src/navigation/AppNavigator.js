import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/designSystem';

import SplashScreen  from '../screens/SplashScreen';
import LoginScreen   from '../screens/LoginScreen';
import TabNavigator  from './TabNavigator';

const Stack = createNativeStackNavigator();

/**
 * AppNavigator
 *
 * Auth flow:
 *   loading == true  → SplashScreen (reading keychain)
 *   user != null     → Main (TabNavigator)
 *   user == null     → Login
 *
 * Navigation happens automatically when AuthContext's `user` state changes.
 */
const AppNavigator = () => {
  const { user, loading } = useAuth();

  // Show animated splash while restoring session
  if (loading) return <SplashScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',           // smooth transition between auth states
          contentStyle: { backgroundColor: Colors.bg },
        }}
      >
        {user ? (
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{ animation: 'fade' }}
          />
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ animation: 'fade' }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
