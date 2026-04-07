// ═══════════════════════════════════════
// FSAI – MessageList
// ═══════════════════════════════════════
import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import WelcomeScreen from './WelcomeScreen';
import './MessageList.css';

export default function MessageList({ messages, isLoading, onChipClick }) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
    </div>
  );
}
