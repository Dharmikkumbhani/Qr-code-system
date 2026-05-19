import api from './api';
import * as Keychain from 'react-native-keychain';

// Login owner with email + password
// Backend response: { success, message, data: { user, token } }
export const loginOwner = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { user, token } = response.data.data;
  if (token) {
    // Store token securely in keychain
    await Keychain.setGenericPassword('ownerToken', token);
    // Store user data in keychain as well
    await Keychain.setGenericPassword('ownerUser', JSON.stringify(user), { service: 'ownerUser' });
  }
  return { user, token };
};

// Logout - clear token and user data
export const logoutOwner = async () => {
  await Keychain.resetGenericPassword();
  await Keychain.resetGenericPassword({ service: 'ownerUser' });
};

// Get cached user from storage (no network call)
export const getStoredUser = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({ service: 'ownerUser' });
    if (credentials) {
      return JSON.parse(credentials.password);
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Get stored token from keychain
export const getStoredToken = async () => {
  try {
    const credentials = await Keychain.getGenericPassword();
    if (credentials) {
      return credentials.password;
    }
    return null;
  } catch (error) {
    return null;
  }
};
