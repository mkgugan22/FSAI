// ═══════════════════════════════════════
// FSAI – MessageList
// ═══════════════════════════════════════
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import WelcomeScreen from './WelcomeScreen';
import ChatNav from './ChatNav';
import './MessageList.css';

// How many px from the bottom counts as "at the bottom"
const BOTTOM_THRESHOLD = 80;
// How many px from the top before scroll buttons appear
const TOP_THRESHOLD = 200;

export default function MessageList({ messages, isLoading, onChipClick }) {
  const bottomRef    = useRef(null);
  const containerRef = useRef(null);
  // Map of msgId -> DOM element; populated by callback refs on each message row
  const msgRefs      = useRef({});

  const [showTop,    setShowTop]    = useState(false);
  const [showBottom, setShowBottom] = useState(false);
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

    setShowTop(scrollTop > TOP_THRESHOLD);
    setShowBottom(!atBottom && scrollHeight > clientHeight + TOP_THRESHOLD);

    if (atBottom) setHasUnread(false);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // ── Auto-scroll on new messages (only when near bottom) ──────────────────
  useEffect(() => {
    if (nearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasUnread(false);
    } else if (messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last?.role === 'agent') setHasUnread(true);
    }
  }, [messages, isLoading]);

  const scrollToTop = useCallback(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHasUnread(false);
  }, []);

  // ── Derive ordered list of user prompts for ChatNav ───────────────────────
  const userPrompts = useMemo(
    () => messages
      .filter(m => m.role === 'user')
      .map(m => ({ id: m.id, content: m.content })),
    [messages]
  );

  // Callback-ref factory: registers each message's DOM node into msgRefs map
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
            // Wrap each message in a div that carries a data-msgid attr
            // so IntersectionObserver in ChatNav can read it back
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

      {/* ── Scroll nav buttons (top / bottom) ── */}
      {!isEmpty && (
        <div className="scroll-nav" aria-hidden="true">
          <button
            className={`scroll-nav-btn ${showTop ? 'visible' : 'hidden'}`}
            onClick={scrollToTop}
            title="Scroll to top"
            tabIndex={showTop ? 0 : -1}
          >
            &#8593;
          </button>

          <button
            className={`scroll-nav-btn ${showBottom ? 'visible' : 'hidden'}`}
            onClick={scrollToBottom}
            title="Scroll to bottom"
            tabIndex={showBottom ? 0 : -1}
            style={{ position: 'relative' }}
          >
            &#8595;
            {hasUnread && <span className="unread-dot" />}
          </button>
        </div>
      )}

      {/* ── ChatNav prompt navigator ── */}
      <ChatNav
        userPrompts={userPrompts}
        scrollRef={containerRef}
        msgRefs={msgRefs}
        isVisible={!isEmpty}
      />
    </div>
  );
}
