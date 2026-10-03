import { useState, useEffect, useCallback } from 'react';
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

export default function AdminPayments() {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');
  
  const [selectedReq, setSelectedReq] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getPaymentRequests(statusFilter);
      setPayments(res.payments || []);
      if (res.payments && res.payments.length > 0) {
        setSelectedReq(res.payments[0]);
      } else {
        setSelectedReq(null);
      }
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleConfirm = async (id) => {
    if (!window.confirm('Confirm this payment? User will be upgraded.')) return;
    try {
      await api.confirmPayment(id);
      toast.success('Payment confirmed, user upgraded');
      fetchPayments();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.rejectPayment(id);
      toast.success('Payment rejected');
      setRejectModal(null);
      fetchPayments();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredPayments = payments.filter(p => {
    const text = (p.bank_ref || '') + (p.user_name || '') + (p.user_email || '');
    return text.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="admin-page animate-fadeIn" style={{ maxWidth: 1560, margin: '0 auto', padding: 'var(--space-lg)' }}>
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-space-md" style={{ marginBottom: 'var(--space-lg)' }}>
        <div>
          <div className="flex items-center gap-space-xs text-secondary" style={{ marginBottom: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>verified_user</span>
            <span className="text-label-sm uppercase tracking-wider font-semibold">Financial Gateway • Manual Clearinghouse</span>
          </div>
          <h1 className="text-headline-lg text-on-surface" style={{ tracking: 'tight' }}>Payment Requests & Verification</h1>
          <p className="text-body-md text-on-surface-variant" style={{ marginTop: 4, maxWidth: 800 }}>
            Inspect subscriber deposit slips and SMS transaction reference numbers. Approve to instantly commit plan changes and provision S3 quota partitions.
          </p>
        </div>
        
        {/* Quick Metrics */}
        <div className="card flex items-center gap-space-sm" style={{ padding: '8px 16px', flexDirection: 'row' }}>
          <div className="flex flex-col" style={{ paddingRight: 'var(--space-md)' }}>
            <span className="text-label-sm text-outline uppercase font-semibold">Unresolved</span>
            <div className="flex items-center gap-xs">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--error)' }} className="animate-pulse" />
              <span className="text-headline-sm font-bold text-error">{payments.length} Queue</span>
            </div>
          </div>
          <div style={{ width: 1, height: 32, background: 'var(--surface-container-high)' }} />
          <div className="flex flex-col" style={{ paddingLeft: 'var(--space-md)' }}>
            <span className="text-label-sm text-outline uppercase font-semibold">Auto-Sync</span>
            <span className="text-headline-sm font-bold text-tertiary flex items-center gap-xs">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>bolt</span> 0.4s
            </span>
          </div>
        </div>
      </div>

      {/* Protocol Workflow Helper */}
      <div style={{ background: 'linear-gradient(90deg, rgba(0,97,165,0.1), var(--surface-container-low))', borderRadius: 'var(--rounded-xl)', padding: 'var(--space-md)', marginBottom: 'var(--space-xl)', border: '1px solid var(--surface-container-high)' }}>
        <div className="flex flex-wrap items-center justify-between gap-space-md">
          <div className="flex items-start gap-space-md">
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
            <div>
              <div className="text-label-lg font-bold" style={{ color: 'var(--primary-fixed-variant)' }}>
                Auditor Protocol v2.4 (Manual Clearing Verification Flow)
              </div>
              <div className="flex flex-wrap gap-space-md mt-sm text-body-sm">
                <div className="flex items-start gap-xs" style={{ background: 'var(--surface-container-lowest)', padding: 10, borderRadius: 8, flex: 1, minWidth: 240 }}>
                  <span className="badge badge-accent" style={{ padding: '2px 6px', borderRadius: '50%' }}>1</span>
                  <span>Cross-reference subscriber's unique reference code against your merchant logs.</span>
                </div>
                <div className="flex items-start gap-xs" style={{ background: 'var(--surface-container-lowest)', padding: 10, borderRadius: 8, flex: 1, minWidth: 240 }}>
                  <span className="badge badge-accent" style={{ padding: '2px 6px', borderRadius: '50%' }}>2</span>
                  <span>Click <strong>Confirm</strong> to trigger instant TeleCloud S3 bucket volume resize.</span>
                </div>
                <div className="flex items-start gap-xs" style={{ background: 'var(--surface-container-lowest)', padding: 10, borderRadius: 8, flex: 1, minWidth: 240 }}>
                  <span className="badge badge-error" style={{ padding: '2px 6px', borderRadius: '50%' }}>3</span>
                  <span>Click <strong>Reject</strong> to trigger an SMS & email dispute notification.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-space-md" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="flex gap-1 overflow-auto" style={{ background: 'var(--surface-container)', padding: 4, borderRadius: 'var(--rounded-xl)' }}>
          {['pending', 'confirmed', 'rejected', 'all'].map(status => (
            <button 
              key={status}
              className={`btn btn-sm ${statusFilter === status ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontWeight: 700, borderRadius: 'var(--rounded-lg)', textTransform: 'capitalize' }}
              onClick={() => { setStatusFilter(status === 'all' ? '' : status); setSelectedReq(null); }}
            >
              {status === 'all' ? 'All Transactions' : `${status} Verification`}
            </button>
          ))}
        </div>
        <div className="console-search" style={{ margin: 0, minWidth: 300, background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}>
          <span className="material-symbols-outlined console-search-icon">search</span>
          <input
            type="text"
            className="console-search-input"
            style={{ background: 'transparent' }}
            placeholder="Filter by ref, name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Workspace Split Panel */}
      <div className="admin-grid-lg">
        {/* Left: Queue List */}
        <div className="flex flex-col gap-space-md">
          <div className="flex items-center justify-between px-xs">
            <div className="flex items-center gap-xs">
              <span className="text-headline-sm font-bold">Unprocessed Remittance Slips</span>
              <span className="badge badge-accent">FIFO Queue</span>
            </div>
            <span className="text-label-sm text-outline">Updated just now</span>
          </div>

          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="card skeleton" style={{ height: 160 }} />)
          ) : filteredPayments.length === 0 ? (
            <div className="card text-center text-muted" style={{ padding: 'var(--space-xl)' }}>
              No payments found in this queue.
            </div>
          ) : filteredPayments.map(p => {
            const isSelected = selectedReq?.id === p.id;
            const initials = getInitials(p.user_name);
            const bg = getAvatarColor(initials);
            
            return (
              <div 
                key={p.id} 
                className={`card hover-lift ${isSelected ? 'ring-2' : ''}`} 
                style={{ 
                  cursor: 'pointer', 
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--surface-container-high)',
                  padding: 'var(--space-md)'
                }}
                onClick={() => setSelectedReq(p)}
              >
                <div className="flex flex-wrap items-start justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm">
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20 }}>
                      {initials}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-xs">
                        <span className="text-headline-sm font-bold text-on-surface">{p.user_name || 'Anonymous'}</span>
                        <span className="badge" style={{ background: 'var(--surface-container)', color: 'var(--primary)', fontFamily: 'monospace' }}>#PR-{p.id}</span>
                        {isSelected && <span className="badge badge-accent" style={{ fontSize: 10 }}>SELECTED</span>}
                      </div>
                      <div className="text-body-sm text-on-surface-variant mt-xs">
                        {p.user_email} • <span className="material-symbols-outlined text-outline" style={{ fontSize: 14, verticalAlign: 'middle' }}>schedule</span> {new Date(p.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-headline-md font-black" style={{ color: p.status === 'confirmed' ? 'var(--success)' : p.status === 'rejected' ? 'var(--error)' : 'var(--on-surface)' }}>
                      {p.amount_etb} <span className="text-label-lg text-primary">ETB</span>
                    </span>
                  </div>
                </div>

                {/* Quota Badge Cluster */}
                <div className="flex flex-wrap gap-space-sm mt-space-md p-space-sm rounded-lg" style={{ background: 'var(--surface-container-low)' }}>
                  <div className="flex-1 min-w-[120px]">
                    <span className="text-label-sm text-outline uppercase font-semibold">Tier Target</span>
                    <div className="text-label-lg font-bold mt-xs">{p.plan_name}{p.custom_gb ? ` (${p.custom_gb} GB)` : ''}</div>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <span className="text-label-sm text-outline uppercase font-semibold">Status</span>
                    <div className="mt-xs">
                      {p.status === 'pending' && <span className="badge badge-accent">Pending</span>}
                      {p.status === 'confirmed' && <span className="badge badge-success">Confirmed</span>}
                      {p.status === 'rejected' && <span className="badge badge-error">Rejected</span>}
                    </div>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <span className="text-label-sm text-outline uppercase font-semibold">Reference</span>
                    <div className="mt-xs font-mono font-bold">{p.bank_ref || 'N/A'}</div>
                  </div>
                </div>
                
                {/* Actions */}
                {p.status === 'pending' && (
                  <div className="flex justify-end gap-sm mt-space-sm">
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={(e) => { e.stopPropagation(); setRejectModal(p); }}>
                      Reject
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); handleConfirm(p.id); }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>verified</span> Confirm & Upgrade
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Active Inspector (Sticky) */}
        <div style={{ position: 'sticky', top: 80 }}>
          {selectedReq ? (
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <div className="flex items-center justify-between mb-space-md">
                <span className="text-headline-sm font-bold">Deep Inspection Console</span>
                <span className="badge" style={{ background: 'var(--secondary-fixed)', color: 'var(--on-secondary-fixed)' }}>Ref: #PR-{selectedReq.id}</span>
              </div>
              
              <div className="flex flex-col gap-space-md">
                {/* Transaction Specs */}
                <div className="flex flex-col">
                  <div className="flex justify-between py-sm border-b" style={{ borderColor: 'var(--surface-container)' }}>
                    <span className="text-label-md text-on-surface-variant">Applicant User</span>
                    <span className="font-bold">{selectedReq.user_name || 'Anonymous'}</span>
                  </div>
                  <div className="flex justify-between py-sm border-b" style={{ borderColor: 'var(--surface-container)' }}>
                    <span className="text-label-md text-on-surface-variant">Requested Allocation</span>
                    <span className="font-bold text-primary">{selectedReq.plan_name}{selectedReq.custom_gb ? ` (${selectedReq.custom_gb} GB)` : ''}</span>
                  </div>
                  <div className="flex justify-between py-sm border-b" style={{ borderColor: 'var(--surface-container)' }}>
                    <span className="text-label-md text-on-surface-variant">Required Inflow</span>
                    <span className="font-bold text-primary">{selectedReq.amount_etb} ETB</span>
                  </div>
                  <div className="flex justify-between py-sm border-b" style={{ borderColor: 'var(--surface-container)' }}>
                    <span className="text-label-md text-on-surface-variant">Submitted Reference</span>
                    <code className="px-2 py-0.5 rounded font-bold" style={{ background: 'var(--surface-container)' }}>{selectedReq.bank_ref || 'N/A'}</code>
                  </div>
                </div>

                {/* Audit Checklist */}
                <div className="p-space-md rounded-lg" style={{ background: 'var(--surface-container-low)' }}>
                  <span className="text-label-md uppercase tracking-wider font-bold text-on-surface-variant flex items-center gap-xs mb-sm">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>checklist</span> Verification Checklist
                  </span>
                  <div className="flex flex-col gap-sm">
                    <label className="flex items-center gap-sm cursor-pointer text-body-sm font-medium">
                      <input type="checkbox" className="input" style={{ width: 16, height: 16 }} /> Reference code matches gateway logs
                    </label>
                    <label className="flex items-center gap-sm cursor-pointer text-body-sm font-medium">
                      <input type="checkbox" className="input" style={{ width: 16, height: 16 }} /> Exact credit of {selectedReq.amount_etb} ETB verified
                    </label>
                    <label className="flex items-center gap-sm cursor-pointer text-body-sm font-medium">
                      <input type="checkbox" className="input" style={{ width: 16, height: 16 }} /> Account standing is active
                    </label>
                  </div>
                </div>

                {/* Audit Log Hint */}
                <div className="p-sm rounded-lg" style={{ background: 'var(--surface-container)', border: '1px solid var(--surface-container-high)', fontFamily: 'monospace', fontSize: 12 }}>
                  <div className="text-primary font-semibold mb-xs">Mutation Payload Preview:</div>
                  <div className="text-on-surface-variant">
                    {'>'} UPDATE users SET plan_id = '{selectedReq.plan_id}' WHERE id = {selectedReq.user_id};<br/>
                    {'>'} INSERT INTO event_logs ...
                  </div>
                </div>

                {selectedReq.status === 'pending' ? (
                  <div className="flex flex-col gap-sm mt-xs">
                    <button className="btn btn-primary w-full" style={{ padding: '12px 16px', fontSize: 16 }} onClick={() => handleConfirm(selectedReq.id)}>
                      <span className="material-symbols-outlined">verified</span> Confirm & Upgrade Quota
                    </button>
                    <button className="btn w-full" style={{ background: 'transparent', color: 'var(--error)', border: '1px solid var(--error-container)' }} onClick={() => setRejectModal(selectedReq)}>
                      Reject & Dispatch Notice
                    </button>
                  </div>
                ) : (
                  <div className="p-space-md rounded-lg text-center" style={{ background: 'var(--surface-container-low)', marginTop: 'var(--space-xs)' }}>
                    <span className="text-label-lg font-bold" style={{ color: selectedReq.status === 'confirmed' ? 'var(--success)' : 'var(--error)' }}>
                      Payment {selectedReq.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card text-center text-muted" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.5, marginBottom: 'var(--space-sm)' }}>manage_search</span>
              Select a payment request from the queue to inspect details.
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="overlay" onClick={() => setRejectModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Reject Payment Request</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setRejectModal(null)}>✕</button>
            </div>
            <p className="text-muted" style={{ marginBottom: 'var(--space-md)' }}>
              Are you sure you want to reject PR-{rejectModal.id} for <strong>{rejectModal.user_name}</strong>? This will notify the user that their payment reference could not be verified.
            </p>
            <div className="flex gap-space-sm">
              <button className="btn btn-secondary flex-1" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="btn flex-1" style={{ background: 'var(--error)', color: '#fff' }} onClick={() => handleReject(rejectModal.id)}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
