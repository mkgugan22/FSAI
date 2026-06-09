// ═══════════════════════════════════════
// FSAI – ShareView
// Renders a shared conversation from URL hash (base64-encoded).
// Works across any browser / device — no localStorage dependency.
// Accessible at /share/:shareId
// ═══════════════════════════════════════
import React, { useEffect, useState } from 'react';
import AgentResponse from './AgentResponse';
import './ShareView.css';

// ── Encode / Decode helpers ───────────────────────────────────
// We store the full conversation payload in the URL hash as base64.
// Format: /share/<shareId>#<base64-encoded-JSON>
// The shareId in the path is kept for display/aesthetics only.

export function encodeSharePayload(payload) {
  try {
    const json = JSON.stringify(payload);
    // btoa needs ASCII — encode as UTF-8 first
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    bytes.forEach(b => (binary += String.fromCharCode(b)));
    return btoa(binary);
  } catch {
    return null;
  }
}

export function decodeSharePayload(hash) {
  try {
    const base64 = hash.startsWith('#') ? hash.slice(1) : hash;
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Build the full shareable URL that embeds the conversation data
export function buildShareUrl(shareId, payload) {
  const encoded = encodeSharePayload(payload);
  if (!encoded) return null;
  return `${window.location.origin}/share/${shareId}#${encoded}`;
}

// ── Legacy localStorage helpers (kept for backward compat) ───
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

// ── Time formatters ───────────────────────────────────────────
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
  const [data, setData]     = useState(null);
  const [status, setStatus] = useState('loading'); // loading | found | not-found

  useEffect(() => {
    if (!shareId) {
      setStatus('not-found');
      return;
    }

    // 1. Try URL hash first (works across all browsers/devices)
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      const payload = decodeSharePayload(hash);
      if (payload) {
        setData(payload);
        setStatus('found');
        return;
      }
    }

    // 2. Fallback: try localStorage (for links shared from the same browser)
    const legacy = loadSharedConversation(shareId);
    if (legacy) {
      setData(legacy);
      setStatus('found');
      return;
    }

    setStatus('not-found');
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
            This share link may have expired or been truncated.<br />
            Ask the person who shared it to generate a new link.
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
            This conversation is embedded in the link — it can be viewed on any device or browser.
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
