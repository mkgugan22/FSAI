// ═══════════════════════════════════════
// FSAI – ChatNav
// Floating right-side panel showing all
// user prompts as scroll-to anchors,
// inspired by the ChatGPT prompt navigator.
// ═══════════════════════════════════════
import React, { useEffect, useRef, useState, useCallback } from 'react';
import './ChatNav.css';

/**
 * Truncates a string to `max` chars, appending ellipsis.
 */
function truncate(str, max = 48) {
  if (!str) return '';
  const clean = str.replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max) + '\u2026' : clean;
}

/**
 * ChatNav
 *
 * Props:
 *   userPrompts   - array of { id, content } (only user-role messages)
 *   scrollRef     - ref to the .message-list scroll container
 *   msgRefs       - ref-map { [msgId]: DOM element } populated by MessageList
 *   isVisible     - whether the trigger button should show (false when chat is empty)
 */
export default function ChatNav({ userPrompts, scrollRef, msgRefs, isVisible }) {
  const [open, setOpen]         = useState(false);
  const [activeId, setActiveId] = useState(null);
  const panelRef                = useRef(null);

  // Close on outside click
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

  // Track which prompt is currently in view via IntersectionObserver
  useEffect(() => {
    if (!scrollRef?.current || userPrompts.length === 0) return;

    const root = scrollRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost visible user-message
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

  // Scroll to a specific message
  const jumpTo = useCallback((id) => {
    const el = msgRefs.current?.[id];
    if (!el || !scrollRef?.current) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveId(id);
    if (window.innerWidth <= 540) setOpen(false);
  }, [msgRefs, scrollRef]);

  if (!isVisible || userPrompts.length === 0) return null;

  return (
    <>
      <button
        className={`chatnav-trigger ${isVisible ? 'visible' : 'hidden'}`}
        onClick={() => setOpen(o => !o)}
        title="Prompt navigator"
        aria-label="Toggle prompt navigator"
        aria-expanded={open}
      >
        &#9776;
        <span className="chatnav-trigger-badge">{userPrompts.length}</span>
      </button>

      {open && (
        <div className="chatnav-panel" ref={panelRef} role="navigation" aria-label="Prompt navigator">
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
                <span className="chatnav-item-text">{truncate(prompt.content, 46)}</span>
                <span className="chatnav-item-arrow">&#8594;</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
