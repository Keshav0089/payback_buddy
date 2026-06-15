import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';
import './Auth.css';

const API = 'http://localhost:8080/payback/backend/api';

function Login() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError]     = useState('');

  // ── Email / password login ──
  const submitHandler = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/login.php`, form, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.data.success) {
        sessionStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/dashboard');
      } else {
        setError(res.data.message || 'Invalid credentials.');
      }
    } catch {
      setError('Unable to reach server. Is XAMPP running?');
    } finally {
      setLoading(false);
    }
  };

  // ── Google login ──
  const googleLogin = async () => {
    setError('');
    setGLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const { displayName, email, uid } = result.user;

      // Send Google user info to our backend — it will auto register if new
      const res = await axios.post(`${API}/googleAuth.php`, {
        name:  displayName,
        email: email,
        uid:   uid,
      });

      if (res.data.success) {
        sessionStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/dashboard');
      } else {
        setError(res.data.message || 'Google login failed.');
      }
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in was cancelled.');
      } else {
        setError('Google sign-in failed. Check Firebase config.');
        console.error(err);
      }
    } finally {
      setGLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="grid-lines" />

      <div className="auth-container">
        <Link to="/" className="auth-back">← Back</Link>

        <div className="auth-card">
          <div className="auth-icon">₹</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in to your PayBack account</p>

          {error && <div className="auth-error">{error}</div>}

          {/* Google button */}
          <button
            type="button"
            className="google-btn"
            onClick={googleLogin}
            disabled={gLoading || loading}
          >
            {gLoading ? (
              <span className="spinner spinner-dark" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="divider"><span>or sign in with email</span></div>

          <form onSubmit={submitHandler} className="auth-form">
            <div className="field-group">
              <label className="field-label">Email</label>
              <input
                type="email" placeholder="you@example.com" className="field-input" required
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Password</label>
              <input
                type="password" placeholder="••••••••" className="field-input" required
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading || gLoading}>
              {loading ? <span className="spinner" /> : 'Sign In'}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/register" className="auth-link">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;