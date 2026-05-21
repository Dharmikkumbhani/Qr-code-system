import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'ownerToken';
const USER_KEY = 'ownerUser';

// Login owner with email + password
// Backend response: { success, message, data: { user, token } }
export const loginOwner = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { user, token } = response.data.data;
  if (token) {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [USER_KEY, JSON.stringify(user)],
    ]);
  }
  return { user, token };
};

// Logout - clear token and user data
export const logoutOwner = async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
};

// Get cached user from storage (no network call)
export const getStoredUser = async () => {
  try {
    const storedUser = await AsyncStorage.getItem(USER_KEY);
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Get stored token from keychain
export const getStoredToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    return null;
  }
};
