// ═══════════════════════════════════════
// FSAI – ShareView
// Renders a shared conversation.
//
// Production (Netlify): conversations are saved server-side via
//   POST /api/share-save  →  Netlify Blobs
//   GET  /api/share-load  →  Netlify Blobs
// URLs stay short:  /share/<shareId>   (no data in URL)
//
// Local dev (no Netlify Blobs): falls back to localStorage so
//   sharing still works within the same browser session.
//
// Accessible at /share/:shareId
// ═══════════════════════════════════════
import React, { useEffect, useState } from 'react';
import AgentResponse from './AgentResponse';
import './ShareView.css';

// ── Environment detection ─────────────────────────────────────
const IS_LOCAL =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

// ── API helpers ───────────────────────────────────────────────

/**
 * Save a conversation server-side via Netlify Function.
 * Returns true on success, false on failure.
 */
export async function saveShareRemote(shareId, payload) {
  try {
    const res = await fetch('/api/share-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareId, payload }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Load a conversation from the server.
 * Returns the payload object, or null if not found / error.
 */
export async function loadShareRemote(shareId) {
  try {
    const res = await fetch(`/api/share-load?id=${encodeURIComponent(shareId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.payload ?? null;
  } catch {
    return null;
  }
}

// ── localStorage helpers (local dev fallback) ─────────────────

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

/**
 * Unified save: uses API in production, localStorage in local dev.
 * Returns { ok: boolean, fallback: boolean }
 */
export async function saveShare(shareId, payload) {
  if (IS_LOCAL) {
    saveSharedConversation(shareId, payload);
    return { ok: true, fallback: true };
  }
  const ok = await saveShareRemote(shareId, payload);
  if (!ok) {
    saveSharedConversation(shareId, payload);
    return { ok: false, fallback: true };
  }
  return { ok: true, fallback: false };
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
  const [data,   setData]   = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!shareId) {
      setStatus('not-found');
      return;
    }

    let cancelled = false;

    async function load() {
      // 1. Try server API first (works on Netlify, fails gracefully on localhost)
      if (!IS_LOCAL) {
        const remote = await loadShareRemote(shareId);
        if (cancelled) return;
        if (remote) {
          setData(remote);
          setStatus('found');
          return;
        }
      }

      // 2. Try localStorage (local dev, or same-browser legacy links)
      const local = loadSharedConversation(shareId);
      if (cancelled) return;
      if (local) {
        setData(local);
        setStatus('found');
        return;
      }

      setStatus('not-found');
    }

    load();
    return () => { cancelled = true; };
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
            This share link may have expired or been removed.<br />
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
          <span className="sv-notice-icon">🌐</span>
          <span className="sv-notice-text">
            This conversation is accessible on any browser or device.
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="sv-body">
        <div className="sv-messages">
          {messages
            .filter(m => m.role === 'user' || m.role === 'agent')
            .map(msg => (
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
