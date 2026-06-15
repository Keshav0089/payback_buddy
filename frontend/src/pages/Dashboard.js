import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const API = 'http://localhost:8080/payback/backend/api';

function Dashboard() {
  const navigate  = useNavigate();
  const userRef   = useRef(JSON.parse(sessionStorage.getItem('user') || 'null'));
  const user      = userRef.current;

  const [lenderLoans,   setLenderLoans]   = useState([]);
  const [borrowerLoans, setBorrowerLoans] = useState([]);
  const [activeTab,     setActiveTab]     = useState('lent');
  const [statusFilter,  setStatusFilter]  = useState('All');
  const [loading,       setLoading]       = useState(true);
  const [submitting,    setSubmitting]    = useState(false);
  const [toast,         setToast]         = useState(null);
  const [showForm,      setShowForm]      = useState(false);
  const [reminderLoading, setReminderLoading] = useState(null);
  const [payingLoan,    setPayingLoan]    = useState(null);   // loan being paid
  const [partialAmount, setPartialAmount] = useState('');     // partial amount input

  const [form, setForm] = useState({
    lender_name: user?.name || '',
    borrower_name: '', borrower_email: '',
    amount: '', reason: '', due_date: '',
  });

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchLoans = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API}/getLoans.php?user_id=${user.id}&email=${encodeURIComponent(user.email)}`);
      setLenderLoans(Array.isArray(res.data.lender_loans)   ? res.data.lender_loans   : []);
      setBorrowerLoans(Array.isArray(res.data.borrower_loans) ? res.data.borrower_loans : []);
    } catch {
      showToast('Failed to load loans.', 'error');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchLoans();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchLoans, navigate]);

  // ── Add loan ──
  const submitHandler = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/addLoan.php`, { ...form, user_id: user.id });
      if (res.data.success) {
        showToast('Loan added!');
        setShowForm(false);
        setForm({ lender_name: user.name, borrower_name: '', borrower_email: '', amount: '', reason: '', due_date: '' });
        fetchLoans();
      } else {
        showToast(res.data.message || 'Failed to add loan.', 'error');
      }
    } catch { showToast('Server error.', 'error'); }
    finally { setSubmitting(false); }
  };

  // ── Manual reminder ──
  const sendReminder = async (loan) => {
    setReminderLoading(loan.id);
    try {
      const res = await axios.post(`${API}/sendReminder.php`, {
        loan_id: loan.id,
        message: `Hey ${loan.borrower_name} 😊 Gentle reminder from ${user.name} to return ₹${Number(loan.remaining || loan.amount).toLocaleString('en-IN')}.`,
      });
      showToast(res.data.message, res.data.success ? 'success' : 'error');
      fetchLoans();
    } catch { showToast('Failed to send reminder.', 'error'); }
    finally { setReminderLoading(null); }
  };

  // ── Load Razorpay SDK ──
  const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  // ── Initiate payment (full or partial) ──
  const initiatePayment = async (loan, isPartial = false) => {
    const pAmt = isPartial ? parseFloat(partialAmount) : 0;

    if (isPartial) {
      if (!pAmt || pAmt <= 0) { showToast('Enter a valid partial amount.', 'error'); return; }
      if (pAmt > parseFloat(loan.remaining)) {
        showToast(`Amount can't exceed remaining balance ₹${loan.remaining}.`, 'error'); return;
      }
    }

    const loaded = await loadRazorpay();
    if (!loaded) { showToast('Failed to load payment gateway.', 'error'); return; }

    try {
      const res = await axios.post(`${API}/createOrder.php`, {
        loan_id: loan.id, user_id: user.id,
        partial_amount: isPartial ? pAmt : 0,
      });

      if (!res.data.success) { showToast(res.data.message || 'Could not start payment.', 'error'); return; }

      const { order_id, amount, key_id, borrower_name, borrower_email, charge_amount } = res.data;

      const options = {
        key: key_id,
        amount,
        currency: 'INR',
        name: 'PayBack Buddy',
        description: isPartial
          ? `Partial repayment for loan #${loan.id}`
          : `Full repayment for loan #${loan.id}`,
        order_id,
        prefill: { name: borrower_name, email: borrower_email },
        theme: { color: '#6366f1' },
        handler: async (response) => {
          try {
            const verify = await axios.post(`${API}/verifyPayment.php`, {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              loan_id:             loan.id,
              user_id:             user.id,
              amount_paid:         charge_amount,
            });

            if (verify.data.success) {
              showToast(verify.data.message);
              setPayingLoan(null);
              setPartialAmount('');
              fetchLoans();
              // Auto-generate receipt
              if (verify.data.status === 'Paid') {
                generateReceipt({ ...loan, amount_paid: loan.amount }, response.razorpay_payment_id);
              }
            } else {
              showToast(verify.data.message || 'Verification failed.', 'error');
            }
          } catch { showToast('Verification error. Contact support.', 'error'); }
        },
        modal: { ondismiss: () => showToast('Payment cancelled.', 'warn') },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (r) => showToast('Payment failed: ' + r.error.description, 'error'));
      rzp.open();

    } catch { showToast('Server error. Could not start payment.', 'error'); }
  };

  // ── PDF Receipt ──
  const generateReceipt = async (loan, paymentId = '') => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    const pageW  = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Header bar
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, pageW, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('PayBack Buddy', margin, 22);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment Receipt', margin, 33);

    y = 55;

    // Receipt meta
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Receipt No: PB-${loan.id}-${Date.now().toString().slice(-6)}`, pageW - margin, y, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageW - margin, y + 7, { align: 'right' });

    y = 75;

    // Status badge
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(margin, y - 7, 38, 10, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PAID', margin + 13, y);

    y += 15;

    // Party details
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 10;

    const col2 = pageW / 2 + 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('FROM (Lender)', margin, y);
    doc.text('TO (Borrower)', col2, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.text(loan.lender_name, margin, y);
    doc.text(loan.borrower_name, col2, y);
    y += 7;

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(loan.borrower_email || '', col2, y);
    y += 15;

    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, pageW - margin, y);
    y += 12;

    // Amount block
    doc.setFillColor(248, 248, 255);
    doc.roundedRect(margin, y, pageW - margin * 2, 28, 4, 4, 'F');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Amount Paid', margin + 8, y + 10);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text(`₹ ${Number(loan.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin + 8, y + 22);
    y += 38;

    // Details table
    const rows = [
      ['Loan ID',    `#${loan.id}`],
      ['Reason',     loan.reason || '—'],
      ['Due Date',   loan.due_date || '—'],
      ['Payment ID', paymentId || 'Manual'],
      ['Status',     'Fully Paid'],
    ];

    doc.setFontSize(10);
    rows.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text(label, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text(String(value), margin + 55, y);
      y += 9;
    });

    y += 8;
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, pageW - margin, y);
    y += 10;

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text('This is a computer-generated receipt from PayBack Buddy.', pageW / 2, y, { align: 'center' });
    doc.text('No signature required.', pageW / 2, y + 6, { align: 'center' });

    doc.save(`PayBack_Receipt_Loan${loan.id}.pdf`);
    showToast('Receipt downloaded!');
  };

  const logout = () => { sessionStorage.removeItem('user'); navigate('/'); };

  const isOverdue = (due, status) => status !== 'Paid' && due && new Date(due) < new Date();
  const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  const totalLent      = lenderLoans.reduce((s, l) => s + parseFloat(l.amount || 0), 0);
  const totalRecovered = lenderLoans.reduce((s, l) => s + parseFloat(l.amount_paid || 0), 0);
  const totalOwed      = borrowerLoans.filter(l => l.status !== 'Paid').reduce((s, l) => s + parseFloat(l.remaining || 0), 0);
  const pendingLent    = lenderLoans.filter(l => l.status !== 'Paid').length;

  const sourceList   = activeTab === 'lent' ? lenderLoans : borrowerLoans;
  const displayLoans = sourceList.filter(l => statusFilter === 'All' ? true : l.status === statusFilter);

  return (
    <div className="dash-root">
      <div className="dash-bg-orb orb-a" />
      <div className="dash-bg-orb orb-b" />

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">₹ PayBack</div>
        <nav className="sidebar-nav">
          <button className={`sidebar-item ${activeTab === 'lent' ? 'active' : ''}`}
            onClick={() => { setActiveTab('lent'); setStatusFilter('All'); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
            Money I Lent
            {pendingLent > 0 && <span className="sidebar-badge">{pendingLent}</span>}
          </button>
          <button className={`sidebar-item ${activeTab === 'owed' ? 'active' : ''}`}
            onClick={() => { setActiveTab('owed'); setStatusFilter('All'); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
              <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
            </svg>
            Money I Owe
            {borrowerLoans.filter(l => l.status !== 'Paid').length > 0 &&
              <span className="sidebar-badge red">{borrowerLoans.filter(l => l.status !== 'Paid').length}</span>}
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{(user?.name || 'U')[0].toUpperCase()}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <main className="dash-main">
        <header className="dash-header">
          <div>
            <h1 className="dash-title">{activeTab === 'lent' ? 'Money I Lent' : 'Money I Owe'}</h1>
            <p className="dash-sub">Logged in as <strong style={{ color: '#a5b4fc' }}>{user?.name}</strong></p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {activeTab === 'lent' && (
              <button className="add-loan-btn" onClick={() => setShowForm(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Add Loan
              </button>
            )}
          </div>
        </header>

        {/* Stats */}
        <div className="stats-grid">
          {(activeTab === 'lent' ? [
            { label: 'Total Lent',    value: `₹${fmt(totalLent)}`,                       color: '#6366f1', icon: '📤' },
            { label: 'Recovered',     value: `₹${fmt(totalRecovered)}`,                   color: '#10b981', icon: '✅' },
            { label: 'Still Pending', value: `₹${fmt(totalLent - totalRecovered)}`,       color: '#f59e0b', icon: '⏳' },
            { label: 'Overdue',       value: `${lenderLoans.filter(l => isOverdue(l.due_date, l.status)).length} loans`, color: '#ef4444', icon: '🚨' },
          ] : [
            { label: 'Total I Owe',  value: `₹${fmt(borrowerLoans.reduce((s,l)=>s+parseFloat(l.amount||0),0))}`, color: '#6366f1', icon: '📥' },
            { label: 'Still Due',    value: `₹${fmt(totalOwed)}`,   color: '#ef4444', icon: '🚨' },
            { label: 'Paid Back',    value: `₹${fmt(borrowerLoans.reduce((s,l)=>s+parseFloat(l.amount_paid||0),0))}`, color: '#10b981', icon: '✅' },
            { label: 'Reminders',    value: `${borrowerLoans.reduce((s,l)=>s+parseInt(l.reminder_count||0),0)} received`, color: '#f59e0b', icon: '🔔' },
          ]).map((s) => (
            <div className="stat-card" key={s.label} style={{ '--accent': s.color }}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-val">{s.value}</div>
              <div className="stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="filter-tabs">
          {['All', 'Pending', 'Partial', 'Paid'].map((f) => (
            <button key={f} className={`filter-tab ${statusFilter === f ? 'active' : ''}`} onClick={() => setStatusFilter(f)}>
              {f}
              <span className="tab-count">
                {f === 'All' ? sourceList.length : sourceList.filter(l => l.status === f).length}
              </span>
            </button>
          ))}
        </div>

        {/* Loans */}
        {loading ? (
          <div className="loading-state"><div className="loading-spinner" /><p>Loading…</p></div>
        ) : displayLoans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{activeTab === 'lent' ? '💸' : '🎉'}</div>
            <h3>{activeTab === 'lent' ? 'No loans found' : 'You owe nothing!'}</h3>
            <p>{activeTab === 'lent' ? 'Click "Add Loan" to start.' : 'No one has added you as a borrower yet.'}</p>
          </div>
        ) : (
          <div className="loans-grid">
            {displayLoans.map((loan) => {
              const overdue  = isOverdue(loan.due_date, loan.status);
              const isLender = activeTab === 'lent';
              const paidPct  = Math.min(100, parseFloat(loan.paid_percent || 0));
              const isPartiallyPaid = loan.status === 'Partial';

              return (
                <div key={loan.id} className={`loan-card ${loan.status === 'Paid' ? 'card-paid' : overdue ? 'card-overdue' : isPartiallyPaid ? 'card-partial' : ''}`}>

                  <div className="loan-card-header">
                    <div className="borrower-avatar">
                      {(isLender ? loan.borrower_name : loan.lender_name)[0].toUpperCase()}
                    </div>
                    <div className="borrower-info">
                      <div className="borrower-name">{isLender ? loan.borrower_name : loan.lender_name}</div>
                      <div className="borrower-email">
                        {isLender ? `📤 You lent to ${loan.borrower_name}` : `📥 ${loan.lender_name} lent you this`}
                      </div>
                    </div>
                    <div className={`loan-badge ${loan.status === 'Paid' ? 'badge-paid' : overdue ? 'badge-overdue' : isPartiallyPaid ? 'badge-partial' : 'badge-pending'}`}>
                      {loan.status === 'Paid' ? '✓ Paid' : overdue ? 'Overdue' : isPartiallyPaid ? 'Partial' : 'Pending'}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="loan-amount">₹{fmt(loan.amount)}</div>

                  {/* Progress bar for partial payments */}
                  {(isPartiallyPaid || parseFloat(loan.amount_paid) > 0) && loan.status !== 'Paid' && (
                    <div className="progress-wrap">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${paidPct}%` }} />
                      </div>
                      <div className="progress-labels">
                        <span>Paid: ₹{fmt(loan.amount_paid)} ({paidPct}%)</span>
                        <span>Left: ₹{fmt(loan.remaining)}</span>
                      </div>
                    </div>
                  )}

                  {/* Details */}
                  <div className="loan-details">
                    <div className="loan-detail-row">
                      <span className="detail-label">Reason</span>
                      <span className="detail-value">{loan.reason || '—'}</span>
                    </div>
                    <div className="loan-detail-row">
                      <span className="detail-label">Due Date</span>
                      <span className={`detail-value ${overdue ? 'text-red' : ''}`}>{loan.due_date || '—'}</span>
                    </div>
                    {isLender && (
                      <div className="loan-detail-row">
                        <span className="detail-label">Reminders</span>
                        <span className="detail-value">{loan.reminder_count > 0 ? `${loan.reminder_count} sent` : 'None'}</span>
                      </div>
                    )}
                    {!isLender && loan.last_reminder_message && (
                      <div className="reminder-bubble">
                        <div className="reminder-bubble-label">💬 Latest reminder</div>
                        <div className="reminder-bubble-text">{loan.last_reminder_message}</div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="loan-actions" style={{ flexDirection: 'column', gap: '8px' }}>
                    {loan.status !== 'Paid' && isLender && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="action-remind" onClick={() => sendReminder(loan)}
                          disabled={reminderLoading === loan.id}>
                          {reminderLoading === loan.id ? '⏳' : `🔔 Remind${loan.reminder_count > 0 ? ` (${loan.reminder_count})` : ''}`}
                        </button>
                      </div>
                    )}

                    {loan.status !== 'Paid' && !isLender && (
                      <>
                        {/* Full pay */}
                        <button className="action-pay action-pay-now"
                          onClick={() => { setPayingLoan(loan); setPartialAmount(''); }}>
                          💳 Pay Now — ₹{fmt(loan.remaining || loan.amount)}
                        </button>
                        {/* Partial pay */}
                        {payingLoan?.id === loan.id ? (
                          <div className="partial-pay-box">
                            <div className="partial-pay-label">Enter partial amount (₹)</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type="number"
                                className="field-input"
                                placeholder={`Max ₹${fmt(loan.remaining)}`}
                                value={partialAmount}
                                min="1"
                                max={loan.remaining}
                                style={{ flex: 1, padding: '8px 10px', fontSize: '13px' }}
                                onChange={(e) => setPartialAmount(e.target.value)}
                              />
                              <button className="action-pay"
                                style={{ padding: '8px 14px', fontSize: '13px', whiteSpace: 'nowrap' }}
                                onClick={() => initiatePayment(loan, true)}>
                                Pay ₹{partialAmount || '—'}
                              </button>
                              <button className="action-remind"
                                style={{ padding: '8px 10px', fontSize: '13px' }}
                                onClick={() => { setPayingLoan(null); setPartialAmount(''); }}>
                                ✕
                              </button>
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(240,244,255,0.35)', marginTop: '4px' }}>
                              Or: <span className="pay-full-link" onClick={() => initiatePayment(loan)}>pay full ₹{fmt(loan.remaining)}</span>
                            </div>
                          </div>
                        ) : (
                          <button className="action-remind"
                            style={{ fontSize: '13px' }}
                            onClick={() => { setPayingLoan(loan); setPartialAmount(''); }}>
                            💵 Pay Partial Amount
                          </button>
                        )}
                      </>
                    )}

                    {/* Download receipt for paid loans */}
                    {loan.status === 'Paid' && (
                      <button className="receipt-btn" onClick={() => generateReceipt(loan)}>
                        📄 Download Receipt
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Loan Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">New Loan</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={submitHandler} className="modal-form">
              <div className="modal-grid">
                {[
                  { label: 'Your Name',      type: 'text',   val: form.lender_name,    key: 'lender_name',    ph: '' },
                  { label: 'Borrower Name',  type: 'text',   val: '',                  key: 'borrower_name',  ph: 'Who borrowed?' },
                  { label: 'Borrower Email', type: 'email',  val: '',                  key: 'borrower_email', ph: 'borrower@email.com' },
                  { label: 'Amount (₹)',     type: 'number', val: '',                  key: 'amount',         ph: '0' },
                  { label: 'Reason',         type: 'text',   val: '',                  key: 'reason',         ph: 'What for?' },
                  { label: 'Due Date',       type: 'date',   val: '',                  key: 'due_date',       ph: '' },
                ].map(({ label, type, val, key, ph }) => (
                  <div className="field-group" key={key}>
                    <label className="field-label">{label}</label>
                    <input type={type} className="field-input" placeholder={ph}
                      defaultValue={val} required={key !== 'reason' && key !== 'due_date'}
                      onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <button type="submit" className="auth-btn" disabled={submitting}>
                {submitting ? <span className="spinner" /> : 'Add Loan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;