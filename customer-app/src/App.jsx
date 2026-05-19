import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import MenuPage from './pages/MenuPage';
import OrderSuccess from './pages/OrderSuccess';

// Redirect / → 404 since a slug is required
function RootRedirect() {
  return <div>Please scan a valid restaurant QR code.</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/menu/:slug" element={<MenuPage />} />
            <Route path="/order/:orderId" element={<OrderSuccess />} />
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
