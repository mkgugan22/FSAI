// ═══════════════════════════════════════
// FSAI – ShareView
// Renders a shared conversation.
//
// Storage strategy:
//   Production (Netlify) → Netlify Blobs via /api/share-save & /api/share-load
//   Local dev            → localStorage (same-browser only, dev convenience)
//
// Share URLs are always short: /share/<shareId>
// The full conversation lives in Netlify Blobs server-side.
// ═══════════════════════════════════════
import React, { useEffect, useState } from 'react';
import AgentResponse from './AgentResponse';
import './ShareView.css';

// ── Environment detection ─────────────────────────────────────
const IS_LOCAL =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1');

// ── Remote API helpers ────────────────────────────────────────

/**
 * Save conversation to Netlify Blobs via serverless function.
 * Returns { ok: true } on success, { ok: false, error } on failure.
 */
export async function saveShareRemote(shareId, payload) {
  try {
    const res = await fetch('/api/share-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareId, payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[ShareView] save-remote failed:', res.status, data);
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error('[ShareView] save-remote error:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Load conversation from Netlify Blobs.
 * Returns the payload object, or null if not found / error.
 */
export async function loadShareRemote(shareId) {
  try {
    const res = await fetch(`/api/share-load?id=${encodeURIComponent(shareId)}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      console.error('[ShareView] load-remote failed:', res.status);
      return null;
    }
    const data = await res.json();
    return data.payload ?? null;
  } catch (err) {
    console.error('[ShareView] load-remote error:', err.message);
    return null;
  }
}

// ── localStorage helpers (local dev only) ─────────────────────

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
 * Unified save used by Sidebar's ShareModal.
 *
 * - Production: saves to Netlify Blobs (cross-browser accessible)
 * - Local dev:  saves to localStorage (same-browser convenience)
 *
 * Returns { ok: boolean, isLocal: boolean, error?: string }
 */
export async function saveShare(shareId, payload) {
  if (IS_LOCAL) {
    // Local dev — use localStorage so sharing works within the same browser
    saveSharedConversation(shareId, payload);
    return { ok: true, isLocal: true };
  }

  // Production — save to Netlify Blobs
  const result = await saveShareRemote(shareId, payload);
  if (!result.ok) {
    console.warn('[ShareView] Remote save failed, falling back to localStorage:', result.error);
    // Fallback so the modal doesn't silently error; only helps same-browser
    saveSharedConversation(shareId, payload);
    return { ok: false, isLocal: true, error: result.error };
  }
  return { ok: true, isLocal: false };
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
  const [status, setStatus] = useState('loading'); // loading | found | not-found

  useEffect(() => {
    if (!shareId) {
      setStatus('not-found');
      return;
    }

    let cancelled = false;

    async function load() {
      // 1. Try Netlify Blobs first (works cross-browser in production)
      if (!IS_LOCAL) {
        const remote = await loadShareRemote(shareId);
        if (cancelled) return;
        if (remote) {
          setData(remote);
          setStatus('found');
          return;
        }
      }

      // 2. Try localStorage (local dev, or same-browser fallback)
      const local = loadSharedConversation(shareId);
      if (cancelled) return;
      if (local) {
        setData(local);
        setStatus('found');
        return;
      }

      if (!cancelled) setStatus('not-found');
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

      {/* Meta */}
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
