// ═══════════════════════════════════════
// FSAI – ShareView
// Renders a shared conversation from localStorage.
// Accessible at /share/:shareId
// ═══════════════════════════════════════
import React, { useEffect, useState } from 'react';
import AgentResponse from './AgentResponse';
import './ShareView.css';

// ── Storage helpers ───────────────────────────────────────────
export function saveSharedConversation(shareId, payload) {
  try {
    localStorage.setItem(`fsai_share_${shareId}`, JSON.stringify(payload));
  } catch {}
}

export function loadSharedConversation(shareId) {
  try {
    const raw = localStorage.getItem(`fsai_share_${shareId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── Time formatter ────────────────────────────────────────────
function formatTime(id) {
  try {
    return new Date(id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString([], {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '';
  }
}

// ── Shared Message Bubble ─────────────────────────────────────
function SharedMessage({ message }) {
  if (message.role === 'user') {
    return (
      <div className="sv-msg sv-msg-user">
        <div className="sv-msg-meta sv-msg-meta-user">
          <span className="sv-time">{formatTime(message.id)}</span>
          <span className="sv-role sv-role-user">YOU</span>
        </div>
        <div className="sv-bubble sv-bubble-user">
          <pre className="sv-user-text">{message.content}</pre>
        </div>
        <div className="sv-avatar sv-avatar-user">👤</div>
      </div>
    );
  }

  if (message.role === 'agent') {
    return (
      <div className="sv-msg sv-msg-agent">
        <div className="sv-avatar sv-avatar-agent">⬡</div>
        <div className="sv-agent-content">
          <div className="sv-msg-meta sv-msg-meta-agent">
            <span className="sv-role sv-role-agent">FSAI</span>
            <span className="sv-time">{formatTime(message.id)}</span>
          </div>
          <AgentResponse parsed={message.parsed} raw={message.raw} />
        </div>
      </div>
    );
  }

  return null;
}

// ── Main Component ────────────────────────────────────────────
export default function ShareView({ shareId }) {
  const [data, setData]   = useState(null);
  const [status, setStatus] = useState('loading'); // loading | found | not-found

  useEffect(() => {
    if (!shareId) {
      setStatus('not-found');
      return;
    }
    const payload = loadSharedConversation(shareId);
    if (payload) {
      setData(payload);
      setStatus('found');
    } else {
      setStatus('not-found');
    }
  }, [shareId]);

  // ── Loading ──
  if (status === 'loading') {
    return (
      <div className="sv-root">
        <div className="sv-center">
          <div className="sv-spinner" />
          <p className="sv-hint">Loading conversation…</p>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (status === 'not-found') {
    return (
      <div className="sv-root">
        <div className="sv-center">
          <div className="sv-not-found-orb">⬡</div>
          <h2 className="sv-not-found-title">Conversation not found</h2>
          <p className="sv-not-found-desc">
            This shared link is only accessible in the browser where it was created.<br />
            Ask the person who shared it to open the link on their device and share the screen,
            or use the same browser to view it.
          </p>
          <a href="/" className="sv-home-btn">← Open FSAI</a>
        </div>
      </div>
    );
  }

  // ── Found ──
  const { title, sharedAt, messages = [] } = data;

  return (
    <div className="sv-root">
      {/* Header */}
      <div className="sv-header">
        <div className="sv-header-logo">
          <div className="sv-logo-orb">⬡</div>
          <div className="sv-logo-text">
            <span className="sv-logo-title">FSAI</span>
            <span className="sv-logo-sub">Shared Conversation</span>
          </div>
        </div>
        <a href="/" className="sv-open-btn">Open FSAI →</a>
      </div>

      {/* Conversation meta */}
      <div className="sv-meta-bar">
        <div className="sv-meta-inner">
          <span className="sv-meta-label">📝 {title}</span>
          <span className="sv-meta-date">Shared {formatDate(sharedAt)}</span>
        </div>
      </div>

      {/* Notice */}
      <div className="sv-notice-bar">
        <div className="sv-notice-inner">
          <span className="sv-notice-icon">ℹ</span>
          <span className="sv-notice-text">
            Shared conversations are stored locally — this link works in the browser where it was created.
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="sv-body">
        <div className="sv-messages">
          {messages.filter(m => m.role === 'user' || m.role === 'agent').map(msg => (
            <SharedMessage key={msg.id} message={msg} />
          ))}
          {messages.length === 0 && (
            <p className="sv-empty">No messages in this conversation.</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="sv-footer">
        <span>Powered by FSAI · Full-Stack Debug Agent</span>
      </div>
    </div>
  );
}
