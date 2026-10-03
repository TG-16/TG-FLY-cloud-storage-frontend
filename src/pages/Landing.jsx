import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PLANS = [
  { name: 'Free', storage: '500 MB', price: '0', unit: 'ETB / mo', features: ['500 MB Local S3 Storage', 'Auto Resumable Transfers', 'Standard Support'], highlight: false },
  { name: 'Starter', storage: '5', storageUnit: 'GB', price: '25', unit: 'ETB / mo', features: ['5 GB Secure Cloud Storage', 'Full Speed Peering', 'Password Sharing Links'], highlight: false },
  { name: 'Basic', storage: '10', storageUnit: 'GB', price: '45', unit: 'ETB / mo', features: ['10 GB Cloud Storage', 'Unlimited Transfer Speed', 'BlurHash Instant Previews', 'Priority Telebirr Sync'], highlight: true },
  { name: 'Standard', storage: '20', storageUnit: 'GB', price: '80', unit: 'ETB / mo', features: ['20 GB Cloud Storage', 'Custom Link Expiration', 'Telegram Bot Direct Upload'], highlight: false },
  { name: 'Pro', storage: '50', storageUnit: 'GB', price: '175', unit: 'ETB / mo', features: ['50 GB High Volume Space', 'Multi-device Instant Sync', 'Direct Phone Support'], highlight: false },
];

const FAQS = [
  { q: 'What happens if my Wi-Fi cuts out in the middle of a 1 GB upload?', a: 'Nothing is lost! The TG-Fly client stores your transfer state block-by-block. When your Wi-Fi or mobile data reconnects, our servers verify the last validated 5 MB chunk and continue seamlessly from that exact byte. You will never have to re-upload from 0%.' },
  { q: 'How do I pay if I do not have a Visa or Mastercard?', a: "You don't need international cards. TG-Fly is natively integrated with Telebirr and CBE Mobile Banking. You simply scan a QR code or approve an instant payment push directly in your Telebirr app. Your subscription activates immediately in Ethiopian Birr." },
  { q: 'Are my files kept in Ethiopia or overseas?', a: "All customer data resides physically within Ethio Telecom's certified Tier-III TeleCloud data center in Addis Ababa. This guarantees complete national data residency compliance and ultra-low ping speeds for users anywhere across Ethiopia." },
  { q: 'How do "Telegram-Style Previews" save my mobile data?', a: 'Instead of downloading a massive 40 MB image or a multi-page PDF document to check what file it is, TG-Fly serves lightweight BlurHash algorithmic placeholders (under 1 KB) and extracted metadata. You only burn your paid telecom data package when you explicitly click to download the full asset.' },
  { q: 'Is there a contract or commitment on paid tiers?', a: 'Zero contracts. All paid plans run on a monthly prepaid cycle. You can upgrade, downgrade, or return to our Free 500 MB tier at any time without fees or penalties.' },
];

