import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [token, setToken] = useState(null);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('customer_token');
      const savedCustomer = localStorage.getItem('customer_info');
      if (savedToken && savedCustomer) {
        setToken(savedToken);
        setCustomer(JSON.parse(savedCustomer));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const setAuth = ({ customer: c, token: t }) => {
    setCustomer(c);
    setToken(t);
    localStorage.setItem('customer_token', t);
    localStorage.setItem('customer_info', JSON.stringify(c));
  };

  const logout = () => {
    setCustomer(null);
    setToken(null);
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_info');
  };

  return (
    <AuthContext.Provider value={{ customer, token, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
