// ═══════════════════════════════════════
// FSAI – MessageBubble
// ═══════════════════════════════════════
import React from 'react';
import AgentResponse from './AgentResponse';
import './MessageBubble.css';

function formatTime(id) {
  const d = new Date(id);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── User Bubble ──────────────────────────────────────────────
function UserBubble({ content, id }) {
  return (
    <div className="msg msg-user">
      <div className="msg-meta msg-meta-user">
        <span className="msg-time">{formatTime(id)}</span>
        <span className="msg-role user-role">YOU</span>
      </div>
      <div className="bubble bubble-user">
        <pre className="user-text">{content}</pre>
      </div>
      <div className="avatar avatar-user">👤</div>
    </div>
  );
}

// ── Agent Bubble ─────────────────────────────────────────────
function AgentBubble({ parsed, raw, id }) {
  return (
    <div className="msg msg-agent">
      <div className="avatar avatar-agent">⬡</div>
      <div className="agent-content">
        <div className="msg-meta msg-meta-agent">
          <span className="msg-role agent-role">FSAI</span>
          <span className="msg-time">{formatTime(id)}</span>
        </div>
        <AgentResponse parsed={parsed} raw={raw} />
      </div>
    </div>
  );
}

// ── Error Bubble ─────────────────────────────────────────────
function ErrorBubble({ content }) {
  return (
    <div className="msg msg-agent">
      <div className="avatar avatar-agent error-avatar">⚠</div>
      <div className="bubble bubble-error">
        <div className="error-title">API Error</div>
        <p className="error-body">{content}</p>
        <p className="error-hint">Check your API key or network connection and try again.</p>
      </div>
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────────
export default function MessageBubble({ message }) {
  if (message.role === 'user') {
    return <UserBubble content={message.content} id={message.id} />;
  }
  if (message.role === 'error') {
    return <ErrorBubble content={message.content} />;
  }
  return <AgentBubble parsed={message.parsed} raw={message.raw} id={message.id} />;
}
