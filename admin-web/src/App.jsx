import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Restaurants from './pages/Restaurants';
import RestaurantMenu from './pages/RestaurantMenu';
import RestaurantQRCodes from './pages/RestaurantQRCodes';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Home />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/restaurants" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Restaurants />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/restaurants/:id/menu" 
            element={
              <ProtectedRoute>
                <Layout>
                  <RestaurantMenu />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/restaurants/:id/qrcodes" 
            element={
              <ProtectedRoute>
                <Layout>
                  <RestaurantQRCodes />
                </Layout>
              </ProtectedRoute>
            } 
          />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
