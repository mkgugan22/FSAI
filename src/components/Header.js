// ═══════════════════════════════════════
// FSAI – Header
// ═══════════════════════════════════════
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import './Header.css';

const STACK_LABELS = [
  { label: 'BACKEND',  color: '#a78bfa', bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.35)' },
  { label: 'FRONTEND', color: '#00d2ff', bg: 'rgba(0,210,255,0.1)',   border: 'rgba(0,210,255,0.3)' },
  { label: 'DATABASE', color: '#fb923c', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.3)' },
];

export default function Header({ messageCount, onClear, onMenuToggle }) {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header className="header">
      {/* Left – Mobile menu + Logo */}
      <div className="header-logo">
        {/* Mobile hamburger */}
        <button
          className="mobile-menu-btn"
          onClick={onMenuToggle}
          title="Open sidebar"
          aria-label="Open sidebar"
        >
          ☰
        </button>

        <div className="logo-orb">
          <span className="logo-icon">⬡</span>
        </div>
        <div className="logo-text">
          <span className="logo-title">FSAI</span>
          <span className="logo-sub">Full-Stack Debug Agent · v1.0</span>
        </div>
      </div>

      {/* Center – Stack badges */}
      <div className="header-center">
        {STACK_LABELS.map(s => (
          <span
            key={s.label}
            className="stack-badge"
            style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
          >
            {s.label}
          </span>
        ))}
      </div>

      {/* Right – Status */}
      <div className="header-right">
        {messageCount > 0 && (
          <button className="clear-btn" onClick={onClear} title="Clear conversation">
            <span>⌫</span> Clear
          </button>
        )}

        {/* Theme Toggle */}
        <button
          className="theme-btn"
          onClick={toggleTheme}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          <span>{isDarkMode ? '☀️' : '🌙'}</span>
        </button>

        <div className="status-pill">
          <span className="status-dot" />
          ONLINE
        </div>
        <div className="model-tag">G7</div>
      </div>
    </header>
  );
}