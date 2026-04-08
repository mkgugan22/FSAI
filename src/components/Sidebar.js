// ═══════════════════════════════════════
// FSAI – Sidebar
// ═══════════════════════════════════════
import React, { useState } from 'react';
import { QUICK_PROMPTS } from '../utils/prompts';
import './Sidebar.css';

export default function Sidebar({
  onQuickPrompt,
  isCollapsed,
  onToggle,
  isMobileOpen = false,
  onMobileClose = () => {},
  conversationHistory = [],
  onLoadConversation = () => {},
  onClearHistory = () => {},
}) {
  const [openCategory, setOpenCategory] = useState('Common Errors');

  const truncateText = (text, length = 50) =>
    text.length > length ? text.substring(0, length) + '…' : text;

  const mobileClass   = isMobileOpen  ? 'mobile-open' : '';
  const collapsedClass = isCollapsed  ? 'collapsed'   : '';

  return (
    <aside className={`sidebar ${collapsedClass} ${mobileClass}`}>

      {/* ── Desktop collapse toggle ── */}
      <button className="sidebar-toggle" onClick={onToggle} title="Toggle sidebar">
        <span>{isCollapsed ? '▶' : '◀'}</span>
      </button>

      {/* ── Mobile top bar (label + close) ── */}
      <div className="sidebar-mobile-close">
        <span className="sidebar-mobile-close-label">Menu</span>
        <button
          className="sidebar-mobile-close-btn"
          onClick={onMobileClose}
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      {!isCollapsed && (
        <div className="sidebar-content">

          {/* ── RECENTS ── */}
          {conversationHistory.length > 0 && (
            <div className="recents-section">
              <div className="recents-header">
                <span className="recents-title">RECENTS</span>
                <button
                  className="recents-clear"
                  onClick={onClearHistory}
                  title="Clear history"
                >
                  ✕
                </button>
              </div>
              <div className="recents-list">
                {conversationHistory.map(conv => (
                  <button
                    key={conv.id}
                    className="recent-item"
                    onClick={() => { onLoadConversation(conv.text); onMobileClose(); }}
                    title={conv.text}
                  >
                    <span className="recent-icon">📝</span>
                    <span className="recent-text">{truncateText(conv.text, 45)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Quick Prompts header ── */}
          <div className="sidebar-header">
            <span className="sidebar-title">QUICK PROMPTS</span>
            <span className="sidebar-count">
              {QUICK_PROMPTS.reduce((a, c) => a + c.items.length, 0)}
            </span>
          </div>

          {/* ── Prompt groups ── */}
          <div className="sidebar-body">
            {QUICK_PROMPTS.map(group => (
              <div key={group.category} className="prompt-group">
                <button
                  className={`group-header ${openCategory === group.category ? 'open' : ''}`}
                  onClick={() =>
                    setOpenCategory(openCategory === group.category ? null : group.category)
                  }
                >
                  <span className="group-icon">{group.icon}</span>
                  <span className="group-label">{group.category}</span>
                  <span className="group-chevron">
                    {openCategory === group.category ? '▾' : '▸'}
                  </span>
                </button>

                {openCategory === group.category && (
                  <div className="group-items">
                    {group.items.map(item => (
                      <button
                        key={item.label}
                        className="prompt-btn"
                        onClick={() => { onQuickPrompt(item.text); onMobileClose(); }}
                        title={item.text}
                      >
                        <span className="prompt-icon">{item.icon}</span>
                        <span className="prompt-label">{item.label}</span>
                        <span className="prompt-arrow">→</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Stack coverage footer ── */}
          <div className="sidebar-footer">
            <div className="coverage-title">STACK COVERAGE</div>
            <div className="coverage-grid">
              {[
                '.NET', 'Node.js', 'Python', 'PHP', 'Java', 'Go',
                'React', 'Next.js', 'Vue', 'Angular',
                'PostgreSQL', 'MongoDB', 'Redis', 'MySQL',
              ].map(t => (
                <span key={t} className="coverage-tag">{t}</span>
              ))}
            </div>
          </div>

        </div>
      )}
    </aside>
  );
}