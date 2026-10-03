import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

function formatSize(mb) {
  const val = Number(mb) || 0;
  if (val >= 1024 * 1024) return `${(val / (1024 * 1024)).toFixed(2)} TB`;
  if (val >= 1024) return `${(val / 1024).toFixed(1)} GB`;
  return `${val.toFixed(0)} MB`;
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name[0].toUpperCase();
}

function getAvatarColor(initials) {
  const colors = [
    'var(--primary)', 'var(--secondary)', 'var(--tertiary)', 
    'var(--primary-fixed)', 'var(--secondary-fixed)', 'var(--tertiary-fixed)'
  ];
  const charCode = initials.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
}

function getTextColor(bgColor) {
  if (bgColor.includes('fixed')) return 'var(--on-surface)';
  return '#fff';
}

export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modals
  const [resetModal, setResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  
  const [revokeModal, setRevokeModal] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers(page, search);
      setUsers(res.users || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRevoke = async () => {
    if (!revokeReason) {
      toast.error('Reason is required');
      return;
    }
    try {
      await api.revokeUser(revokeModal.id, revokeReason);
      toast.success('Account revoked');
      setRevokeModal(null);
      setRevokeReason('');
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRestore = async (userId) => {
    try {
      await api.restoreUser(userId);
      toast.success('Account restored');
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await api.resetUserPassword(resetModal.id, newPassword);
      toast.success('Password reset successfully');
      setResetModal(null);
      setNewPassword('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Mock global stats from the current page
  const totalUsers = users.length * totalPages;
  const activeUsers = users.filter(u => u.is_active).length * totalPages;
  const revokedUsers = totalUsers - activeUsers;

  return (
    <div className="admin-page animate-fadeIn" style={{ maxWidth: 1520, margin: '0 auto', padding: 'var(--space-lg)' }}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-space-md" style={{ marginBottom: 'var(--space-xl)' }}>
        <div>
          <div className="flex items-center gap-space-sm" style={{ marginBottom: 4 }}>
            <span className="badge badge-accent uppercase" style={{ fontSize: 10, fontWeight: 700 }}>Directory v2.4</span>
            <span className="text-body-sm text-outline">• Node/Auth Gateway Active</span>
          </div>
          <h1 className="text-headline-lg text-on-surface" style={{ tracking: 'tight' }}>User Directory & Account Controls</h1>
          <p className="text-body-md text-on-surface-variant" style={{ marginTop: 4, maxWidth: 800 }}>
            Inspect user quotas, manage active plans, execute password resets, or temporarily revoke access across regional tenant pools.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-space-sm">
          <button className="btn btn-secondary">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>file_download</span>
            Export CSV
          </button>
          <button className="btn btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person_add</span>
            Add Internal User
          </button>
        </div>
      </div>

      {/* Quick Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div className="flex items-center justify-between mb-sm">
            <span className="text-label-md text-outline uppercase tracking-wider font-semibold">Total Registered</span>
            <span className="text-label-sm font-semibold flex items-center gap-xs" style={{ color: 'var(--tertiary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>trending_up</span> +14.2%
            </span>
          </div>
          <div className="text-headline-lg font-bold text-on-surface">{totalUsers}</div>
          <div className="text-body-sm text-on-surface-variant mt-xs">Global verified identities</div>
          <span className="material-symbols-outlined" style={{ position: 'absolute', right: 'var(--space-md)', top: 'var(--space-md)', fontSize: 64, opacity: 0.05, color: 'var(--primary)' }}>group</span>
        </div>
        
        <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div className="flex items-center justify-between mb-sm">
            <span className="text-label-md text-outline uppercase tracking-wider font-semibold">Active Quotas</span>
            <span className="badge badge-accent">96.7% Rate</span>
          </div>
          <div className="text-headline-lg font-bold text-on-surface">{activeUsers}</div>
          <div className="text-body-sm text-on-surface-variant mt-xs">Provisioned bucket instances</div>
          <span className="material-symbols-outlined" style={{ position: 'absolute', right: 'var(--space-md)', top: 'var(--space-md)', fontSize: 64, opacity: 0.05, color: 'var(--primary-container)' }}>cloud_done</span>
        </div>
        
        <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div className="flex items-center justify-between mb-sm">
            <span className="text-label-md text-outline uppercase tracking-wider font-semibold">Accounts Revoked</span>
            <span className="badge badge-error">Audit Hold</span>
          </div>
          <div className="text-headline-lg font-bold text-error">{revokedUsers}</div>
          <div className="text-body-sm text-on-surface-variant mt-xs">Abuse & verification pauses</div>
          <span className="material-symbols-outlined" style={{ position: 'absolute', right: 'var(--space-md)', top: 'var(--space-md)', fontSize: 64, opacity: 0.05, color: 'var(--error)' }}>block</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card flex flex-wrap items-center justify-between gap-space-md" style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md)' }}>
        <div className="flex flex-1 flex-wrap items-center gap-space-sm">
          <div className="console-search" style={{ margin: 0, flex: '1 1 300px', background: 'var(--surface-container-low)' }}>
            <span className="material-symbols-outlined console-search-icon">search</span>
            <input
              type="text"
              className="console-search-input"
              style={{ background: 'transparent' }}
              placeholder="Search by user name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-space-xs">
            <select className="input" style={{ background: 'var(--surface-container-low)', cursor: 'pointer', maxWidth: 180 }}>
              <option value="all">All Plans</option>
              <option value="free">Free Explorer</option>
              <option value="starter">Starter (5 GB)</option>
            </select>
            <select className="input" style={{ background: 'var(--surface-container-low)', cursor: 'pointer', maxWidth: 180 }}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-space-sm">
          <span className="text-label-sm text-outline">Page {page} of {totalPages}</span>
          <button className="btn btn-ghost btn-icon" onClick={fetchUsers}>
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: 1000 }}>
            <thead>
              <tr className="text-label-md text-on-surface-variant uppercase tracking-wider font-semibold" style={{ background: 'var(--surface-container-low)' }}>
                <th style={{ padding: '16px 24px' }}>User Identity</th>
                <th style={{ padding: '16px' }}>Plan Level</th>
                <th style={{ padding: '16px', minWidth: 220 }}>Storage Consumption</th>
                <th style={{ padding: '16px' }}>Objects</th>
                <th style={{ padding: '16px' }}>Status</th>
                <th style={{ padding: '16px' }}>Activity</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }}>Quick Controls</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--surface-container)' }}>
                    <td colSpan={7} style={{ padding: '16px 24px' }}>
                      <div className="skeleton" style={{ height: 24 }} />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted" style={{ padding: 'var(--space-xl)' }}>No users found</td>
                </tr>
              ) : users.map(user => {
                const initials = getInitials(user.name);
                const bg = getAvatarColor(initials);
                const fg = getTextColor(bg);
                
                const storageMb = user.storage_used_mb || 0;
                const maxMb = user.max_storage || (512); // Fallback to Free (512MB)
                const storagePct = maxMb > 0 ? Math.min((storageMb / maxMb) * 100, 100) : 0;
                const pctColor = storagePct > 90 ? 'var(--error)' : storagePct > 70 ? 'var(--tertiary-container)' : 'var(--primary-container)';

                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--surface-container)', opacity: user.is_active ? 1 : 0.6, background: user.is_active ? 'transparent' : 'var(--surface-container-low)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div className="flex items-center gap-space-sm min-w-0">
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-xs">
                            <span className="text-headline-sm font-semibold truncate" style={{ textDecoration: !user.is_active ? 'line-through' : 'none', textDecorationColor: 'var(--error)' }}>{user.name || 'Anonymous'}</span>
                            {user.role === 'admin' && <span className="badge badge-accent" style={{ padding: '2px 6px', fontSize: 10, textTransform: 'uppercase' }}>Admin</span>}
                          </div>
                          <div className="flex items-center gap-xs text-body-sm text-on-surface-variant truncate mt-xs">
                            <span>{user.email}</span>
                            <span className="text-outline">•</span>
                            <span className="flex items-center gap-xs text-primary font-label-sm">
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>account_circle</span> Auth
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span className="badge" style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)', fontWeight: 600 }}>
                        {user.plan_name || 'Free Explorer'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div className="flex flex-col gap-xs">
                        <div className="flex justify-between text-label-sm">
                          <span className="font-semibold">{formatSize(storageMb)} <span className="font-normal text-outline">/ {formatSize(maxMb)}</span></span>
                          <span style={{ color: pctColor, fontWeight: 700 }}>{storagePct.toFixed(0)}%</span>
                        </div>
                        <div className="progress-track" style={{ height: 6 }}>
                          <div className="progress-fill" style={{ width: `${storagePct}%`, background: pctColor }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }} className="text-body-sm text-on-surface-variant">
                      <span className="text-on-surface font-semibold">{user.file_count || 0}</span> files <span className="text-outline">/ {user.folder_count || 0} dir</span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {user.is_active ? (
                        <span className="badge" style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--tertiary)', marginRight: 6 }} />
                          Active
                        </span>
                      ) : (
                        <span className="badge badge-error">
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--error)', marginRight: 6 }} />
                          Revoked
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px' }} className="text-body-sm text-on-surface-variant">
                      <p className="text-on-surface font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
                      <p className="text-outline">Account Created</p>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-xs">
                        <button className="btn btn-ghost btn-sm" style={{ fontWeight: 600 }} onClick={() => { setResetModal(user); setNewPassword(''); }}>Reset</button>
                        {user.is_active ? (
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)', fontWeight: 600 }} onClick={() => { setRevokeModal(user); setRevokeReason(''); }}>Revoke</button>
                        ) : (
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', fontWeight: 600 }} onClick={() => handleRestore(user.id)}>Restore</button>
                        )}
                        <button className="btn btn-ghost btn-icon btn-sm text-outline hover:text-on-surface">
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between" style={{ padding: '16px 24px', borderTop: '1px solid var(--surface-container)' }}>
          <span className="text-body-sm text-outline">Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalUsers)} of {totalUsers} Users</span>
          <div className="flex gap-space-xs">
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {resetModal && (
        <div className="overlay" onClick={() => setResetModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Reset Password</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setResetModal(null)}>✕</button>
            </div>
            <p className="text-muted" style={{ marginBottom: 'var(--space-4)' }}>
              Reset password for <strong>{resetModal.name || resetModal.email}</strong>
            </p>
            <div className="input-group">
              <label className="input-label">New password</label>
              <input type="text" className="input" placeholder="Min 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <button className="btn btn-primary w-full" style={{ marginTop: 'var(--space-4)' }} onClick={handleResetPassword}>Reset Password</button>
          </div>
        </div>
      )}

      {revokeModal && (
        <div className="overlay" onClick={() => setRevokeModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Revoke Account</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setRevokeModal(null)}>✕</button>
            </div>
            <p className="text-muted" style={{ marginBottom: 'var(--space-4)' }}>
              Suspend access for <strong>{revokeModal.name || revokeModal.email}</strong>. They will immediately lose access to their account and files.
            </p>
            <div className="input-group">
              <label className="input-label">Audit Reason (Required)</label>
              <textarea className="input" rows={3} placeholder="Provide a reason for revocation (e.g. Terms violation, payment dispute)..." value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} />
            </div>
            <div className="flex gap-space-sm" style={{ marginTop: 'var(--space-md)' }}>
              <button className="btn btn-secondary flex-1" onClick={() => setRevokeModal(null)}>Cancel</button>
              <button className="btn btn-primary flex-1" style={{ background: 'var(--error)', borderColor: 'var(--error)' }} onClick={handleRevoke}>Confirm Revoke</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
