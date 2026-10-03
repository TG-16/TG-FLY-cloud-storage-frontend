import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dashData, setDashData] = useState(null);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    async function fetchStorage() {
      try {
        const data = await api.getUserDashboard();
        setDashData(data);
      } catch { /* ignore */ }
    }
    fetchStorage();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const storageUsed = dashData?.storageUsed || user?.storage_used_mb || 0;
  const storageTotal = dashData?.storageTotal || 512;
  const storagePct = storageTotal > 0 ? Math.min((storageUsed / storageTotal) * 100, 100) : 0;
  const planName = dashData?.planName || 'Free';

  function formatSize(mb) {
    const val = Number(mb) || 0;
    if (val >= 1024) return `${(val / 1024).toFixed(1)} GB`;
    return `${val.toFixed(0)} MB`;
  }

  return (
    <div className="console-layout">
      {/* Sidebar (Desktop) */}
      <aside className={`console-sidebar hide-lg-down ${menuOpen ? 'open' : ''}`}>
        <div>
          <NavLink to="/files" className="sidebar-logo">
            <img src="/logo.png" alt="TG-Fly" className="logo-img" />
            <div>
              <div className="logo-text" style={{ fontSize: '1.1rem' }}>TG-Fly</div>
              <div className="logo-subtext">Console</div>
            </div>
          </NavLink>

          <nav className="sidebar-nav">
            {!isAdminRoute ? (
              <>
                <NavLink to="/files" className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`} end>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>folder</span>
                  <span>My Files</span>
                </NavLink>
                <NavLink to="/upload-manager" className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>cloud_upload</span>
                  <span>Upload Manager</span>
                </NavLink>
                <NavLink to="/download-manager" className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>downloading</span>
                  <span>Download Manager</span>
                </NavLink>
                <NavLink to="/upgrade" className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>rocket_launch</span>
                  <span>Upgrade Storage</span>
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>settings</span>
                  <span>Settings</span>
                </NavLink>
                {user?.role === 'admin' && (
                  <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>admin_panel_settings</span>
                    <span>Admin Panel</span>
                  </NavLink>
                )}
              </>
            ) : (
              <>
                <p className="text-label-sm text-outline uppercase tracking-wider font-semibold" style={{ padding: '8px 16px', marginBottom: 4 }}>Core Operations</p>
                <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`} end>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>dashboard</span>
                  <span>Dashboard</span>
                </NavLink>
                <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>group</span>
                  <span>User Management</span>
                </NavLink>
                <NavLink to="/admin/payments" className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>payments</span>
                  <span>Payment Requests</span>
                </NavLink>
                <NavLink to="/admin/logs" className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>receipt_long</span>
                  <span>System Event Logs</span>
                </NavLink>
                
                <hr className="divider" style={{ margin: '16px 0' }} />
                
                <NavLink to="/files" className="sidebar-link">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
                  <span>Back to My Files</span>
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {/* Capacity widget */}
        <div className="sidebar-capacity">
          <div className="sidebar-capacity-card">
            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <span className="text-label-sm text-muted">Capacity</span>
              <span className="text-label-sm" style={{ color: 'var(--primary)', fontWeight: 600 }}>{storagePct.toFixed(0)}%</span>
            </div>
            <div className="sidebar-capacity-bar">
              <div className="sidebar-capacity-fill" style={{ width: `${storagePct}%` }} />
            </div>
            <p className="text-label-sm text-muted" style={{ marginTop: 4 }}>
              {formatSize(storageUsed)} / {formatSize(storageTotal)} {planName}
            </p>
          </div>
        </div>
      </aside>

      {/* Top Header */}
      <header className="console-header">
        {/* Mobile hamburger */}
        <button
          className="mobile-menu-btn hide-desktop"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className={`hamburger ${menuOpen ? 'hamburger-open' : ''}`}>
            <span /><span /><span />
          </span>
        </button>

        {/* Search */}
        <div className="console-search hide-mobile">
          <span className="material-symbols-outlined console-search-icon">search</span>
          <input
            type="text"
            className="console-search-input"
            placeholder="Search files and directories..."
          />
        </div>

        <div className="console-header-right">
          <div className="storage-pill hide-mobile">
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>cloud_done</span>
            <span>{formatSize(storageUsed)} / {formatSize(storageTotal)} {planName}</span>
          </div>

          <button className="notification-btn" type="button">
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>notifications</span>
            <span className="notification-dot" />
          </button>

          <div className="user-dropdown-container" style={{ position: 'relative' }}>
            <div className="user-dropdown" onClick={() => setDropdownOpen(!dropdownOpen)} style={{ cursor: 'pointer' }} title="Profile">
              <div className="avatar">
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : (user?.name?.[0]?.toUpperCase() || '?')
                }
              </div>
              <span className="material-symbols-outlined text-outline" style={{ fontSize: 18 }}>expand_more</span>
            </div>
            {dropdownOpen && (
              <div className="dropdown-menu card animate-slideUp" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, minWidth: 200, zIndex: 100 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--outline-variant)' }}>
                  <div className="text-label-sm" style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{user?.name}</div>
                  <div className="text-body-sm text-muted truncate">{user?.email}</div>
                </div>
                <div style={{ padding: 8 }}>
                  <button className="btn btn-ghost w-full" style={{ justifyContent: 'flex-start', color: 'var(--danger)' }} onClick={handleLogout}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 8 }}>logout</span>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile slide nav */}
      {menuOpen && (
        <div className="mobile-overlay" onClick={() => setMenuOpen(false)}>
          <nav className="mobile-nav" onClick={e => e.stopPropagation()}>
            <div className="mobile-nav-user">
              <div className="avatar avatar-lg">
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : (user?.name?.[0]?.toUpperCase() || '?')
                }
              </div>
              <div>
                <div className="user-name">{user?.name}</div>
                <div className="user-email">{user?.email}</div>
              </div>
            </div>
            <hr className="divider" />
            {!isAdminRoute ? (
              <>
                <NavLink to="/files" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>folder</span> My Files
                </NavLink>
                <NavLink to="/upload-manager" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>cloud_upload</span> Upload Manager
                </NavLink>
                <NavLink to="/download-manager" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>downloading</span> Download Manager
                </NavLink>
                <NavLink to="/upgrade" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>rocket_launch</span> Upgrade Storage
                </NavLink>
                <NavLink to="/settings" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>settings</span> Settings
                </NavLink>
                {user?.role === 'admin' && (
                  <NavLink to="/admin" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>admin_panel_settings</span> Admin Panel
                  </NavLink>
                )}
              </>
            ) : (
              <>
                <p className="text-label-sm text-outline uppercase tracking-wider font-semibold" style={{ padding: '8px 16px', marginBottom: 4 }}>Core Operations</p>
                <NavLink to="/admin" className="mobile-nav-link" onClick={() => setMenuOpen(false)} end>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>dashboard</span> Dashboard
                </NavLink>
                <NavLink to="/admin/users" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>group</span> User Management
                </NavLink>
                <NavLink to="/admin/payments" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>payments</span> Payment Requests
                </NavLink>
                <NavLink to="/admin/logs" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>receipt_long</span> System Event Logs
                </NavLink>
                <hr className="divider" style={{ margin: '16px 0' }} />
                <NavLink to="/files" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span> Back to My Files
                </NavLink>
              </>
            )}
            <hr className="divider" />
            <button className="mobile-nav-link" onClick={handleLogout}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span> Sign out
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="console-content">
        <main className="console-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
