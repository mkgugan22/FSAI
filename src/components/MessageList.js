// ═══════════════════════════════════════
// FSAI – MessageList
// ═══════════════════════════════════════
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import WelcomeScreen from './WelcomeScreen';
import ChatNav from './ChatNav';
import './MessageList.css';

// px from bottom that counts as "at the bottom"
const BOTTOM_THRESHOLD = 80;

export default function MessageList({ messages, isLoading, onChipClick }) {
  const bottomRef    = useRef(null);
  const containerRef = useRef(null);
  // Map of msgId → DOM element; populated by callback refs on each message row
  const msgRefs      = useRef({});

  // true  = user is near bottom (show ↑ arrow)
  // false = user is near top   (show ↓ arrow)
  const [nearBottom, setNearBottom] = useState(true);
  const [hasUnread,  setHasUnread]  = useState(false);

  const nearBottomRef = useRef(true);

  // ── Scroll tracking ───────────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const distFromBottom = scrollHeight - scrollTop - clientHeight;
    const atBottom = distFromBottom <= BOTTOM_THRESHOLD;

    nearBottomRef.current = atBottom;
    setNearBottom(atBottom);

    if (atBottom) setHasUnread(false);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // ── Auto-scroll on new messages (only when already near bottom) ───────────
  useEffect(() => {
    if (nearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasUnread(false);
    } else if (messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last?.role === 'agent') setHasUnread(true);
    }
  }, [messages, isLoading]);

  // Single smart scroll action: if near bottom → go to top; else → go to bottom
  const handleScrollToggle = useCallback(() => {
    if (nearBottom) {
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasUnread(false);
    }
  }, [nearBottom]);

  // ── Derive ordered list of user prompts for ChatNav ───────────────────────
  const userPrompts = useMemo(
    () => messages
      .filter(m => m.role === 'user')
      .map(m => ({ id: m.id, content: m.content })),
    [messages]
  );

  // Callback-ref factory: registers/unregisters each message's DOM node
  const getMsgRef = useCallback((id) => (el) => {
    if (el) {
      msgRefs.current[id] = el;
    } else {
      delete msgRefs.current[id];
    }
  }, []);

  const isEmpty = messages.length === 0;

  return (
    <div className="message-list" ref={containerRef}>
      {isEmpty ? (
        <WelcomeScreen onChipClick={onChipClick} />
      ) : (
        <div className="messages-inner">
          {messages.map(msg => (
            <div
              key={msg.id}
              ref={getMsgRef(msg.id)}
              data-msgid={msg.id}
            >
              <MessageBubble message={msg} />
            </div>
          ))}

          {isLoading && (
            <div className="typing-wrap-outer">
              <TypingIndicator />
            </div>
          )}

          <div ref={bottomRef} className="scroll-anchor" />
        </div>
      )}

      {/* ── Single smart scroll button — always visible when chat has messages ── */}
      {!isEmpty && (
        <div className="scroll-nav" aria-hidden="true">
          <button
            className="scroll-nav-btn visible"
            onClick={handleScrollToggle}
            title={nearBottom ? 'Scroll to top' : 'Scroll to bottom'}
          >
            {nearBottom ? '\u2191' : '\u2193'}
            {hasUnread && !nearBottom && <span className="unread-dot" />}
          </button>
        </div>
      )}

      {/* ── ChatNav prompt navigator — always visible when chat has messages ── */}
      <ChatNav
        userPrompts={userPrompts}
        scrollRef={containerRef}
        msgRefs={msgRefs}
        isVisible={!isEmpty}
      />
    </div>
  );
}
