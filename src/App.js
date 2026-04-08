// ═══════════════════════════════════════
// FSAI – Root App Component
// ═══════════════════════════════════════
import React, { useState, useCallback, useEffect, useRef } from 'react';
import AnimatedBackground from './components/AnimatedBackground';
import Header             from './components/Header';
import Sidebar            from './components/Sidebar';
import MessageList        from './components/MessageList';
import ChatInput          from './components/ChatInput';
import AuthPage           from './components/AuthPage';
import { useChat }        from './hooks/useChat';
import { useAuth }        from './context/AuthContext';
import './App.css';

// ── Per-user recents helpers ──────────────────────────────────────────────────
function recentsKey(userId) {
  return `fsai_recents_${userId}`;
}

function loadRecents(userId) {
  try {
    const raw = localStorage.getItem(recentsKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecents(userId, recents) {
  try {
    localStorage.setItem(recentsKey(userId), JSON.stringify(recents));
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  const [sidebarOpen, setSidebarOpen]           = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [quickInput, setQuickInput]             = useState('');
  const chatInputRef = useRef(null);

  // ── Conversation history: initialised from the logged-in user's storage ──
  const [conversationHistory, setConversationHistory] = useState(() =>
    user ? loadRecents(user.id) : []
  );

  // ── Reset recents whenever the active user changes (login / logout / switch) ──
  const prevUserIdRef = useRef(user?.id ?? null);
  useEffect(() => {
    const currentId = user?.id ?? null;
    if (currentId !== prevUserIdRef.current) {
      prevUserIdRef.current = currentId;
      setConversationHistory(currentId ? loadRecents(currentId) : []);
    }
  }, [user]);

  // ── Append new user queries to recents and persist them ──────────────────
  useEffect(() => {
    if (!user || messages.length === 0) return;

    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content;
    if (!lastUserMsg) return;

    setConversationHistory(prev => {
      if (prev.some(h => h.text === lastUserMsg)) return prev;
      const updated = [
        { id: Date.now(), text: lastUserMsg, timestamp: new Date() },
        ...prev,
      ].slice(0, 20);
      saveRecents(user.id, updated);
      return updated;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleQuickPrompt = useCallback((text) => {
    setQuickInput(text);
    setSidebarOpen(false);
  }, []);

  const handleLoadConversation = useCallback((text) => {
    setQuickInput(text);
    setSidebarOpen(false);
  }, []);

  const handleQuickInputConsumed = useCallback(() => {
    setQuickInput('');
  }, []);

  const handleClearHistory = useCallback(() => {
    setConversationHistory([]);
    if (user) saveRecents(user.id, []);
  }, [user]);

  // Show auth page when not logged in
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="app">
      <AnimatedBackground />

      <Header
        messageCount={messages.length}
        onClear={clearChat}
        onMenuToggle={() => setSidebarOpen(o => !o)}
      />

      <div className="app-body">
        {/* Mobile overlay */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        <Sidebar
          onQuickPrompt={handleQuickPrompt}
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(c => !c)}
          isMobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          conversationHistory={conversationHistory}
          onLoadConversation={handleLoadConversation}
          onClearHistory={handleClearHistory}
        />

        <div className="chat-panel">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            onChipClick={handleQuickPrompt}
          />

          <ChatInput
            ref={chatInputRef}
            onSend={sendMessage}
            isLoading={isLoading}
            quickInput={quickInput}
            onQuickInputConsumed={handleQuickInputConsumed}
          />
        </div>
      </div>
    </div>
  );
}