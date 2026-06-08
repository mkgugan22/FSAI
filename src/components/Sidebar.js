// ═══════════════════════════════════════
// FSAI – Sidebar
// Supports: Pin, Share, Rename, Archive, Delete
// ═══════════════════════════════════════
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { QUICK_PROMPTS } from '../utils/prompts';
import './Sidebar.css';

// ── Share Modal ───────────────────────────────────────────────────────────────
function ShareModal({ conv, onClose }) {
  const [copied, setCopied] = useState(false);
  // Generate a deterministic shareable link from the conversation id
  const shareUrl = `${window.location.origin}/share/${conv.id}`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareUrl]);

  // Close on backdrop click or Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="share-backdrop" onMouseDown={onClose}>
      <div className="share-modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Share conversation">
        <div className="share-modal-header">
          <span className="share-modal-title">Share Conversation</span>
          <button className="share-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="share-modal-body">
          <div className="share-conv-preview">
            <span className="share-conv-icon">📝</span>
            <span className="share-conv-text">{conv.text}</span>
          </div>

          <p className="share-modal-desc">
            Anyone with this link can view this conversation.
          </p>

          <div className="share-link-row">
            <input
              className="share-link-input"
              type="text"
              value={shareUrl}
              readOnly
              onFocus={(e) => e.target.select()}
              aria-label="Share link"
            />
            <button className="share-copy-btn" onClick={handleCopy}>
              {copied ? '✓ Copied!' : '⎘ Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Rename Inline Input ────────────────────────────────────────────────────────
function RenameInput({ value, onConfirm, onCancel }) {
  const [text, setText] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const confirm = () => {
    const trimmed = text.trim();
    if (trimmed && trimmed !== value) onConfirm(trimmed);
    else onCancel();
  };

  const onKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); confirm(); }
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="rename-row">
      <input
        ref={inputRef}
        className="rename-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        onBlur={confirm}
        maxLength={120}
        aria-label="Rename conversation"
      />
    </div>
  );
}

// ── Context Menu ──────────────────────────────────────────────────────────────
function ContextMenu({ conv, position, onClose, onPin, onShare, onRename, onArchive, onDelete }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // Compute safe position so the menu doesn't overflow the viewport
  const style = {
    top:   position.y,
    left:  position.x,
  };

  return (
    <div className="ctx-menu" style={style} ref={menuRef} role="menu" aria-label="Conversation options">
      <button className="ctx-item" role="menuitem" onClick={() => { onPin(conv); onClose(); }}>
        <span className="ctx-icon">{conv.pinned ? '📌' : '📌'}</span>
        <span>{conv.pinned ? 'Unpin' : 'Pin'}</span>
      </button>
      <button className="ctx-item" role="menuitem" onClick={() => { onShare(conv); onClose(); }}>
        <span className="ctx-icon">🔗</span>
        <span>Share</span>
      </button>
      <button className="ctx-item" role="menuitem" onClick={() => { onRename(conv); onClose(); }}>
        <span className="ctx-icon">✏️</span>
        <span>Rename</span>
      </button>
      <div className="ctx-divider" />
      <button className="ctx-item" role="menuitem" onClick={() => { onArchive(conv); onClose(); }}>
        <span className="ctx-icon">🗃️</span>
        <span>{conv.archived ? 'Unarchive' : 'Archive'}</span>
      </button>
      <button className="ctx-item ctx-item-danger" role="menuitem" onClick={() => { onDelete(conv); onClose(); }}>
        <span className="ctx-icon">🗑️</span>
        <span>Delete</span>
      </button>
    </div>
  );
}

