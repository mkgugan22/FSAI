// ═══════════════════════════════════════
// FSAI – Sidebar
// Share: saves to Netlify Blobs (cross-browser) in production,
//        localStorage in local dev.
// All other features unchanged.
// ═══════════════════════════════════════
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { QUICK_PROMPTS } from '../utils/prompts';
import { saveShare } from './ShareView';
import './Sidebar.css';

// ─────────────────────────────────────────────────────────────────────────────
// ShareModal
// ─────────────────────────────────────────────────────────────────────────────
function ShareModal({ conv, liveMessages, onClose }) {
  const [copied,    setCopied]    = useState(false);
  const [shareUrl,  setShareUrl]  = useState('');
  const [saving,    setSaving]    = useState(true);
  const [saveError, setSaveError] = useState('');

  const shareId = String(conv.id);

  useEffect(() => {
    let cancelled = false;

    async function doSave() {
      setSaving(true);
      setSaveError('');

      const payload = {
        title:    conv.text,
        sharedAt: new Date().toISOString(),
        messages: liveMessages,
      };

      const result = await saveShare(shareId, payload);

      if (cancelled) return;

      if (result.ok) {
        setShareUrl(`${window.location.origin}/share/${shareId}`);
      } else {
        // Remote save failed; we still set a URL because localStorage fallback
        // was attempted, but warn the user it's same-browser only
        setSaveError(
          result.error
            ? `Could not save to server (${result.error}). The link below works only in this browser.`
            : 'Server save failed. The link below works only in this browser.'
        );
        setShareUrl(`${window.location.origin}/share/${shareId}`);
      }

      setSaving(false);
    }

    doSave();
    return () => { cancelled = true; };
  }, [shareId, conv.text, liveMessages]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const previewText = conv.text.length > 80
    ? conv.text.slice(0, 80) + '…'
    : conv.text;

  return (
    <div className="sm-backdrop" onClick={onClose}>
      <div
        className="sm-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Share conversation"
      >
        <div className="sm-header">
          <span className="sm-title">Share Conversation</span>
          <button className="sm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="sm-body">
          {/* Conversation preview */}
          <div className="sm-preview">
            <span className="sm-preview-icon">📝</span>
            <span className="sm-preview-text">{previewText}</span>
          </div>

          {/* Saving state */}
          {saving && (
            <div className="sm-local-notice">
              <span className="sm-local-icon">⏳</span>
              <span className="sm-local-text">Saving conversation…</span>
            </div>
          )}

          {/* Error state — still show link (localStorage fallback) */}
          {!saving && saveError && (
            <div
              className="sm-local-notice"
              style={{
                borderColor: 'rgba(239,68,68,0.3)',
                background:  'rgba(239,68,68,0.06)',
              }}
            >
              <span className="sm-local-icon">⚠</span>
              <span className="sm-local-text">{saveError}</span>
            </div>
          )}

          {/* Success state */}
          {!saving && !saveError && shareUrl && (
            <div className="sm-local-notice">
              <span className="sm-local-icon">🌐</span>
              <span className="sm-local-text">
                This link works on <strong>any browser or device</strong>.
              </span>
            </div>
          )}

          {/* Link row — shown after saving finishes */}
          {!saving && shareUrl && (
            <div className="sm-link-row">
              <input
                className="sm-link-input"
                type="text"
                value={shareUrl}
                readOnly
                onFocus={(e) => e.target.select()}
                aria-label="Share link"
              />
              <button className="sm-copy-btn" onClick={handleCopy}>
                {copied ? '✓ Copied!' : '⎘ Copy link'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ContextMenu
// ─────────────────────────────────────────────────────────────────────────────
function ContextMenu({ conv, anchorEl, onClose, onPin, onShare, onStartRename, onArchive, onDelete }) {
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorEl) return;
    const rect  = anchorEl.getBoundingClientRect();
    const menuH = 200;
    const menuW = 180;
    let top  = rect.bottom + 4;
    let left = rect.left;
    if (top  + menuH > window.innerHeight) top  = rect.top - menuH - 4;
    if (left + menuW > window.innerWidth)  left = window.innerWidth - menuW - 8;
    if (left < 4) left = 4;
    setPos({ top, left });
  }, [anchorEl]);

  useEffect(() => {
    const handleClick = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        anchorEl && !anchorEl.contains(e.target)
      ) onClose();
    };
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    const t = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown',   handleKey);
    }, 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown',   handleKey);
    };
  }, [anchorEl, onClose]);

  return (
    <div className="ctxmenu" ref={menuRef} style={{ top: pos.top, left: pos.left }} role="menu">
      <button className="ctxmenu-item" role="menuitem" onClick={() => { onPin(conv); onClose(); }}>
        <span className="ctxmenu-icon">📌</span>
        <span>{conv.pinned ? 'Unpin' : 'Pin'}</span>
      </button>
      <button className="ctxmenu-item" role="menuitem" onClick={() => { onShare(conv); onClose(); }}>
        <span className="ctxmenu-icon">🔗</span>
        <span>Share</span>
      </button>
      <button className="ctxmenu-item" role="menuitem" onClick={() => { onStartRename(conv); onClose(); }}>
        <span className="ctxmenu-icon">✏️</span>
        <span>Rename</span>
      </button>
      <div className="ctxmenu-divider" />
      <button className="ctxmenu-item" role="menuitem" onClick={() => { onArchive(conv); onClose(); }}>
        <span className="ctxmenu-icon">🗃️</span>
        <span>{conv.archived ? 'Unarchive' : 'Archive'}</span>
      </button>
      <button className="ctxmenu-item ctxmenu-item--danger" role="menuitem" onClick={() => { onDelete(conv); onClose(); }}>
        <span className="ctxmenu-icon">🗑️</span>
        <span>Delete</span>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RecentItem
// ─────────────────────────────────────────────────────────────────────────────
function RecentItem({ conv, onClick, onPin, onShare, onStartRename, onArchive, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const btnRef = useRef(null);

  const truncated = conv.text.length > 42
    ? conv.text.slice(0, 42) + '…'
    : conv.text;

  return (
    <div className={`ri ${conv.pinned ? 'ri--pinned' : ''}`}>
      <button className="ri-btn" onClick={() => onClick(conv)} title={conv.text}>
        {conv.pinned && <span className="ri-pin" title="Pinned">📌</span>}
        <span className="ri-icon">💬</span>
        <span className="ri-text">{truncated}</span>
      </button>

      <button
        ref={btnRef}
        className="ri-more"
        onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
        title="More options"
        aria-label="More options"
        aria-haspopup="true"
        aria-expanded={menuOpen}
      >
        •••
      </button>

      {menuOpen && (
        <ContextMenu
          conv={conv}
          anchorEl={btnRef.current}
          onClose={() => setMenuOpen(false)}
          onPin={onPin}
          onShare={onShare}
          onStartRename={onStartRename}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RenameModal
// ─────────────────────────────────────────────────────────────────────────────
function RenameModal({ conv, onConfirm, onCancel }) {
  const [text, setText] = useState(conv.text);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  const handleConfirm = () => {
    const trimmed = text.trim();
    if (trimmed && trimmed !== conv.text) onConfirm(trimmed);
    else onCancel();
  };

  return (
    <div className="sm-backdrop" onClick={onCancel}>
      <div
        className="sm-modal sm-modal--narrow"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Rename conversation"
      >
        <div className="sm-header">
          <span className="sm-title">Rename Conversation</span>
          <button className="sm-close" onClick={onCancel} aria-label="Close">✕</button>
        </div>
        <div className="sm-body">
          <label className="rename-label">New name</label>
          <input
            ref={inputRef}
            className="rename-modal-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter')  { e.preventDefault(); handleConfirm(); }
              if (e.key === 'Escape') onCancel();
            }}
            maxLength={120}
            placeholder="Enter a name…"
          />
          <div className="rename-actions">
            <button className="rename-cancel"  onClick={onCancel}>Cancel</button>
            <button className="rename-confirm" onClick={handleConfirm}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Sidebar
// ─────────────────────────────────────────────────────────────────────────────
export default function Sidebar({
  onQuickPrompt,
  isCollapsed,
  onToggle,
  isMobileOpen        = false,
  onMobileClose       = () => {},
  conversationHistory = [],
  onLoadConversation  = () => {},
  onClearHistory      = () => {},
  onUpdateHistory     = () => {},
  liveMessages        = [],
}) {
  const [openCategory,     setOpenCategory]     = useState('Common Errors');
  const [shareTarget,      setShareTarget]      = useState(null);
  const [renameTarget,     setRenameTarget]     = useState(null);
  const [showArchived,     setShowArchived]     = useState(false);
  const [pinnedCollapsed,  setPinnedCollapsed]  = useState(false);
  const [recentsCollapsed, setRecentsCollapsed] = useState(false);

  const mobileClass    = isMobileOpen ? 'mobile-open' : '';
  const collapsedClass = isCollapsed  ? 'collapsed'   : '';

  const pinned   = conversationHistory.filter(c => c.pinned   && !c.archived);
  const recents  = conversationHistory.filter(c => !c.pinned  && !c.archived);
  const archived = conversationHistory.filter(c => c.archived);

  const handlePin = useCallback((conv) => {
    onUpdateHistory(conversationHistory.map(c =>
      c.id === conv.id ? { ...c, pinned: !c.pinned } : c
    ));
  }, [conversationHistory, onUpdateHistory]);

  const handleRenameConfirm = useCallback((newText) => {
    if (!renameTarget) return;
    onUpdateHistory(conversationHistory.map(c =>
      c.id === renameTarget.id ? { ...c, text: newText } : c
    ));
    setRenameTarget(null);
  }, [renameTarget, conversationHistory, onUpdateHistory]);

  const handleArchive = useCallback((conv) => {
    onUpdateHistory(conversationHistory.map(c =>
      c.id === conv.id ? { ...c, archived: !c.archived, pinned: false } : c
    ));
  }, [conversationHistory, onUpdateHistory]);

  const handleDelete = useCallback((conv) => {
    onUpdateHistory(conversationHistory.filter(c => c.id !== conv.id));
  }, [conversationHistory, onUpdateHistory]);

  const handleItemClick = useCallback((conv) => {
    onLoadConversation(conv.text);
    onMobileClose();
  }, [onLoadConversation, onMobileClose]);

  const itemActions = {
    onClick:       handleItemClick,
    onPin:         handlePin,
    onShare:       setShareTarget,
    onStartRename: setRenameTarget,
    onArchive:     handleArchive,
    onDelete:      handleDelete,
  };

  return (
    <>
      <aside className={`sidebar ${collapsedClass} ${mobileClass}`}>
        <button className="sidebar-toggle" onClick={onToggle} title="Toggle sidebar">
          {isCollapsed ? '▶' : '◀'}
        </button>

        <div className="sidebar-mobile-close">
          <span className="sidebar-mobile-close-label">Menu</span>
          <button className="sidebar-mobile-close-btn" onClick={onMobileClose} aria-label="Close sidebar">
            ✕
          </button>
        </div>

        {!isCollapsed && (
          <div className="sidebar-content">

            {/* ── PINNED ── */}
            {pinned.length > 0 && (
              <div className="recents-section">
                <div className="recents-header">
                  <button
                    className="recents-title-toggle"
                    onClick={() => setPinnedCollapsed(v => !v)}
                    aria-label={pinnedCollapsed ? 'Expand pinned' : 'Collapse pinned'}
                  >
                    <span>📌 Pinned</span>
                    <span className="recents-chevron">{pinnedCollapsed ? '▸' : '▾'}</span>
                  </button>
                </div>
                {!pinnedCollapsed && (
                  <div className="recents-list">
                    {pinned.map(conv => <RecentItem key={conv.id} conv={conv} {...itemActions} />)}
                  </div>
                )}
              </div>
            )}

            {/* ── RECENTS ── */}
            {recents.length > 0 && (
              <div className="recents-section">
                <div className="recents-header">
                  <button
                    className="recents-title-toggle"
                    onClick={() => setRecentsCollapsed(v => !v)}
                    aria-label={recentsCollapsed ? 'Expand recents' : 'Collapse recents'}
                  >
                    <span>Recents</span>
                    <span className="recents-chevron">{recentsCollapsed ? '▸' : '▾'}</span>
                  </button>
                </div>
                {!recentsCollapsed && (
                  <div className="recents-list">
                    {recents.map(conv => <RecentItem key={conv.id} conv={conv} {...itemActions} />)}
                  </div>
                )}
              </div>
            )}

            {/* ── ARCHIVED ── */}
            {archived.length > 0 && (
              <div className="recents-section">
                <div className="recents-header">
                  <button className="recents-title-toggle" onClick={() => setShowArchived(v => !v)}>
                    🗃️ Archived ({archived.length})
                    <span className="recents-chevron">{showArchived ? '▾' : '▸'}</span>
                  </button>
                </div>
                {showArchived && (
                  <div className="recents-list">
                    {archived.map(conv => <RecentItem key={conv.id} conv={conv} {...itemActions} />)}
                  </div>
                )}
              </div>
            )}

            {/* ── QUICK PROMPTS ── */}
            <div className="sidebar-header">
              <span className="sidebar-title">QUICK PROMPTS</span>
              <span className="sidebar-count">
                {QUICK_PROMPTS.reduce((a, c) => a + c.items.length, 0)}
              </span>
            </div>

            <div className="sidebar-body">
              {QUICK_PROMPTS.map(group => (
                <div key={group.category} className="prompt-group">
                  <button
                    className={`group-header ${openCategory === group.category ? 'open' : ''}`}
                    onClick={() => setOpenCategory(o => o === group.category ? null : group.category)}
                  >
                    <span className="group-icon">{group.icon}</span>
                    <span className="group-label">{group.category}</span>
                    <span className="group-chevron">{openCategory === group.category ? '▾' : '▸'}</span>
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

            {/* ── STACK COVERAGE ── */}
            <div className="sidebar-footer">
              <div className="coverage-title">STACK COVERAGE</div>
              <div className="coverage-grid">
                {[
                  '.NET','Node.js','Python','PHP','Java','Go',
                  'React','Next.js','Vue','Angular',
                  'PostgreSQL','MongoDB','Redis','MySQL',
                ].map(t => <span key={t} className="coverage-tag">{t}</span>)}
              </div>
            </div>

          </div>
        )}
      </aside>

      {shareTarget && (
        <ShareModal
          conv={shareTarget}
          liveMessages={liveMessages}
          onClose={() => setShareTarget(null)}
        />
      )}

      {renameTarget && (
        <RenameModal
          conv={renameTarget}
          onConfirm={handleRenameConfirm}
          onCancel={() => setRenameTarget(null)}
        />
      )}
    </>
  );
}
