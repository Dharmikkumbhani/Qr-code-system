import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, LayoutDashboard, Store, 
  Settings, LogOut, QrCode, User
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Restaurants', path: '/restaurants', icon: Store },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="layout-container">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <QrCode size={28} color="var(--primary-color)" />
            <span className="brand-text">PetPooja-QR</span>
          </div>
          <button 
            className="mobile-close-btn"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-wrapper">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button 
              className="menu-toggle"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="page-title">
              {navLinks.find(l => l.path === location.pathname)?.name || 'Admin Panel'}
            </h2>
          </div>
          
          <div className="header-right">
            <div className="user-profile">
              <div className="avatar">
                <User size={18} />
              </div>
              <div className="user-info">
                <span className="user-name">{user?.name || 'Admin User'}</span>
                <span className="user-role">{user?.role || 'SUPER_ADMIN'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="main-content">
          {children}
        </main>
      </div>

      <style>
        {`
          .layout-container {
            display: flex;
            min-height: 100vh;
            background-color: var(--bg-color);
          }

          /* Sidebar Setup */
          .sidebar {
            width: var(--sidebar-width);
            background-color: var(--surface-color);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            z-index: 50;
            transition: transform 0.3s ease;
          }

          .sidebar-header {
            height: var(--header-height);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 1.5rem;
            border-bottom: 1px solid var(--border-color);
          }

          .brand {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .brand-text {
            font-weight: 700;
            font-size: 1.125rem;
            color: var(--text-primary);
          }

          .mobile-close-btn {
            display: none;
            color: var(--text-secondary);
          }

          .sidebar-nav {
            flex: 1;
            padding: 1.5rem 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .nav-link {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            color: var(--text-secondary);
            font-weight: 500;
            transition: all 0.2s ease;
          }

          .nav-link:hover {
            background-color: rgba(255, 255, 255, 0.05);
            color: var(--text-primary);
          }

          .nav-link.active {
            background-color: rgba(59, 130, 246, 0.1);
            color: var(--primary-color);
          }

          .sidebar-footer {
            padding: 1.5rem 1rem;
            border-top: 1px solid var(--border-color);
          }

          .logout-button {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            color: var(--danger-color);
            font-weight: 500;
            transition: all 0.2s ease;
          }

          .logout-button:hover {
            background-color: rgba(239, 68, 68, 0.1);
          }

          /* Main Wrapper */
          .main-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            /* Default desktop left margin */
            margin-left: var(--sidebar-width);
          }

          .header {
            height: var(--header-height);
            background-color: var(--surface-color);
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 1.5rem;
            position: sticky;
            top: 0;
            z-index: 40;
          }

          .header-left {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .menu-toggle {
            display: none;
            color: var(--text-primary);
          }

          .page-title {
            font-size: 1.125rem;
            font-weight: 600;
          }

          .user-profile {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background-color: var(--primary-color);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }

          .user-info {
            display: flex;
            flex-direction: column;
          }

          .user-name {
            font-size: 0.875rem;
            font-weight: 600;
          }

          .user-role {
            font-size: 0.75rem;
            color: var(--text-secondary);
          }

          .main-content {
            flex: 1;
            padding: 2rem;
            overflow-y: auto;
          }

          /* Mobile Styles */
          @media (max-width: 768px) {
            .sidebar {
              transform: translateX(-100%);
            }
            .sidebar.open {
              transform: translateX(0);
            }
            .mobile-close-btn {
              display: block;
            }
            .main-wrapper {
              margin-left: 0;
            }
            .menu-toggle {
              display: block;
            }
            .sidebar-overlay {
              position: fixed;
              inset: 0;
              background-color: rgba(0,0,0,0.5);
              z-index: 45;
              backdrop-filter: blur(2px);
            }
            .user-info {
              display: none;
            }
            .main-content {
              padding: 1rem;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Layout;
