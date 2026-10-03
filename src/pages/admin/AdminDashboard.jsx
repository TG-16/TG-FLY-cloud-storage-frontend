import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

function formatSize(mb) {
  const val = Number(mb) || 0;
  if (val >= 1024 * 1024) return `${(val / (1024 * 1024)).toFixed(2)} TB`;
  if (val >= 1024) return `${(val / 1024).toFixed(1)} GB`;
  return `${val.toFixed(0)} MB`;
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api.getAdminDashboard();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="admin-page animate-fadeIn p-space-lg">
        <h1 className="text-headline-lg">Admin Overview & System Health</h1>
        <div className="admin-metrics mt-space-md" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
          {[...Array(4)].map((_, i) => <div className="card skeleton" style={{ height: 140 }} key={i} />)}
        </div>
      </div>
    );
  }

  const mrr = data?.storagByPlan?.reduce((sum, p) => sum + (p.price_etb * p.userCount || 0), 0) || 0;

  return (
    <div className="admin-page animate-fadeIn" style={{ maxWidth: 1440, margin: '0 auto', padding: 'var(--space-lg)' }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-space-md" style={{ marginBottom: 'var(--space-xl)' }}>
        <div>
          <div className="flex items-center gap-space-xs" style={{ marginBottom: 4 }}>
            <span className="upload-engine-badge">
              <span className="upload-engine-dot" />
              TeleCloud Engine Active
            </span>
            <span className="text-body-sm text-outline">Node: AA-CENTRAL-01</span>
          </div>
          <h1 className="text-headline-lg" style={{ color: 'var(--on-surface)', tracking: 'tight' }}>Admin Overview & System Health</h1>
          <p className="text-body-md text-on-surface-variant" style={{ marginTop: 4 }}>
            Live TeleCloud S3 metrics, user growth velocity, pending manual verifications, and regional storage telemetry.
          </p>
        </div>
        <div className="flex gap-space-sm">
          <button className="btn btn-secondary btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
            Export CSV
          </button>
          <Link to="/admin/settings" className="btn btn-primary btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>settings</span>
            System Settings
          </Link>
        </div>
      </div>

      {/* Top Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-label-sm text-outline uppercase tracking-wider" style={{ fontWeight: 600 }}>Total Registered Users</div>
              <div className="flex items-baseline gap-sm mt-xs">
                <span className="text-headline-lg" style={{ fontWeight: 700 }}>{data?.totalUsers || 0}</span>
                <span className="text-label-sm" style={{ color: 'var(--tertiary)', background: 'var(--surface-container-low)', padding: '2px 8px', borderRadius: 'var(--rounded-full)', fontWeight: 600 }}>+14%</span>
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--rounded)', background: 'var(--surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <span className="material-symbols-outlined">group</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-body-sm text-on-surface-variant" style={{ marginTop: 'var(--space-md)', background: 'rgba(0,0,0,0.02)', padding: '8px 12px', borderRadius: 'var(--rounded)' }}>
            <span className="flex items-center gap-xs"><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-container)' }} /> {data?.activeUsers || 0} Active</span>
            <span className="flex items-center gap-xs"><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--error)' }} /> {data?.totalUsers - (data?.activeUsers || 0)} Revoked</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-label-sm text-outline uppercase tracking-wider" style={{ fontWeight: 600 }}>Allocated Storage</div>
              <div className="flex items-baseline gap-sm mt-xs">
                <span className="text-headline-lg" style={{ fontWeight: 700 }}>{formatSize(data?.totalStorageUsed)}</span>
                <span className="text-label-md text-on-surface-variant">/ 10 TB Pool</span>
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--rounded)', background: 'var(--surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-container)' }}>
              <span className="material-symbols-outlined">cloud</span>
            </div>
          </div>
          <div style={{ marginTop: 'var(--space-md)' }}>
            <div className="flex items-center justify-between text-label-sm mb-xs">
              <span className="text-on-surface-variant">Capacity Utilized</span>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{((data?.totalStorageUsed / (10 * 1024 * 1024)) * 100).toFixed(1)}%</span>
            </div>
            <div className="progress-track" style={{ height: 8 }}>
              <div className="progress-fill" style={{ width: `${(data?.totalStorageUsed / (10 * 1024 * 1024)) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-label-sm text-outline uppercase tracking-wider" style={{ fontWeight: 600 }}>Pending Payments</div>
              <div className="flex items-baseline gap-sm mt-xs">
                <span className="text-headline-lg" style={{ fontWeight: 700 }}>{data?.pendingPayments || 0}</span>
                {data?.pendingPayments > 0 && (
                  <span className="text-label-sm animate-pulse" style={{ background: 'var(--error-container)', color: 'var(--on-error-container)', padding: '2px 8px', borderRadius: 'var(--rounded-full)', fontWeight: 600 }}>Action Required</span>
                )}
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--rounded)', background: 'var(--surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-body-sm text-on-surface-variant" style={{ marginTop: 'var(--space-md)', background: 'rgba(0,0,0,0.02)', padding: '8px 12px', borderRadius: 'var(--rounded)' }}>
            <span className="text-label-md">Total Queue Volume</span>
            <span className="text-label-lg font-bold text-on-surface">??? ETB</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-label-sm text-outline uppercase tracking-wider" style={{ fontWeight: 600 }}>Estimated MRR</div>
              <div className="flex items-baseline gap-xs mt-xs">
                <span className="text-headline-lg" style={{ fontWeight: 700 }}>{mrr.toLocaleString()}</span>
                <span className="text-headline-sm text-outline" style={{ fontWeight: 600 }}>ETB</span>
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--rounded)', background: 'var(--surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tertiary)' }}>
              <span className="material-symbols-outlined">query_stats</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-body-sm text-on-surface-variant" style={{ marginTop: 'var(--space-md)', background: 'rgba(0,0,0,0.02)', padding: '8px 12px', borderRadius: 'var(--rounded)' }}>
            <span>Gross Margin</span>
            <span className="text-label-sm font-bold" style={{ color: 'var(--tertiary)' }}>~54% (Base: 3 ETB/GB)</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }} className="admin-grid-lg">
        {/* Storage Quota by Tier */}
        <div className="card">
          <div className="flex items-center justify-between" style={{ paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--outline-variant)', marginBottom: 'var(--space-md)' }}>
            <div>
              <h2 className="text-headline-sm text-on-surface">Storage Quota by Tier</h2>
              <p className="text-body-sm text-on-surface-variant">Capacity consumption and commercial yield</p>
            </div>
            <span className="text-label-sm" style={{ background: 'var(--surface-container)', padding: '4px 10px', borderRadius: 'var(--rounded)' }}>{formatSize(data?.totalStorageUsed)} active</span>
          </div>

          <div className="flex flex-col gap-sm">
            {data?.storagByPlan?.map((plan, i) => (
              <div key={i} className="flex items-center justify-between" style={{ padding: '10px', borderRadius: 'var(--rounded)', background: 'var(--surface-container-lowest)' }}>
                <div className="flex items-center gap-space-sm">
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)' }} />
                  <div>
                    <div className="text-label-lg font-semibold text-on-surface">{plan.name}</div>
                    <div className="text-body-sm text-outline">{plan.userCount} active accounts</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="text-label-lg font-semibold text-on-surface">{formatSize(plan.totalStorage)}</div>
                  {plan.price_etb > 0 && <div className="text-body-sm text-tertiary font-semibold">{plan.price_etb * plan.userCount} ETB / mo</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent System Events */}
      <div className="card">
        <div className="flex items-center justify-between" style={{ paddingBottom: 'var(--space-md)' }}>
          <div>
            <h2 className="text-headline-sm text-on-surface">Recent System Events Stream</h2>
            <p className="text-body-sm text-on-surface-variant">Immutable activity ledger recorded across edge nodes and gateway APIs</p>
          </div>
          <span className="flex items-center gap-xs text-label-sm font-semibold" style={{ color: 'var(--tertiary)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--tertiary)' }} /> Live Stream
          </span>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="text-label-md text-on-surface-variant uppercase tracking-wider" style={{ background: 'var(--surface-container-low)' }}>
                <th style={{ padding: '12px 16px', borderRadius: '8px 0 0 8px' }}>Timestamp</th>
                <th style={{ padding: '12px 16px' }}>User Identifier</th>
                <th style={{ padding: '12px 16px' }}>Action Hook</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', borderRadius: '0 8px 8px 0' }}>Resource</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentLogs?.map((log, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--surface-container)' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace' }} className="text-body-sm text-outline">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div className="flex flex-col">
                      <span className="text-label-lg font-semibold text-on-surface">{log.email || 'System'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="text-label-md font-semibold" style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--surface-container)', color: 'var(--primary)', fontFamily: 'monospace' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <span className="text-label-sm font-semibold" style={{ color: 'var(--on-surface-variant)' }}>
                      {log.resource_type || '-'} {log.resource_id ? `#${log.resource_id}` : ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data?.recentLogs || data.recentLogs.length === 0) && (
            <div className="text-center text-muted" style={{ padding: 'var(--space-xl)' }}>No recent events found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
