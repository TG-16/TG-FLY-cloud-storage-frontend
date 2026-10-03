import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

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

export default function AdminLogs() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  
  const [expandedRow, setExpandedRow] = useState(null);
  const [isStreaming, setIsStreaming] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!isStreaming && logs.length > 0) return; // Don't fetch if paused and we have data (simplified)
    
    setLoading(true);
    try {
      const filters = {};
      if (actionFilter) filters.action = actionFilter;
      // Note: Backend uses userId for search currently, but we'll adapt later
      const res = await api.getEventLogs(page, filters);
      setLogs(res.logs || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, isStreaming, toast]);

  useEffect(() => { 
    fetchLogs();
    
    // Auto-refresh if streaming
    let interval;
    if (isStreaming) {
      interval = setInterval(fetchLogs, 10000);
    }
    return () => clearInterval(interval);
  }, [fetchLogs, isStreaming]);

  const togglePayload = (id) => {
    if (expandedRow === id) setExpandedRow(null);
    else setExpandedRow(id);
  };

  const actionConfig = {
    login: { color: 'var(--primary)', badge: 'badge-primary' },
    signup: { color: 'var(--primary)', badge: 'badge-primary' },
    upload: { color: 'var(--tertiary)', badge: 'badge-accent' },
    download: { color: 'var(--secondary)', badge: 'badge-secondary' },
    delete: { color: 'var(--error)', badge: 'badge-error' },
    revoke: { color: 'var(--error)', badge: 'badge-error' },
    restore: { color: 'var(--success)', badge: 'badge-success' },
    'password-reset': { color: 'var(--warning)', badge: 'badge-warning' },
    'payment-confirmed': { color: 'var(--primary-container)', badge: 'badge-primary' },
    'payment-rejected': { color: 'var(--error)', badge: 'badge-error' },
  };

  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const text = (log.action || '') + (log.email || '') + (log.name || '') + (log.ip_address || '');
    return text.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="admin-page animate-fadeIn" style={{ maxWidth: 1600, margin: '0 auto', padding: 'var(--space-lg)' }}>
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-space-md" style={{ marginBottom: 'var(--space-xl)' }}>
        <div>
          <div className="flex items-center gap-space-xs" style={{ marginBottom: 4 }}>
            <span className="badge badge-accent uppercase tracking-wider" style={{ fontSize: 10, fontWeight: 700 }}>Security & Audit</span>
            <span className="flex items-center gap-xs text-label-sm" style={{ color: 'var(--tertiary)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--tertiary)' }} className="animate-pulse" />
              Live Ingestion Active
            </span>
          </div>
          <h1 className="text-headline-lg text-on-surface" style={{ tracking: 'tight' }}>System Event Logs & Audit Trail</h1>
          <p className="text-body-md text-on-surface-variant" style={{ marginTop: 4, maxWidth: 800 }}>
            Real-time ledger of all user actions, file uploads, authentication attempts, quota changes, and security events across the S3 edge cluster.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-space-sm">
          <button className="btn" style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)' }} onClick={() => setIsStreaming(!isStreaming)}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--tertiary)' }}>
              {isStreaming ? 'pause_circle' : 'play_circle'}
            </span>
            {isStreaming ? 'Pause Live Stream' : 'Resume Stream'}
          </button>
          <button className="btn btn-ghost" onClick={() => { setActionFilter(''); setSearch(''); }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>filter_alt_off</span>
            Clear Filters
          </button>
          <button className="btn btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
            Export Archive
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Events (24h)</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-container-low)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>query_stats</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-space-sm">
            <span className="text-headline-md font-bold text-on-surface">{(logs.length * totalPages) || 24891}</span>
            <span className="text-label-sm flex items-center gap-xs" style={{ color: 'var(--tertiary)' }}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_upward</span> +14.2%</span>
          </div>
          <div className="progress-track" style={{ height: 6, marginTop: 8 }}><div className="progress-fill" style={{ width: '76%' }} /></div>
          <span className="text-body-sm text-outline mt-xs">Normal operational load</span>
        </div>

        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Chunk Resumptions</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-container-low)', color: 'var(--tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>cloud_sync</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-space-sm">
            <span className="text-headline-md font-bold text-on-surface">842</span>
            <span className="text-label-sm flex items-center gap-xs" style={{ color: 'var(--tertiary)' }}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span> 100% saved</span>
          </div>
          <div className="progress-track" style={{ height: 6, marginTop: 8 }}><div className="progress-fill" style={{ width: '92%', background: 'var(--tertiary-container)' }} /></div>
          <span className="text-body-sm text-outline mt-xs">Byte-range recovery saved 41.2 GB</span>
        </div>

        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Auth Success Rate</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-container-low)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>verified_user</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-space-sm">
            <span className="text-headline-md font-bold text-on-surface">99.4%</span>
            <span className="text-label-sm text-outline">0.06% fail</span>
          </div>
          <div className="progress-track" style={{ height: 6, marginTop: 8 }}><div className="progress-fill" style={{ width: '99.4%', background: 'var(--secondary)' }} /></div>
          <span className="text-body-sm text-outline mt-xs">Google OAuth Sign-in</span>
        </div>

        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Security Interceptions</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-container-low)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>shield</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-space-sm">
            <span className="text-headline-md font-bold text-on-surface">0 Active</span>
            <span className="text-label-sm text-on-surface-variant">4 Rate-Limited</span>
          </div>
          <div className="progress-track" style={{ height: 6, marginTop: 8 }}><div className="progress-fill" style={{ width: '14%', background: 'var(--outline)' }} /></div>
          <span className="text-body-sm text-outline mt-xs">Spam IPs blocked on auth endpoints</span>
        </div>
      </div>

      {/* Query Control Panel */}
      <div className="card flex flex-col gap-space-md" style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md)' }}>
        <div className="flex flex-wrap items-center gap-space-sm">
          <div className="console-search" style={{ margin: 0, flex: '1 1 300px', background: 'var(--surface-container-low)' }}>
            <span className="material-symbols-outlined console-search-icon">search</span>
            <input
              type="text"
              className="console-search-input"
              style={{ background: 'transparent' }}
              placeholder="Filter by User ID, IP, File ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input" style={{ background: 'var(--surface-container-low)', cursor: 'pointer', flex: '1 1 200px' }} value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
            <option value="">All Action Types</option>
            <option value="upload">Upload</option>
            <option value="download">Download</option>
            <option value="login">Auth / Login</option>
            <option value="payment-confirmed">Payment Confirmed</option>
            <option value="revoke">Account Revoked</option>
          </select>
          <select className="input" style={{ background: 'var(--surface-container-low)', cursor: 'pointer', flex: '1 1 200px' }}>
            <option value="">All Resources</option>
            <option value="files">files</option>
            <option value="users">users</option>
          </select>
          <select className="input" style={{ background: 'var(--surface-container-low)', cursor: 'pointer', flex: '1 1 200px' }}>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-sm mt-xs">
          <span className="text-label-sm text-outline uppercase tracking-wider">Applied Filters:</span>
          <span className="badge" style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: 4 }}>
            Node: <strong>addis-s3-cluster-01</strong> <span className="material-symbols-outlined" style={{ fontSize: 14, cursor: 'pointer' }}>close</span>
          </span>
          <span className="text-label-sm text-outline pl-sm">Matching {filteredLogs.length * totalPages} rows</span>
        </div>
      </div>

      {/* Event Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex items-center justify-between" style={{ padding: 'var(--space-sm) var(--space-md)', background: 'var(--surface-container-low)' }}>
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>reorder</span>
            <span className="text-headline-sm font-bold">Event Audit Stream</span>
            {isStreaming && <span className="badge" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>Autoscroll ON</span>}
          </div>
          <span className="text-body-sm text-outline">Displaying {filteredLogs.length} events (Page {page})</span>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: 1000 }}>
            <thead>
              <tr className="text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold" style={{ background: 'var(--surface-container-low)', opacity: 0.8 }}>
                <th style={{ padding: '12px 16px' }}>Timestamp</th>
                <th style={{ padding: '12px 16px' }}>Action</th>
                <th style={{ padding: '12px 16px' }}>Actor / Identity</th>
                <th style={{ padding: '12px 16px' }}>Target Resource</th>
                <th style={{ padding: '12px 16px' }}>Origin & Network</th>
                <th style={{ padding: '12px 16px' }}>Payload Inspector</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--surface-container)' }}>
                    <td colSpan={7} style={{ padding: '16px' }}><div className="skeleton" style={{ height: 24 }} /></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted" style={{ padding: 'var(--space-xl)' }}>No events match filters.</td>
                </tr>
              ) : filteredLogs.map(log => {
                const conf = actionConfig[log.action] || { color: 'var(--outline)', badge: 'badge-accent' };
                const initials = getInitials(log.name || 'Anonymous');
                
                return (
                  <React.Fragment key={log.id}>
                    <tr className="hover-bg-container" style={{ borderBottom: '1px solid var(--surface-container)' }}>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace' }} className="text-outline">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <span className={`badge ${conf.badge}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: conf.color }} />
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div className="flex items-center gap-sm">
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: getAvatarColor(initials), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                            {initials}
                          </div>
                          <div>
                            <span className="font-semibold">{log.name || log.email || 'System'}</span>
                            <span className="text-outline font-mono text-xs ml-sm">#{log.user_id || 'SYS'}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {log.resource_type ? (
                          <div className="truncate" style={{ maxWidth: 220 }}>
                            <span className="font-semibold text-primary">{log.resource_type.toUpperCase()} #{log.resource_id}</span>
                          </div>
                        ) : (
                          <span className="text-outline">—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs">{log.ip_address || '127.0.0.1'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button className="btn btn-sm" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)', fontFamily: 'monospace', fontSize: 10, padding: '4px 8px' }} onClick={() => togglePayload(log.id)}>
                          {'{'} click to view payload {'}'}
                        </button>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button className="btn btn-ghost btn-icon btn-sm text-on-surface-variant" onClick={() => togglePayload(log.id)}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>terminal</span>
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Payload Row */}
                    {expandedRow === log.id && (
                      <tr style={{ background: 'var(--surface-container-low)' }}>
                        <td colSpan={7} style={{ padding: 'var(--space-md)' }}>
                          <div style={{ background: 'var(--inverse-surface)', color: 'var(--inverse-on-surface)', padding: 'var(--space-sm)', borderRadius: 'var(--rounded)', fontFamily: 'monospace', fontSize: 12, overflowX: 'auto' }}>
                            <pre style={{ margin: 0 }}>
                              {JSON.stringify({
                                event_id: `evt_${log.id}`,
                                action: log.action,
                                target: `${log.resource_type}:${log.resource_id}`,
                                metadata: log.metadata || {},
                                network: { ip: log.ip_address },
                                timestamp: log.created_at
                              }, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between" style={{ padding: '16px 24px', borderTop: '1px solid var(--surface-container)' }}>
          <span className="text-body-sm text-outline">Page {page} of {totalPages}</span>
          <div className="flex gap-space-xs">
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
