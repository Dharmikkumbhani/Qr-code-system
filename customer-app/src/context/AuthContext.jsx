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
      const savedExpiry = localStorage.getItem('customer_token_expiry');

      if (savedToken && savedCustomer && savedExpiry) {
        if (Date.now() < parseInt(savedExpiry, 10)) {
          setToken(savedToken);
          setCustomer(JSON.parse(savedCustomer));
        } else {
          // Token expired, clear it
          localStorage.removeItem('customer_token');
          localStorage.removeItem('customer_info');
          localStorage.removeItem('customer_token_expiry');
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const setAuth = ({ customer: c, token: t }) => {
    setCustomer(c);
    setToken(t);
    // Set expiry to 2 hours from now (2 * 60 * 60 * 1000)
    const expiry = Date.now() + 2 * 60 * 60 * 1000;
    
    localStorage.setItem('customer_token', t);
    localStorage.setItem('customer_info', JSON.stringify(c));
    localStorage.setItem('customer_token_expiry', expiry.toString());
  };

  const logout = () => {
    setCustomer(null);
    setToken(null);
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_info');
    localStorage.removeItem('customer_token_expiry');
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