// ── Recent Item ───────────────────────────────────────────────────────────────
function RecentItem({ conv, onClick, onPin, onShare, onRename, onArchive, onDelete }) {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [menuPos, setMenuPos]     = useState({ x: 0, y: 0 });
  const [renaming, setRenaming]   = useState(false);
  const itemRef                   = useRef(null);

  const openMenu = (e) => {
    e.stopPropagation();
    const rect = itemRef.current?.getBoundingClientRect() ?? { right: 0, top: 0 };
    // Position menu to the right of the item; clamp to viewport
    const x = Math.min(rect.right + 4, window.innerWidth - 190);
    const y = Math.min(rect.top,       window.innerHeight - 260);
    setMenuPos({ x, y });
    setMenuOpen(true);
  };

  const handleRename = (newText) => {
    setRenaming(false);
    onRename(conv, newText);
  };

  if (renaming) {
    return (
      <div className="recent-item recent-item-renaming" ref={itemRef}>
        <RenameInput
          value={conv.text}
          onConfirm={handleRename}
          onCancel={() => setRenaming(false)}
        />
      </div>
    );
  }

  return (
    <>
      <div className={`recent-item ${conv.pinned ? 'recent-item-pinned' : ''}`} ref={itemRef}>
        <button
          className="recent-item-btn"
          onClick={() => onClick(conv)}
          title={conv.text}
        >
          {conv.pinned && <span className="recent-pin-indicator" title="Pinned">📌</span>}
          <span className="recent-icon">📝</span>
          <span className="recent-text">{conv.text}</span>
        </button>

        <button
          className="recent-menu-btn"
          onClick={openMenu}
          title="More options"
          aria-label="More options"
          aria-haspopup="true"
          aria-expanded={menuOpen}
        >
          ···
        </button>
      </div>

      {menuOpen && (
        <ContextMenu
          conv={conv}
          position={menuPos}
          onClose={() => setMenuOpen(false)}
          onPin={onPin}
          onShare={onShare}
          onRename={() => { setRenaming(true); }}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      )}
    </>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────
export default function Sidebar({
  onQuickPrompt,
  isCollapsed,
  onToggle,
  isMobileOpen = false,
  onMobileClose = () => {},
  conversationHistory = [],
  onLoadConversation  = () => {},
  onClearHistory      = () => {},
  onUpdateHistory     = () => {},   // NEW: (updatedList) => void
}) {
  const [openCategory, setOpenCategory]     = useState('Common Errors');
  const [shareTarget,  setShareTarget]      = useState(null);   // conv being shared
  const [showArchived, setShowArchived]     = useState(false);

  const truncateText = (text, length = 50) =>
    text.length > length ? text.substring(0, length) + '…' : text;

  const mobileClass    = isMobileOpen ? 'mobile-open' : '';
  const collapsedClass = isCollapsed  ? 'collapsed'   : '';

  // ── Derived lists ─────────────────────────────────────────────────────────
  const pinned   = conversationHistory.filter(c => c.pinned && !c.archived);
  const recents  = conversationHistory.filter(c => !c.pinned && !c.archived);
  const archived = conversationHistory.filter(c => c.archived);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePin = useCallback((conv) => {
    const updated = conversationHistory.map(c =>
      c.id === conv.id ? { ...c, pinned: !c.pinned } : c
    );
    onUpdateHistory(updated);
  }, [conversationHistory, onUpdateHistory]);

  const handleShare = useCallback((conv) => {
    setShareTarget(conv);
  }, []);

  const handleRename = useCallback((conv, newText) => {
    const updated = conversationHistory.map(c =>
      c.id === conv.id ? { ...c, text: newText } : c
    );
    onUpdateHistory(updated);
  }, [conversationHistory, onUpdateHistory]);

  const handleArchive = useCallback((conv) => {
    const updated = conversationHistory.map(c =>
      c.id === conv.id ? { ...c, archived: !c.archived, pinned: false } : c
    );
    onUpdateHistory(updated);
  }, [conversationHistory, onUpdateHistory]);

  const handleDelete = useCallback((conv) => {
    const updated = conversationHistory.filter(c => c.id !== conv.id);
    onUpdateHistory(updated);
  }, [conversationHistory, onUpdateHistory]);

  const handleItemClick = useCallback((conv) => {
    onLoadConversation(conv.text);
    onMobileClose();
  }, [onLoadConversation, onMobileClose]);

  // ── Shared item props ─────────────────────────────────────────────────────
  const itemActions = {
    onPin:     handlePin,
    onShare:   handleShare,
    onRename:  handleRename,
    onArchive: handleArchive,
    onDelete:  handleDelete,
    onClick:   handleItemClick,
  };

  return (
    <>
      <aside className={`sidebar ${collapsedClass} ${mobileClass}`}>

        {/* ── Desktop collapse toggle ── */}
        <button className="sidebar-toggle" onClick={onToggle} title="Toggle sidebar">
          <span>{isCollapsed ? '▶' : '◀'}</span>
        </button>

        {/* ── Mobile top bar ── */}
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

            {/* ── PINNED ── */}
            {pinned.length > 0 && (
              <div className="recents-section">
                <div className="recents-header">
                  <span className="recents-title">📌 PINNED</span>
                </div>
                <div className="recents-list">
                  {pinned.map(conv => (
                    <RecentItem key={conv.id} conv={conv} {...itemActions} />
                  ))}
                </div>
              </div>
            )}

            {/* ── RECENTS ── */}
            {recents.length > 0 && (
              <div className="recents-section">
                <div className="recents-header">
                  <span className="recents-title">RECENTS</span>
                  <button
                    className="recents-clear"
                    onClick={onClearHistory}
                    title="Clear history"
                    aria-label="Clear history"
                  >
                    ✕
                  </button>
                </div>
                <div className="recents-list">
                  {recents.map(conv => (
                    <RecentItem key={conv.id} conv={conv} {...itemActions} />
                  ))}
                </div>
              </div>
            )}

            {/* ── ARCHIVED (collapsible) ── */}
            {archived.length > 0 && (
              <div className="recents-section">
                <div className="recents-header">
                  <button
                    className="recents-title recents-title-btn"
                    onClick={() => setShowArchived(v => !v)}
                    aria-expanded={showArchived}
                  >
                    🗃️ ARCHIVED ({archived.length}) {showArchived ? '▾' : '▸'}
                  </button>
                </div>
                {showArchived && (
                  <div className="recents-list">
                    {archived.map(conv => (
                      <RecentItem key={conv.id} conv={conv} {...itemActions} />
                    ))}
                  </div>
                )}
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

      {/* ── Share Modal (portal-like, rendered outside aside) ── */}
      {shareTarget && (
        <ShareModal
          conv={shareTarget}
          onClose={() => setShareTarget(null)}
        />
      )}
    </>
  );
}
