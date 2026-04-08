// ═══════════════════════════════════════
// FSAI – AuthPage (Login + Signup)
// ═══════════════════════════════════════
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!form.name.trim()) throw new Error('Please enter your name.');
        if (!form.email.trim()) throw new Error('Please enter your email.');
        if (form.password.length < 6) throw new Error('Password must be at least 6 characters.');
        if (form.password !== form.confirm) throw new Error('Passwords do not match.');
        await signup({ name: form.name, email: form.email, password: form.password });
      } else {
        if (!form.email.trim()) throw new Error('Please enter your email.');
        if (!form.password) throw new Error('Please enter your password.');
        await login({ email: form.email, password: form.password });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setForm({ name: '', email: '', password: '', confirm: '' });
    setError('');
  };

  return (
    <div className="auth-root">
      {/* Animated background elements */}
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
        <div className="auth-grid" />
      </div>

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-orb">
            <span className="auth-logo-icon">⬡</span>
          </div>
          <div className="auth-logo-text">
            <span className="auth-logo-title">FSAI</span>
            <span className="auth-logo-sub">Full-Stack Debug Agent</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => mode !== 'login' && switchMode()}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => mode !== 'signup' && switchMode()}
            type="button"
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={submit} noValidate>
          {mode === 'signup' && (
            <div className="auth-field">
              <label className="auth-label">Full Name</label>
              <input
                className="auth-input"
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={handle('name')}
                autoComplete="name"
                autoFocus={mode === 'signup'}
              />
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">Email Address</label>
            <input
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handle('email')}
              autoComplete="email"
              autoFocus={mode === 'login'}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter password'}
              value={form.password}
              onChange={handle('password')}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {mode === 'signup' && (
            <div className="auth-field">
              <label className="auth-label">Confirm Password</label>
              <input
                className="auth-input"
                type="password"
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={handle('confirm')}
                autoComplete="new-password"
              />
            </div>
          )}

          {error && (
            <div className="auth-error">
              <span className="auth-error-icon">⚠</span>
              {error}
            </div>
          )}

          <button
            className={`auth-submit ${loading ? 'loading' : ''}`}
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span className="auth-spinner" />
            ) : (
              <span>{mode === 'login' ? 'Sign In →' : 'Create Account →'}</span>
            )}
          </button>
        </form>

        {/* Footer switch */}
        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          {' '}
          <button className="auth-switch-btn" onClick={switchMode} type="button">
            {mode === 'login' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>

        <p className="auth-disclaimer">
            Authrozied to G7
        </p>
      </div>
    </div>
  );
}