export default function Landing() {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);
  const [sliderValue, setSliderValue] = useState(120);
  const customPrice = sliderValue * 6;

  return (
    <div className="landing">
      {/* ─── NAV ─── */}
      <header className="landing-nav">
        <div className="container-wide flex items-center justify-between" style={{ height: '100%', maxWidth: 1440, margin: '0 auto', padding: '0 var(--container-pad, 48px)' }}>
          <div className="flex items-center gap-md">
            <Link to="/" className="app-logo">
              <img src="/logo.png" alt="TG-Fly" className="logo-img" />
              <span className="logo-text">TG-Fly</span>
            </Link>
          </div>
          <nav className="landing-nav-links hide-mobile">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#how-it-works" className="landing-nav-link">How it Works</a>
            <a href="#pricing" className="landing-nav-link">Pricing</a>
          </nav>
          <div className="landing-nav-actions">
            {user ? (
              <Link to="/files" className="btn btn-primary">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="landing-nav-link hide-mobile">Sign In</Link>
                <Link to="/signup" className="btn btn-primary">Get 500 MB Free</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="landing-hero">
        <div className="hero-blur-1" />
        <div className="hero-blur-2" />
        <div className="container-wide" style={{ maxWidth: 1440, margin: '0 auto', padding: '0 var(--container-pad, 48px)', position: 'relative', zIndex: 10 }}>
          <div className="hero-grid">
            {/* Left */}
            <div className="animate-slideUp">
              <div className="hero-tag">
                <span className="hero-tag-dot" />
                <span className="text-label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Direct Ethio TeleCloud S3 Peering</span>
              </div>
              <h1 className="hero-title">
                Store, protect, and fly your files anywhere — <span className="hero-title-accent">even on spotty internet.</span>
              </h1>
              <p className="hero-subtitle">
                Engineered exclusively for Ethiopia's network realities. Backed by domestic Ethio TeleCloud infrastructure, 100% local Birr billing via Telebirr or CBE, and resilient transfer protocols that never force you to restart an interrupted upload from 0%.
              </p>
              <div className="hero-actions">
                <Link to="/signup" className="btn btn-primary btn-lg" style={{ boxShadow: 'var(--shadow-level-2)' }}>
                  Start Free with 500 MB
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                </Link>
                <a href="#how-it-works" className="btn btn-secondary btn-lg">
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>play_circle</span>
                  See How Resumable Uploads Work
                </a>
              </div>
              <div className="hero-stats">
                <div>
                  <div className="hero-stat-value" style={{ color: 'var(--on-primary-container)' }}>0 Birr</div>
                  <div className="text-label-sm text-muted">No credit card needed</div>
                </div>
                <div>
                  <div className="hero-stat-value" style={{ color: 'var(--primary)' }}>100% Byte</div>
                  <div className="text-label-sm text-muted">Continuous byte recovery</div>
                </div>
                <div>
                  <div className="hero-stat-value" style={{ color: 'var(--tertiary)' }}>Addis Peered</div>
                  <div className="text-label-sm text-muted">&lt; 12ms latency</div>
                </div>
              </div>
            </div>

            {/* Right — Transfer Card */}
            <div className="hero-card animate-fadeIn">
              <div className="hero-card-header">
                <div className="flex items-center gap-sm">
                  <div className="hero-card-icon">
                    <span className="material-symbols-outlined">cloud_sync</span>
                  </div>
                  <div>
                    <div className="text-label-lg" style={{ color: 'var(--on-surface)' }}>TG-Fly Active Transfer</div>
                    <div className="text-body-sm text-muted">TeleCloud S3 Addis Gateway</div>
                  </div>
                </div>
                <span className="badge badge-accent">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-container)', display: 'inline-block' }} className="animate-ping" />
                  Auto-Resuming
                </span>
              </div>

              <div className="hero-card-alert">
                <div className="hero-card-alert-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>wifi_off</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center justify-between">
                    <span className="text-label-sm" style={{ fontWeight: 600, color: 'var(--on-surface)' }}>Connection Restored</span>
                    <span className="text-label-sm text-muted">1 sec ago</span>
                  </div>
                  <p className="text-body-sm text-muted" style={{ marginTop: 2 }}>
                    Wi-Fi dropped at 362 MB. Checkpointed chunk safe. Resuming from 362.4 MB without restarting.
                  </p>
                </div>
              </div>

              <div className="hero-card-transfer">
                <div className="flex items-center gap-sm" style={{ marginBottom: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--rounded)', background: 'var(--surface-lowest)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-container)', boxShadow: 'var(--shadow-level-1)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 28 }}>video_file</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="text-label-lg truncate" style={{ color: 'var(--on-surface)' }}>Architectural_Walkthrough_4K.mp4</div>
                    <div className="text-body-sm text-muted">450.0 MB • Chunk 73 of 90</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-label-sm" style={{ marginBottom: 6 }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>82% Completed</span>
                  <span className="text-muted">369.0 MB / 450 MB</span>
                </div>
                <div className="hero-progress-bar">
                  <div className="hero-progress-fill" style={{ width: '82%' }}>
                    <span className="hero-progress-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-label-sm text-muted" style={{ marginTop: 8 }}>
                  <span className="flex items-center gap-xs">
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--tertiary)' }}>speed</span>
                    14.8 MB/s (TeleCloud Fiber)
                  </span>
                  <span style={{ color: 'var(--primary)' }}>Est. 5s remaining</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-body-sm text-muted" style={{ marginTop: 16, paddingTop: 12 }}>
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--tertiary)' }}>verified_user</span>
                  AES-256 Bit Encrypted
                </span>
                <span className="text-label-sm" style={{ background: 'var(--primary-fixed)', color: 'var(--on-primary-fixed)', padding: '2px 8px', borderRadius: 'var(--rounded-sm)' }}>0 Bytes Lost</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="trust-bar">
        <div className="container-wide" style={{ maxWidth: 1440, margin: '0 auto', padding: '0 var(--container-pad, 48px)' }}>
          <div className="trust-grid">
            <div className="trust-item">
              <div className="trust-icon" style={{ color: 'var(--primary)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 26 }}>cell_tower</span>
              </div>
              <div>
                <div className="trust-title">Ethio TeleCloud Peered</div>
                <div className="trust-desc">Domestic Tier-III Addis Ababa S3 data center storage.</div>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon" style={{ color: 'var(--tertiary)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 26 }}>account_balance_wallet</span>
              </div>
              <div>
                <div className="trust-title">Telebirr & CBE Birr Native</div>
                <div className="trust-desc">Direct mobile money subscriptions without international FX.</div>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon" style={{ color: 'var(--secondary)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 26 }}>lock</span>
              </div>
              <div>
                <div className="trust-title">100% Domestic Residency</div>
                <div className="trust-desc">Ethiopian files stay on sovereign, compliant national soil.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="features-section" id="features">
        <div className="container-wide" style={{ maxWidth: 1440, margin: '0 auto', padding: '0 var(--container-pad, 48px)' }}>
          <div className="flex flex-col items-center text-center gap-md" style={{ marginBottom: 64, maxWidth: 640, margin: '0 auto 64px' }}>
            <span className="section-tag section-tag-secondary">Engineered for Reality</span>
            <h2 className="section-heading" style={{ textAlign: 'center' }}>Cloud storage built specifically for Ethiopia's network conditions</h2>
            <p className="section-desc" style={{ textAlign: 'center' }}>Global cloud providers assume flawless fiber connections and Visa cards. TG-Fly is purpose-built around local bandwidth patterns, micro-outages, and Ethiopian Birr.</p>
          </div>

          <div className="bento-grid">
            {/* Feature 1 */}
            <div className="feature-card bento-7">
              <div>
                <div className="feature-icon-wrap" style={{ background: 'rgba(0, 153, 255, 0.1)', color: 'var(--primary-container)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 28 }}>sync_saved_locally</span>
                </div>
                <h3 className="feature-title">Never Restart an Upload from 0%</h3>
                <p className="feature-desc">Uploading an 800 MB video when your connection glitches? TG-Fly breaks every file into verifiable 5 MB blocks. When you reconnect 5 minutes or 5 hours later, the upload instantly resumes right where it halted.</p>
              </div>
              <div className="feature-illustration">
                <div className="flex items-center justify-between text-label-sm text-muted" style={{ marginBottom: 12 }}>
                  <span>Payload: Client_Branding_Assets.zip (1.2 GB)</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Resuming Chunk 142/240</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '7fr 2fr 3fr', gap: 6, height: 24 }}>
                  <div style={{ background: 'var(--primary)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700 }}>Safe Chunks (710 MB)</div>
                  <div style={{ background: 'var(--primary-container)', borderRadius: 4 }} className="animate-pulse" />
                  <div style={{ background: 'var(--surface-highest)', borderRadius: 4 }} />
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="feature-card bento-5">
              <div>
                <div className="feature-icon-wrap" style={{ background: 'rgba(179, 235, 255, 0.6)', color: 'var(--tertiary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 28 }}>payments</span>
                </div>
                <h3 className="feature-title">Pay Straight in Ethiopian Birr</h3>
                <p className="feature-desc">Forget international card limits, foreign exchange approvals, or PayPal hurdles. Subscribe effortlessly using Telebirr, CBE Mobile Banking, or Awash Birr in under 30 seconds.</p>
              </div>
              <div className="feature-illustration flex items-center justify-around" style={{ padding: 16 }}>
                {[{ code: 'TB', label: 'Telebirr', color: 'var(--primary)' }, { code: 'CBE', label: 'CBE Birr', color: 'var(--on-primary-container)' }, { code: 'AB', label: 'Awash', color: 'var(--secondary)' }].map((b, i) => (
                  <div key={i} className="flex flex-col items-center gap-xs">
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-lowest)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-level-1)', color: b.color, fontWeight: 700, fontSize: 14 }}>{b.code}</div>
                    <span className="text-label-sm">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature 3 */}
            <div className="feature-card bento-6">
              <div>
                <div className="feature-icon-wrap" style={{ background: 'var(--secondary-fixed)', color: 'var(--secondary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 28 }}>speed</span>
                </div>
                <h3 className="feature-title">Direct Ethio Telecom Peering</h3>
                <p className="feature-desc">Your data doesn't loop through undersea cables in Frankfurt or Dubai. Direct routing to Ethio TeleCloud S3 storage in Addis Ababa delivers up to 10x faster upload speeds.</p>
              </div>
              <div className="feature-illustration flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 22 }}>router</span>
                  <div>
                    <div className="text-label-md" style={{ fontWeight: 600, color: 'var(--on-surface)' }}>Local Latency</div>
                    <div className="text-body-sm text-muted">Addis Metropolitan Region</div>
                  </div>
                </div>
                <span className="text-headline-sm" style={{ color: 'var(--primary)' }}>8 - 14 ms</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="feature-card bento-6">
              <div>
                <div className="feature-icon-wrap" style={{ background: 'rgba(0, 163, 196, 0.15)', color: 'var(--tertiary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 28 }}>preview</span>
                </div>
                <h3 className="feature-title">Telegram-Style Instant Previews</h3>
                <p className="feature-desc">Don't burn expensive mobile data packages downloading full files just to check what they are. Micro BlurHash thumbnails and instant text previews load using less than 1 kilobyte.</p>
              </div>
              <div className="feature-illustration flex items-center gap-sm">
                <div style={{ width: 40, height: 40, borderRadius: 'var(--rounded)', background: 'var(--surface-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface-variant)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>image</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center justify-between">
                    <span className="text-label-sm" style={{ fontWeight: 600, color: 'var(--on-surface)' }}>BlurHash Instant Render</span>
                    <span className="text-label-sm" style={{ color: 'var(--tertiary)' }}>&lt; 0.8 KB Data</span>
                  </div>
                  <p className="text-body-sm text-muted">Inspect full metadata before committing MBs to download.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="how-section" id="how-it-works">
        <div className="container-wide" style={{ maxWidth: 1440, margin: '0 auto', padding: '0 var(--container-pad, 48px)' }}>
          <div className="flex flex-col items-center text-center gap-md" style={{ marginBottom: 64, maxWidth: 640, margin: '0 auto 64px' }}>
            <span className="section-tag section-tag-primary">Frictionless Workflow</span>
            <h2 className="section-heading" style={{ textAlign: 'center' }}>How TG-Fly keeps your files moving</h2>
            <p className="section-desc" style={{ textAlign: 'center' }}>Designed with radical simplicity. No complicated FTP tools or obscure terminal commands.</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number" style={{ background: 'var(--primary-container)' }}>1</div>
              <h3 className="step-title">Drag & Drop Any File</h3>
              <p className="step-desc">Drop PDFs, high-res photos, 4K video rushes, CAD files, or archives directly into your browser or our lightweight Telegram bot.</p>
              <div className="step-dropzone" style={{ marginTop: 16 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32 }}>upload_file</span>
                <div className="text-label-sm text-muted" style={{ marginTop: 4 }}>Drag files here</div>
              </div>
            </div>
            <div className="step-card">
              <div className="step-number" style={{ background: 'var(--primary)' }}>2</div>
              <h3 className="step-title">Watch It Fly with Chunking</h3>
              <p className="step-desc">The TG-Fly engine slices files into atomic data packets. If your electric power trips or mobile signal dips, state is stored locally.</p>
              <div className="step-illustration" style={{ marginTop: 16 }}>
                <div className="flex items-center justify-between text-label-sm text-muted" style={{ marginBottom: 8 }}>
                  <span>Dynamic Chunking</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Active</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: '66%' }} /></div>
              </div>
            </div>
            <div className="step-card">
              <div className="step-number" style={{ background: 'var(--tertiary)' }}>3</div>
              <h3 className="step-title">Access Anywhere, Anytime</h3>
              <p className="step-desc">Download at wire speeds from anywhere in Ethiopia. Generate short shareable links, set password locks, or stream media directly.</p>
              <div className="step-illustration flex items-center justify-between" style={{ marginTop: 16 }}>
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: 20 }}>share</span>
                  <span className="text-label-sm">tgfly.et/s/doc-89</span>
                </div>
                <button className="btn btn-sm btn-secondary" style={{ padding: '4px 8px' }}>Copy</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="pricing-section" id="pricing">
        <div className="container-wide" style={{ maxWidth: 1440, margin: '0 auto', padding: '0 var(--container-pad, 48px)' }}>
          <div className="flex flex-col items-center text-center gap-md" style={{ marginBottom: 64, maxWidth: 640, margin: '0 auto 64px' }}>
            <span className="section-tag section-tag-primary">Transparent Birr Billing</span>
            <h2 className="section-heading" style={{ textAlign: 'center' }}>Simple, predictable pricing. No dollar conversion surprises.</h2>
            <p className="section-desc" style={{ textAlign: 'center' }}>Renew monthly with Telebirr or CBE Birr. Cancel or scale storage anytime with zero lock-in contracts.</p>
          </div>

          <div className="pricing-grid">
            {PLANS.map((plan, i) => (
              <div className={`pricing-card ${plan.highlight ? 'pricing-highlight' : ''}`} key={i}>
                {plan.highlight && <div className="pricing-popular-badge">Most Popular</div>}
                <div>
                  <div className="pricing-name">{plan.name}</div>
                  <div style={{ margin: '12px 0' }}>
                    <span className="pricing-amount" style={plan.highlight ? { color: 'var(--primary-container)' } : {}}>{plan.price}</span>
                    <span className="pricing-unit"> {plan.unit}</span>
                  </div>
                  <ul className="pricing-features">
                    {plan.features.map((f, j) => (
                      <li className="pricing-feature" key={j}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>{plan.highlight ? 'check_circle' : 'check'}</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  to="/signup"
                  className={`btn w-full ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ marginTop: 16 }}
                >
                  {plan.price === '0' ? 'Get Started' : plan.highlight ? `Select ${plan.name}` : `Choose ${plan.name}`}
                  {plan.highlight && <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>}
                </Link>
              </div>
            ))}
          </div>

          {/* Custom Calculator */}
          <div className="calculator-section">
            <div className="calculator-grid">
              <div>
                <div className="text-label-sm" style={{ color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Custom Enterprise Sizing</div>
                <h3 className="text-headline-md" style={{ color: 'var(--on-surface)', marginBottom: 8 }}>Need more than 50 GB?</h3>
                <p className="text-body-md text-muted">Scale up seamlessly with our linear volumetric rate of just <strong>6 ETB per GB per month</strong>.</p>
              </div>
              <div>
                <div className="flex items-center justify-between text-label-md" style={{ marginBottom: 12 }}>
                  <span style={{ color: 'var(--on-surface)' }}>Select Capacity:</span>
                  <span className="text-headline-sm" style={{ color: 'var(--on-primary-container)' }}>{sliderValue} GB</span>
                </div>
                <input type="range" className="calculator-slider" min={60} max={1000} step={10} value={sliderValue} onChange={e => setSliderValue(Number(e.target.value))} />
                <div className="flex items-center justify-between text-label-sm text-muted calculator-labels" style={{ marginTop: 8 }}>
                  <span>60 GB</span><span>250 GB</span><span>500 GB</span><span>1,000 GB (1 TB)</span>
                </div>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: 16 }}>
                <div className="text-body-sm text-muted">Estimated Monthly Cost</div>
                <div style={{ margin: '4px 0' }}>
                  <span className="text-headline-lg tabular-nums" style={{ color: 'var(--primary)' }}>{customPrice.toLocaleString()}</span>
                  <span className="text-label-md" style={{ fontWeight: 600, color: 'var(--on-surface)' }}> ETB / mo</span>
                </div>
                <Link to="/signup" className="btn btn-primary btn-sm w-full" style={{ marginTop: 8 }}>Order Custom Plan</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="faq-section" style={{ padding: '80px 24px' }}>
        <div className="flex flex-col items-center text-center gap-md" style={{ marginBottom: 48 }}>
          <span className="section-tag section-tag-secondary">Answers</span>
          <h2 className="section-heading" style={{ textAlign: 'center' }}>Frequently Asked Questions</h2>
          <p className="section-desc" style={{ textAlign: 'center' }}>Everything you need to know about resumable transfers, payments, and storage privacy.</p>
        </div>
        <div className="faq-list">
          {FAQS.map((faq, i) => (
            <div className="faq-item" key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <div className="faq-header">
                <h3 className="faq-question">{faq.q}</h3>
                <span className={`material-symbols-outlined faq-chevron ${openFaq === i ? 'open' : ''}`}>expand_more</span>
              </div>
              {openFaq === i && <div className="faq-answer animate-slideUp">{faq.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="cta-banner">
        <div className="cta-blur-1" />
        <div className="cta-blur-2" />
        <div className="container-wide flex flex-col items-center text-center gap-lg" style={{ position: 'relative', zIndex: 10, maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 'var(--rounded-full)', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#fff' }}>verified</span>
            <span className="text-label-sm" style={{ color: '#fff' }}>Ethio TeleCloud Verified Gateway</span>
          </div>
          <h2 className="text-display" style={{ color: '#fff', maxWidth: 640 }}>Never lose another upload to an Ethiopian internet glitch.</h2>
          <p className="text-body-lg" style={{ color: 'var(--primary-fixed)', maxWidth: 560 }}>
            Join thousands of students, architects, software engineers, and media creators who trust TG-Fly for bulletproof file storage in Addis Ababa and beyond.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-md">
            <Link to="/signup" className="btn btn-lg" style={{ background: '#fff', color: 'var(--on-primary-container)', fontWeight: 600 }}>
              Start Free with 500 GB
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </Link>
            <Link to="/signup" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(4px)' }}>
              Explore the Plans
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="landing-footer">
        <div className="container-wide flex items-center justify-between" style={{ maxWidth: 1440, margin: '0 auto', padding: '0 var(--container-pad, 48px)' }}>
          <Link to="/" className="app-logo">
            <img src="/logo.png" alt="TG-Fly" className="logo-img" style={{ height: 24 }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>TG-Fly Cloud</span>
          </Link>
          <div className="footer-links hide-mobile">
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
            <a href="#" className="footer-link">Support Center</a>
          </div>
          <p className="footer-text">© {new Date().getFullYear()} TG-Fly Telecloud Services. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
