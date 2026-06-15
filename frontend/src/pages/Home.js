import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import './Home.css';

function Home() {
  const heroRef = useRef(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 30;
      const y = (clientY / innerHeight - 0.5) * 30;
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div className="home-root" ref={heroRef}>
      {/* Animated background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="grid-lines" />

      <nav className="home-nav">
        <div className="logo-mark">₹ PayBack</div>
        <div className="nav-links">
          <Link to="/login" className="nav-link">Sign In</Link>
          <Link to="/register" className="nav-cta">Get Started</Link>
        </div>
      </nav>

      <main className="home-hero">
        <div className="badge">
          <span className="badge-dot" />
          Smart Money Recovery
        </div>

        <h1 className="hero-title">
          Get your<br />
          <span className="gradient-text">money back</span><br />
          gracefully.
        </h1>

        <p className="hero-sub">
          Track loans, send gentle reminders, and manage repayments —
          without the awkward conversations.
        </p>

        <div className="hero-actions">
          <Link to="/register">
            <button className="btn-primary">
              Start for free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </Link>
          <Link to="/login">
            <button className="btn-ghost">Sign in →</button>
          </Link>
        </div>

        <div className="stats-row">
          {[
            { value: '₹2.4Cr+', label: 'Recovered' },
            { value: '18K+', label: 'Loans Tracked' },
            { value: '94%', label: 'Recovery Rate' },
          ].map((s) => (
            <div className="stat-item" key={s.label}>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </main>

      <div className="floating-card card-a">
        <div className="fc-label">Reminder sent</div>
        <div className="fc-name">→ Rahul K.</div>
        <div className="fc-amount">₹12,500</div>
      </div>
      <div className="floating-card card-b">
        <div className="fc-label">Payment received</div>
        <div className="fc-name">Priya S.</div>
        <div className="fc-status paid">Paid ✓</div>
      </div>
    </div>
  );
}

export default Home;