import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // Add item or increment qty
  const addItem = useCallback((item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.menuItemId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1, specialInstructions: '' }];
    });
  }, []);

  // Set exact quantity (qty=0 removes item)
  const updateQty = useCallback((menuItemId, qty) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: qty } : i))
      );
    }
  }, []);

  const updateInstructions = useCallback((menuItemId, specialInstructions) => {
    setItems((prev) =>
      prev.map((i) => (i.menuItemId === menuItemId ? { ...i, specialInstructions } : i))
    );
  }, []);

  const removeItem = useCallback((menuItemId) => {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQty, updateInstructions, removeItem, clearCart, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
