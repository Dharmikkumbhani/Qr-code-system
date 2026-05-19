import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginOwner, logoutOwner, getStoredUser } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true = checking storage on startup

  // On app start, restore session from keychain (no network needed)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedUser = await getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        }
      } catch (e) {
        // Token corrupt or missing — stay logged out
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const { user: loggedInUser } = await loginOwner(email, password);
    setUser(loggedInUser);
  };

  const logout = async () => {
    await logoutOwner();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
