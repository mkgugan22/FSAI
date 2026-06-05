// ═══════════════════════════════════════
// FSAI – MessageList
// ═══════════════════════════════════════
import React, { useEffect, useRef, useState, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import WelcomeScreen from './WelcomeScreen';
import './MessageList.css';

// How many px from the bottom counts as "at the bottom"
const BOTTOM_THRESHOLD = 80;
// How many px from the top before the "scroll to top" button appears
const TOP_THRESHOLD = 200;

export default function MessageList({ messages, isLoading, onChipClick }) {
  const bottomRef    = useRef(null);
  const containerRef = useRef(null);

  const [showTop,    setShowTop]    = useState(false);
  const [showBottom, setShowBottom] = useState(false);
  const [hasUnread,  setHasUnread]  = useState(false);

  // Track whether user is near the bottom so we know if new messages are "unseen"
  const nearBottomRef = useRef(true);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const distFromBottom = scrollHeight - scrollTop - clientHeight;
    const distFromTop    = scrollTop;

    const atBottom = distFromBottom <= BOTTOM_THRESHOLD;
    nearBottomRef.current = atBottom;

    setShowTop(distFromTop > TOP_THRESHOLD);
    setShowBottom(!atBottom && scrollHeight > clientHeight + TOP_THRESHOLD);

    if (atBottom) setHasUnread(false);
  }, []);

  // Attach scroll listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Auto-scroll on new messages — only if already near bottom
  useEffect(() => {
    if (nearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasUnread(false);
    } else if (messages.length > 0) {
      // New message arrived but user is scrolled up → show unread dot
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

  const isEmpty = messages.length === 0;

  return (
    <div className="message-list" ref={containerRef}>
      {isEmpty ? (
        <WelcomeScreen onChipClick={onChipClick} />
      ) : (
        <div className="messages-inner">
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="typing-wrap-outer">
              <TypingIndicator />
            </div>
          )}

          <div ref={bottomRef} className="scroll-anchor" />
        </div>
      )}

      {/* ── Scroll nav buttons (only when there are messages) ── */}
      {!isEmpty && (
        <div className="scroll-nav" aria-hidden="true">
          {/* Scroll to top */}
          <button
            className={`scroll-nav-btn ${showTop ? 'visible' : 'hidden'}`}
            onClick={scrollToTop}
            title="Scroll to top"
            tabIndex={showTop ? 0 : -1}
          >
            ↑
          </button>

          {/* Scroll to bottom */}
          <button
            className={`scroll-nav-btn ${showBottom ? 'visible' : 'hidden'}`}
            onClick={scrollToBottom}
            title="Scroll to bottom"
            tabIndex={showBottom ? 0 : -1}
            style={{ position: 'relative' }}
          >
            ↓
            {hasUnread && <span className="unread-dot" />}
          </button>
        </div>
      )}
    </div>
  );
}
