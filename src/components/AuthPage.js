// ═══════════════════════════════════════
// FSAI – AuthPage (Login + Signup)
// ═══════════════════════════════════════
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { key: 'uppercase', label: 'One uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { key: 'lowercase', label: 'One lowercase letter', test: (value) => /[a-z]/.test(value) },
  { key: 'number', label: 'At least one number', test: (value) => /[0-9]/.test(value) },
  { key: 'special', label: 'At least one special character', test: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value) },
];

function validateEmail(value) {
  if (!value.trim()) return 'Please enter your email address.';
  if (!EMAIL_REGEX.test(value.trim())) return 'Please enter a valid email address.';
  return '';
}

function validatePassword(value, mode) {
  if (!value) return 'Please enter your password.';
  if (mode === 'signup') {
    const failed = PASSWORD_RULES.find(rule => !rule.test(value));
    if (failed) return `Password must include: ${failed.label.toLowerCase()}.`;
  }
  return '';
}

function validateConfirm(password, confirm) {
  if (!confirm) return 'Please confirm your password.';
  if (password !== confirm) return 'Passwords do not match.';
  return '';
}

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    setError('');

    setFormErrors((prev) => ({
      ...prev,
      [field]:
        field === 'email'
          ? validateEmail(value)
          : field === 'password'
          ? validatePassword(value, mode)
          : field === 'confirm'
          ? validateConfirm(form.password, value)
          : field === 'name'
          ? value.trim()
            ? ''
            : 'Please enter your full name.'
          : prev[field],
    }));

    if (field === 'password' && mode === 'signup') {
      setFormErrors((prev) => ({
        ...prev,
        confirm: validateConfirm(value, form.confirm),
      }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const errors = {
      ...(mode === 'signup' ? { name: form.name.trim() ? '' : 'Please enter your full name.' } : {}),
      email: validateEmail(form.email),
      password: validatePassword(form.password, mode),
      ...(mode === 'signup' ? { confirm: validateConfirm(form.password, form.confirm) } : {}),
    };

    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors) {
      setFormErrors(errors);
      setError(Object.values(errors).find(Boolean));
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        await signup({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      } else {
        await login({ email: form.email.trim(), password: form.password });
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
    setFormErrors({});
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
              className={`auth-input ${formErrors.email ? 'invalid' : ''}`}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handle('email')}
              autoComplete="email"
              autoFocus={mode === 'login'}
            />
            {formErrors.email && <div className="auth-field-note error-note">{formErrors.email}</div>}
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className={`auth-input ${formErrors.password ? 'invalid' : ''}`}
              type="password"
              placeholder={mode === 'signup' ? 'Strong password required' : 'Enter password'}
              value={form.password}
              onChange={handle('password')}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            {mode === 'signup' && (
              <div className="auth-validation-list">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(form.password);
                  return (
                    <div
                      key={rule.key}
                      className={`auth-validation-item ${passed ? 'valid' : 'invalid'}`}
                    >
                      <span className="auth-validation-icon">{passed ? '✔' : '•'}</span>
                      {rule.label}
                    </div>
                  );
                })}
              </div>
            )}
            {!formErrors.password && mode === 'login' && form.password && (
              <div className="auth-field-note">Password will be validated securely.</div>
            )}
            {formErrors.password && <div className="auth-field-note error-note">{formErrors.password}</div>}
          </div>

          {mode === 'signup' && (
            <div className="auth-field">
              <label className="auth-label">Confirm Password</label>
              <input
                className={`auth-input ${formErrors.confirm ? 'invalid' : ''}`}
                type="password"
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={handle('confirm')}
                autoComplete="new-password"
              />
              {formErrors.confirm && <div className="auth-field-note error-note">{formErrors.confirm}</div>}
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