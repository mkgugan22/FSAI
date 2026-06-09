// ═══════════════════════════════════════
// FSAI – ShareView
// Cross-browser share via JSONBin.io (free).
// Accessible at /share/:shareId — no auth required.
//
// Local dev  → localStorage (same-browser convenience)
// Production → JSONBin.io via /api/share-save & /api/share-load
// ═══════════════════════════════════════
import React, { useEffect, useState } from 'react';
import AgentResponse from './AgentResponse';
import './ShareView.css';

// ── Environment ───────────────────────────────────────────────
const IS_LOCAL =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1');

// ── Remote helpers ────────────────────────────────────────────

/**
 * Save to JSONBin via Netlify function.
 * Returns { ok: true } or { ok: false, error: string }
 */
export async function saveShareRemote(shareId, payload) {
  try {
    const res = await fetch('/api/share-save', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ shareId, payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || `Server error ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Load from JSONBin via Netlify function.
 * Returns payload object or null.
 */
export async function loadShareRemote(shareId) {
  try {
    const res = await fetch(`/api/share-load?id=${encodeURIComponent(shareId)}`);
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = await res.json();
    return data.payload ?? null;
  } catch {
    return null;
  }
}

// ── localStorage helpers (local dev only) ─────────────────────
export function saveSharedConversation(shareId, payload) {
  try { localStorage.setItem(`fsai_share_${shareId}`, JSON.stringify(payload)); } catch {}
}

export function loadSharedConversation(shareId) {
  try {
    const raw = localStorage.getItem(`fsai_share_${shareId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/**
 * Unified save — called by Sidebar's ShareModal.
 * Returns { ok, isLocal, error? }
 */
export async function saveShare(shareId, payload) {
  if (IS_LOCAL) {
    saveSharedConversation(shareId, payload);
    return { ok: true, isLocal: true };
  }
  const result = await saveShareRemote(shareId, payload);
  if (!result.ok) {
    // Fallback to localStorage so the modal still gives a URL
    saveSharedConversation(shareId, payload);
    return { ok: false, isLocal: true, error: result.error };
  }
  return { ok: true, isLocal: false };
}

// ── Formatters ────────────────────────────────────────────────
function formatTime(id) {
  try { return new Date(id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString([], {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
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
    if (!shareId) { setStatus('not-found'); return; }

    let cancelled = false;

    async function load() {
      // 1. Try server (JSONBin) — works on any browser / device
      if (!IS_LOCAL) {
        const remote = await loadShareRemote(shareId);
        if (cancelled) return;
        if (remote) { setData(remote); setStatus('found'); return; }
      }

      // 2. Fallback: localStorage (local dev, or same-browser emergency fallback)
      const local = loadSharedConversation(shareId);
      if (cancelled) return;
      if (local) { setData(local); setStatus('found'); return; }

      if (!cancelled) setStatus('not-found');
    }

    load();
    return () => { cancelled = true; };
  }, [shareId]);

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
          <a href="/" className="sv-home-btn">← Sign in to FSAI</a>
        </div>
      </div>
    );
  }

  const { title, sharedAt, messages = [] } = data;

  return (
    <div className="sv-root">
      <div className="sv-header">
        <div className="sv-header-logo">
          <div className="sv-logo-orb">⬡</div>
          <div className="sv-logo-text">
            <span className="sv-logo-title">FSAI</span>
            <span className="sv-logo-sub">Shared Conversation</span>
          </div>
        </div>
        <a href="/" className="sv-open-btn">Sign in to FSAI →</a>
      </div>

      <div className="sv-meta-bar">
        <div className="sv-meta-inner">
          <span className="sv-meta-label">📝 {title}</span>
          <span className="sv-meta-date">Shared {formatDate(sharedAt)}</span>
        </div>
      </div>

      <div className="sv-body">
        <div className="sv-messages">
          {messages
            .filter(m => m.role === 'user' || m.role === 'agent')
            .map(msg => <SharedMessage key={msg.id} message={msg} />)}
          {messages.length === 0 && (
            <p className="sv-empty">No messages in this conversation.</p>
          )}
        </div>
      </div>

      <div className="sv-footer">
        <span>Powered by FSAI · Full-Stack Debug Agent</span>
        <a href="/" className="sv-footer-link">← Sign in to FSAI</a>
      </div>
    </div>
  );
}
