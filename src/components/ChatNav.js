// ═══════════════════════════════════════
// FSAI – ChatNav (Prompt Navigator)
// Floating panel listing all user prompts
// as scroll-to anchors. Always visible
// once the chat has messages.
// ═══════════════════════════════════════
import React, { useEffect, useRef, useState, useCallback } from 'react';
import './ChatNav.css';

/** Truncate to max chars with ellipsis */
function truncate(str, max = 46) {
  if (!str) return '';
  const clean = str.replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max) + '\u2026' : clean;
}

/**
 * ChatNav
 *
 * Props:
 *   userPrompts  – [{ id, content }]  ordered user messages
 *   scrollRef    – ref to .message-list container
 *   msgRefs      – ref map { [msgId]: DOMElement }
 *   isVisible    – false when chat is empty (hides everything)
 */
export default function ChatNav({ userPrompts, scrollRef, msgRefs, isVisible }) {
  const [open,     setOpen]     = useState(false);
  const [activeId, setActiveId] = useState(null);
  const panelRef                = useRef(null);

  // ── Close panel on outside click ─────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        !e.target.closest('.chatnav-trigger')
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── Highlight whichever prompt is currently visible ───────────────────────
  useEffect(() => {
    if (!scrollRef?.current || userPrompts.length === 0) return;

    const root = scrollRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          const id = Number(visible[0].target.dataset.msgid);
          if (!isNaN(id)) setActiveId(id);
        }
      },
      { root, threshold: 0.3 }
    );

    userPrompts.forEach(({ id }) => {
      const el = msgRefs.current?.[id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [userPrompts, scrollRef, msgRefs]);

  // ── Jump to a message ─────────────────────────────────────────────────────
  const jumpTo = useCallback((id) => {
    const el = msgRefs.current?.[id];
    if (!el || !scrollRef?.current) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveId(id);
    if (window.innerWidth <= 540) setOpen(false);
  }, [msgRefs, scrollRef]);

  // Never render when chat is empty
  if (!isVisible || userPrompts.length === 0) return null;

  return (
    <>
      {/* ── Trigger — always visible ── */}
      <button
        className="chatnav-trigger"
        onClick={() => setOpen(o => !o)}
        title="Prompt navigator"
        aria-label="Toggle prompt navigator"
        aria-expanded={open}
      >
        {/* hamburger lines via unicode */}
        &#9776;
        <span className="chatnav-trigger-badge">{userPrompts.length}</span>
      </button>

      {/* ── Popup panel ── */}
      {open && (
        <div
          className="chatnav-panel"
          ref={panelRef}
          role="navigation"
          aria-label="Prompt navigator"
        >
          <div className="chatnav-header">
            <span className="chatnav-title">Prompts</span>
            <button
              className="chatnav-close"
              onClick={() => setOpen(false)}
              aria-label="Close navigator"
            >
              &#x2715;
            </button>
          </div>

          <div className="chatnav-list" role="list">
            {userPrompts.map((prompt, idx) => (
              <button
                key={prompt.id}
                className={`chatnav-item ${activeId === prompt.id ? 'active' : ''}`}
                onClick={() => jumpTo(prompt.id)}
                title={prompt.content}
                role="listitem"
              >
                <span className="chatnav-item-index">{idx + 1}</span>
                <span className="chatnav-item-text">{truncate(prompt.content)}</span>
                <span className="chatnav-item-arrow">&#8594;</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
