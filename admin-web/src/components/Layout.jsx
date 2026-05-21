import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Menu, X, LayoutDashboard, Store,
  Settings, LogOut, QrCode, User, ChevronRight
} from 'lucide-react';

const navLinks = [
  { name: 'Dashboard',   path: '/',            icon: LayoutDashboard },
  { name: 'Restaurants', path: '/restaurants', icon: Store           },
  { name: 'Settings',    path: '/settings',    icon: Settings        },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const currentPage = navLinks.find(l => l.path === location.pathname)?.name || 'Admin';

  return (
    <>
      <div style={s.root}>
        {/* ── Overlay (mobile) ── */}
        {open && (
          <div style={s.overlay} onClick={() => setOpen(false)} />
        )}

        {/* ── Sidebar ── */}
        <aside style={{ ...s.sidebar, ...(open ? s.sidebarOpen : {}) }}>

          {/* Brand */}
          <div style={s.sidebarTop}>
            <div style={s.brand}>
              <div style={s.brandIcon}><QrCode size={18} color="#fff" /></div>
              <span style={s.brandText}>PetPooja QR</span>
            </div>
            <button style={s.closeBtn} onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Nav */}
          <nav style={s.nav}>
            <p style={s.navLabel}>MAIN MENU</p>
            {navLinks.map(link => {
              const Icon = link.icon;
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{ ...s.navLink, ...(active ? s.navLinkActive : {}) }}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={18} />
                  <span style={{ flex: 1 }}>{link.name}</span>
                  {active && <ChevronRight size={14} />}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div style={s.sidebarFooter}>
            <div style={s.userChip}>
              <div style={s.avatar}><User size={14} color="#fff" /></div>
              <div style={{ minWidth: 0 }}>
                <div style={s.userName}>{user?.name || 'Admin'}</div>
                <div style={s.userRole}>{user?.role || 'SUPER_ADMIN'}</div>
              </div>
            </div>
            <button style={s.logoutBtn} onClick={handleLogout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div style={s.main}>
          {/* Header */}
          <header style={s.header}>
            <div style={s.headerLeft}>
              <button style={s.hamburger} onClick={() => setOpen(true)}>
                <Menu size={22} />
              </button>
              <h1 style={s.pageTitle}>{currentPage}</h1>
            </div>
            <div style={s.headerRight}>
              <div style={s.headerAvatar}><User size={15} color="#fff" /></div>
              <div style={s.headerUserInfo}>
                <span style={s.headerUserName}>{user?.name || 'Admin'}</span>
                <span style={s.headerUserRole}>{user?.role}</span>
              </div>
            </div>
          </header>

          {/* Content */}
          <main style={s.content}>
            {children}
          </main>
        </div>
      </div>

      <style>{`
        @media (min-width: 769px) {
          .sidebar-el  { transform: translateX(0) !important; position: sticky !important; }
          .hamburger-el { display: none !important; }
          .header-user  { display: flex !important; }
          .close-btn-el { display: none !important; }
        }
        @media (max-width: 768px) {
          .header-user { display: none !important; }
        }
      `}</style>
    </>
  );
}

/* ── Inline styles (avoids CSS file conflicts during redesign) ── */
const s = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--bg)',
    position: 'relative',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.4)',
    zIndex: 99,
    backdropFilter: 'blur(2px)',
  },

  /* Sidebar */
  sidebar: {
    width: '240px',
    minHeight: '100vh',
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
    transform: 'translateX(-100%)',
    transition: 'transform 0.25s ease',
    boxShadow: '2px 0 12px rgba(0,0,0,0.06)',
  },
  sidebarOpen: {
    transform: 'translateX(0)',
  },
  sidebarTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    height: '56px',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  brandIcon: {
    width: '32px', height: '32px',
    background: 'var(--primary)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandText: {
    fontWeight: 700,
    fontSize: '0.95rem',
    color: 'var(--text)',
    letterSpacing: '-0.3px',
  },
  closeBtn: {
    color: 'var(--text-muted)',
    padding: '4px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
  },
  nav: {
    flex: 1,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflowY: 'auto',
  },
  navLabel: {
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.8px',
    color: 'var(--text-muted)',
    padding: '4px 8px 8px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: '8px',
    color: 'var(--text-sub)',
    fontWeight: 500,
    fontSize: '0.875rem',
    transition: 'var(--transition)',
    textDecoration: 'none',
  },
  navLinkActive: {
    background: 'var(--primary-light)',
    color: 'var(--primary)',
    fontWeight: 600,
  },
  sidebarFooter: {
    padding: '12px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px',
    background: 'var(--bg)',
    borderRadius: '8px',
  },
  avatar: {
    width: '30px', height: '30px',
    background: 'var(--primary)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userName: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  userRole: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 12px',
    borderRadius: '8px',
    color: 'var(--danger)',
    fontWeight: 500,
    fontSize: '0.875rem',
    transition: 'var(--transition)',
    width: '100%',
  },

  /* Header */
  header: {
    height: '56px',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    boxShadow: 'var(--shadow-xs)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  hamburger: {
    color: 'var(--text-sub)',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
    borderRadius: '6px',
  },
  pageTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerAvatar: {
    width: '32px', height: '32px',
    background: 'var(--primary)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerUserInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  headerUserName: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  headerUserRole: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
  },

  /* Main */
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    marginLeft: 0,
  },
  content: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    maxWidth: '1200px',
    width: '100%',
  },
};

/* Desktop: sidebar always visible via CSS class override */
const styleEl = document.createElement('style');
styleEl.textContent = `
  @media (min-width: 769px) {
    aside { transform: translateX(0) !important; position: sticky !important; top: 0 !important; height: 100vh !important; min-width: 240px !important; }
    .main-wrap { margin-left: 0 !important; }
  }
`;
document.head.appendChild(styleEl);
