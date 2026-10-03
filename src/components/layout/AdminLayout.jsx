import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <NavLink to="/dashboard" className="app-logo admin-logo">
          <span className="logo-icon">✈</span>
          <span className="logo-text">TG-Fly</span>
        </NavLink>
        <span className="badge badge-accent" style={{ marginBottom: 'var(--space-6)' }}>Admin</span>

        <nav className="admin-nav">
          <NavLink to="/admin" end className={({ isActive }) => `admin-nav-link ${isActive ? 'admin-nav-active' : ''}`}>
            <span className="admin-nav-icon">📊</span>
            Dashboard
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `admin-nav-link ${isActive ? 'admin-nav-active' : ''}`}>
            <span className="admin-nav-icon">👥</span>
            Users
          </NavLink>
          <NavLink to="/admin/payments" className={({ isActive }) => `admin-nav-link ${isActive ? 'admin-nav-active' : ''}`}>
            <span className="admin-nav-icon">💳</span>
            Payments
          </NavLink>
          <NavLink to="/admin/logs" className={({ isActive }) => `admin-nav-link ${isActive ? 'admin-nav-active' : ''}`}>
            <span className="admin-nav-icon">📋</span>
            Event Logs
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <NavLink to="/dashboard" className="admin-nav-link">
            <span className="admin-nav-icon">←</span>
            Back to App
          </NavLink>
          <button className="admin-nav-link" onClick={handleLogout}>
            <span className="admin-nav-icon">🚪</span>
            Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
