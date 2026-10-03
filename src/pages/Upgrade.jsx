import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const PLAN_ICONS = {
  'Free': 'cloud',
  'Starter': 'cloud_queue',
  'Basic': 'cloud_done',
  'Standard': 'cloud_sync',
  'Pro': 'rocket_launch',
};

function formatStorage(mb) {
  if (mb >= 1024) return { value: (mb / 1024).toFixed(0), unit: 'GB' };
  return { value: mb, unit: 'MB' };
}

export default function Upgrade() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [bankRef, setBankRef] = useState('');
  const [customGb, setCustomGb] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const data = await api.getPlans();
        setPlans(data.plans || []);
      } catch {
        toast.error('Failed to load plans');
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, [toast]);

  const handleUpgrade = async () => {
    if (!selectedPlan || !bankRef.trim()) {
      toast.error('Please select a plan and enter your bank reference');
      return;
    }
    setSubmitting(true);
    try {
      const plan = plans.find(p => p.id === selectedPlan);
      await api.requestPlanUpgrade(selectedPlan, plan?.is_custom ? customGb : undefined, bankRef);
      toast.success('Upgrade request submitted! We\'ll verify your payment shortly.');
      setBankRef('');
      await refreshUser();
    } catch (err) {
      toast.error(err.message || 'Failed to submit upgrade request');
    } finally {
      setSubmitting(false);
    }
  };

  const storageUsed = user?.storage_used_mb || 0;
  const storageTotal = user?.custom_storage_mb || 512;
  const storagePct = storageTotal > 0 ? Math.min((storageUsed / storageTotal) * 100, 100) : 0;

  const standardPlans = plans.filter(p => !p.is_custom);
  const customPlan = plans.find(p => p.is_custom);
  const selectedPlanData = plans.find(p => p.id === selectedPlan);
  const selectedAmount = selectedPlanData?.is_custom ? customGb * 6 : selectedPlanData?.price_etb;

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <div className="flex flex-col gap-md">
          <div className="skeleton" style={{ height: 80, borderRadius: 'var(--rounded-md)' }} />
          <div className="flex gap-md">
            {[1, 2, 3, 4].map(i => <div className="skeleton" style={{ height: 280, flex: 1, borderRadius: 'var(--rounded-xl)' }} key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upgrade-page animate-fadeIn">
      {/* Header */}
      <div className="upgrade-header">
        <span className="section-tag section-tag-primary" style={{ marginBottom: 8, display: 'inline-block' }}>Storage Plans</span>
        <h1 className="text-headline-lg" style={{ color: 'var(--on-primary-container)', marginBottom: 4 }}>Upgrade Your Cloud Storage</h1>
        <p className="text-body-md text-muted" style={{ maxWidth: 560 }}>Scale your TG-Fly storage capacity. All plans billed monthly in Ethiopian Birr via Telebirr or CBE bank transfer.</p>
      </div>

      {/* Current Plan */}
      <div className="upgrade-current-plan" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '16px', background: 'var(--surface-lowest)', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
        <div className="flex items-center gap-md">
          <div style={{ width: 56, height: 56, borderRadius: 'var(--rounded-md)', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-container)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>cloud</span>
          </div>
          <div>
            <div className="text-label-sm text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Plan</div>
            <div className="text-headline-sm" style={{ color: 'var(--on-surface)' }}>{user?.plan_name || 'Free'}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-md">
          <div className="storage-meter" style={{ width: 200 }}>
            <div className="flex items-center justify-between text-label-sm">
              <span className="text-muted">{formatStorage(storageUsed).value} {formatStorage(storageUsed).unit} used</span>
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{storagePct.toFixed(0)}%</span>
            </div>
            <div className="storage-meter-bar">
              <div className="storage-meter-fill" style={{ width: `${storagePct}%` }} />
            </div>
          </div>
          <div className="text-label-md text-muted">{formatStorage(storageTotal).value} {formatStorage(storageTotal).unit} total</div>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="plan-selector-grid">
        {standardPlans.map((plan, i) => {
          const s = formatStorage(plan.storage_mb);
          const isRecommended = plan.name === 'Basic';
          return (
            <div
              className={`plan-selector-card ${selectedPlan === plan.id ? 'selected' : ''} ${isRecommended ? 'plan-selector-recommended' : ''}`}
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <div className="flex items-center gap-sm" style={{ marginBottom: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--primary-container)' }}>{PLAN_ICONS[plan.name] || 'cloud'}</span>
                  <span className="text-label-lg" style={{ color: 'var(--on-surface)' }}>{plan.name}</span>
                </div>
                <div>
                  <span className="plan-storage">{s.value}</span>
                  <span className="plan-storage-unit"> {s.unit}</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 'var(--space-md)' }}>
                  <span className="plan-price">{plan.price_etb}</span>
                  <span className="plan-price-unit"> ETB/mo</span>
                </div>
                <ul className="pricing-features" style={{ marginBottom: 0, gap: 6 }}>
                  <li className="pricing-feature">
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>check</span>
                    <span className="text-body-sm">Auto Resumable Transfers</span>
                  </li>
                  <li className="pricing-feature">
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>check</span>
                    <span className="text-body-sm">BlurHash Previews</span>
                  </li>
                  <li className="pricing-feature">
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>check</span>
                    <span className="text-body-sm">Telebirr & CBE Pay</span>
                  </li>
                </ul>
              </div>
              <button
                className={`btn w-full ${selectedPlan === plan.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ marginTop: 'var(--space-md)' }}
                onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan.id); }}
              >
                {selectedPlan === plan.id ? 'Selected' : `Select ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom Enterprise */}
      {customPlan && (
        <div className="calculator-section" style={{ marginTop: 0, marginBottom: 'var(--space-xl)' }}>
          <div className="calculator-grid">
            <div>
              <div className="text-label-sm" style={{ color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Enterprise Custom</div>
              <h3 className="text-headline-md" style={{ color: 'var(--on-surface)', marginBottom: 8 }}>Need more storage?</h3>
              <p className="text-body-md text-muted">Scale with linear pricing at <strong>6 ETB per GB/month</strong>.</p>
            </div>
            <div>
              <div className="flex items-center justify-between text-label-md" style={{ marginBottom: 12 }}>
                <span style={{ color: 'var(--on-surface)' }}>Capacity:</span>
                <span className="text-headline-sm" style={{ color: 'var(--on-primary-container)' }}>{customGb} GB</span>
              </div>
              <input type="range" className="calculator-slider" min={60} max={1000} step={10} value={customGb} onChange={e => { setCustomGb(Number(e.target.value)); setSelectedPlan(customPlan.id); }} />
              <div className="flex items-center justify-between text-label-sm text-muted" style={{ marginTop: 8 }}>
                <span>60 GB</span><span>500 GB</span><span>1 TB</span>
              </div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="text-body-sm text-muted">Monthly Cost</div>
              <div style={{ margin: '4px 0' }}>
                <span className="text-headline-lg tabular-nums" style={{ color: 'var(--primary)' }}>{(customGb * 6).toLocaleString()}</span>
                <span className="text-label-md" style={{ fontWeight: 600 }}> ETB</span>
              </div>
              <button className={`btn btn-sm w-full ${selectedPlan === customPlan.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedPlan(customPlan.id)}>
                {selectedPlan === customPlan.id ? 'Selected' : 'Select Custom'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Section */}
      {selectedPlan && (
        <div className="payment-section animate-slideUp">
          <h2 className="text-headline-md" style={{ color: 'var(--on-surface)', marginBottom: 'var(--space-md)' }}>
            Complete Your Upgrade
          </h2>
          <div className="payment-grid">
            {/* Payment Info */}
            <div className="payment-card">
              <h3 className="text-label-lg" style={{ color: 'var(--on-surface)', marginBottom: 'var(--space-md)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, marginRight: 4, color: 'var(--primary)' }}>payments</span>
                Payment Instructions
              </h3>
              <div className="payment-method" style={{ marginBottom: 16 }}>
                <span className="payment-method-label" style={{ marginBottom: 8, display: 'inline-block' }}>Option 1: Telebirr</span>
                <p className="text-body-sm text-muted" style={{ marginBottom: 4 }}>Transfer to this Telebirr number:</p>
                <div className="payment-number">+251 9XX XXX XXX</div>
              </div>
              <div className="payment-method">
                <span className="payment-method-label" style={{ marginBottom: 8, display: 'inline-block' }}>Option 2: CBE Bank Transfer</span>
                <p className="text-body-sm text-muted" style={{ marginBottom: 4 }}>Transfer to CBE account:</p>
                <div className="payment-number">1000XXXXXXXXX</div>
              </div>
              <div className="flex items-center gap-sm text-body-sm text-muted" style={{ marginTop: 16 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--warning)' }}>info</span>
                Amount: <strong style={{ color: 'var(--on-surface)' }}>{selectedAmount?.toLocaleString()} ETB</strong> for {selectedPlanData?.name}
                {selectedPlanData?.is_custom && ` (${customGb} GB)`}
              </div>
            </div>

            {/* Confirmation Form */}
            <div className="payment-card">
              <h3 className="text-label-lg" style={{ color: 'var(--on-surface)', marginBottom: 'var(--space-md)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, marginRight: 4, color: 'var(--primary)' }}>receipt</span>
                Confirm Deposit
              </h3>
              <p className="text-body-sm text-muted" style={{ marginBottom: 16 }}>
                After making the transfer, enter your transaction reference number below. Our team will verify and activate your plan within 24 hours.
              </p>
              <div className="input-group" style={{ marginBottom: 16 }}>
                <label className="input-label">Bank Reference / Transaction ID</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. FT123456789, TBR-XXXXXXX"
                  value={bankRef}
                  onChange={(e) => setBankRef(e.target.value)}
                />
              </div>
              <div className="card" style={{ background: 'var(--surface-low)', padding: 'var(--space-md)', marginBottom: 16 }}>
                <div className="flex items-center justify-between text-body-sm" style={{ marginBottom: 8 }}>
                  <span className="text-muted">Plan</span>
                  <span style={{ fontWeight: 600 }}>{selectedPlanData?.name}{selectedPlanData?.is_custom ? ` (${customGb} GB)` : ''}</span>
                </div>
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-muted">Amount</span>
                  <span className="text-headline-sm" style={{ color: 'var(--primary)' }}>{selectedAmount?.toLocaleString()} ETB</span>
                </div>
              </div>
              <button
                className="btn btn-primary w-full btn-lg"
                onClick={handleUpgrade}
                disabled={submitting || !bankRef.trim()}
              >
                {submitting ? (
                  <>
                    <span className="spinner spinner-sm" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
                    Submit Upgrade Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
