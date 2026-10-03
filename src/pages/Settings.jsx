import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

function formatSize(mb) {
  const val = Number(mb) || 0;
  if (val >= 1024) return `${(val / 1024).toFixed(1)} GB`;
  return `${val.toFixed(0)} MB`;
}

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [customGb, setCustomGb] = useState(1);
  const [bankRef, setBankRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Password change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await api.getPlans();
        setPlans(res.plans || []);
        setCurrentPlan(res.plans?.find(p => p.id === user?.plan_id));
      } catch (err) {
        console.error(err);
      }
    }
    fetchPlans();
  }, [user?.plan_id]);

  const handleUpgradeRequest = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }
    if (!bankRef.trim()) {
      toast.error('Please enter your bank transfer reference');
      return;
    }
    setSubmitting(true);
    try {
      await api.requestPlanUpgrade(
        selectedPlan.id,
        selectedPlan.is_custom ? customGb : null,
        bankRef.trim()
      );
      toast.success('Upgrade request submitted! Admin will confirm shortly.');
      setSelectedPlan(null);
      setBankRef('');
    } catch (err) {
      toast.error(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmNew) {
      toast.error('Passwords do not match');
      return;
    }
    setChangingPw(true);
    try {
      await api.request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      toast.success('Password updated');
      setOldPassword('');
      setNewPassword('');
      setConfirmNew('');
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  const storageTotalMb = user?.custom_storage_mb || currentPlan?.storage_mb || 512;

  return (
    <div className="settings-page animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <div className="flex flex-col gap-lg">
        {/* Current Plan */}
        <div className="card settings-card">
          <h3 className="card-title">Current Plan</h3>
          <div className="current-plan-info">
            <div className="plan-name-big">{currentPlan?.name || 'Free'}</div>
            <div className="storage-bar-container">
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min((user?.storage_used_mb / storageTotalMb) * 100, 100)}%` }}
                />
              </div>
              <div className="storage-bar-labels">
                <span>{formatSize(user?.storage_used_mb || 0)} used</span>
                <span>{formatSize(storageTotalMb)} total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Plan */}
        <div className="card settings-card">
          <h3 className="card-title">Upgrade Plan</h3>
          <div className="plan-options">
            {plans.filter(p => p.id !== 1 && !p.is_custom).map(plan => (
              <button
                key={plan.id}
                className={`plan-option ${selectedPlan?.id === plan.id ? 'plan-option-selected' : ''}`}
                onClick={() => setSelectedPlan(plan)}
              >
                <span className="plan-option-name">{plan.name}</span>
                <span className="plan-option-storage">{formatSize(plan.storage_mb)}</span>
                <span className="plan-option-price">{plan.price_etb} ETB/mo</span>
              </button>
            ))}
            {/* Custom */}
            {plans.filter(p => p.is_custom).map(plan => (
              <button
                key={plan.id}
                className={`plan-option ${selectedPlan?.id === plan.id ? 'plan-option-selected' : ''}`}
                onClick={() => setSelectedPlan(plan)}
              >
                <span className="plan-option-name">Custom</span>
                <span className="plan-option-storage">You choose</span>
                <span className="plan-option-price">6 ETB/GB</span>
              </button>
            ))}
          </div>

          {selectedPlan?.is_custom && (
            <div className="input-group" style={{ marginTop: 'var(--space-4)' }}>
              <label className="input-label">Storage amount (GB)</label>
              <input
                type="number"
                className="input"
                min="1"
                value={customGb}
                onChange={(e) => setCustomGb(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <span className="text-muted" style={{ fontSize: 'var(--fs-sm)' }}>
                Total: {customGb * 6} ETB/month
              </span>
            </div>
          )}

          {selectedPlan && (
            <div className="upgrade-payment animate-slideUp" style={{ marginTop: 'var(--space-6)' }}>
              <div className="payment-info card" style={{ background: 'var(--bg-elevated)' }}>
                <p style={{ fontWeight: 'var(--fw-medium)', marginBottom: 'var(--space-2)' }}>Payment instructions:</p>
                <p className="text-muted" style={{ fontSize: 'var(--fs-sm)' }}>
                  1. Send <strong>{selectedPlan.is_custom ? customGb * 6 : selectedPlan.price_etb} ETB</strong> via Telebirr or bank transfer<br />
                  2. Paste the transaction reference below<br />
                  3. Admin will confirm within 24 hours
                </p>
              </div>
              <div className="input-group">
                <label className="input-label">Bank/Telebirr reference number</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. TXN123456789"
                  value={bankRef}
                  onChange={(e) => setBankRef(e.target.value)}
                />
              </div>
              <button
                className="btn btn-primary w-full"
                onClick={handleUpgradeRequest}
                disabled={submitting}
              >
                {submitting ? <span className="spinner spinner-sm" /> : 'Submit upgrade request'}
              </button>
            </div>
          )}
        </div>

        {/* Change Password */}
        {!user?.google_id && (
          <div className="card settings-card">
            <h3 className="card-title">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="auth-form">
              <div className="input-group">
                <label className="input-label">Current password</label>
                <input
                  type="password"
                  className="input"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">New password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Confirm new password</label>
                <input
                  type="password"
                  className="input"
                  value={confirmNew}
                  onChange={(e) => setConfirmNew(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-outline" disabled={changingPw}>
                {changingPw ? <span className="spinner spinner-sm" /> : 'Update password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
