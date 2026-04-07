// ═══════════════════════════════════════
// FSAI – Root App Component
// ═══════════════════════════════════════
import React, { useState, useCallback, useEffect, useRef } from 'react';
import AnimatedBackground from './components/AnimatedBackground';
import Header             from './components/Header';
import Sidebar            from './components/Sidebar';
import MessageList        from './components/MessageList';
import ChatInput          from './components/ChatInput';
import { useChat }        from './hooks/useChat';
import './App.css';

export default function App() {
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  const [sidebarOpen, setSidebarOpen]                   = useState(false);   // mobile drawer
  const [sidebarCollapsed, setSidebarCollapsed]         = useState(false);   // desktop collapse
  const [quickInput, setQuickInput]                     = useState('');
  const [conversationHistory, setConversationHistory]   = useState([]);
  const chatInputRef = useRef(null);

  // Store conversation history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content;
      if (lastUserMsg && !conversationHistory.some(h => h.text === lastUserMsg)) {
        setConversationHistory(prev =>
          [{ id: Date.now(), text: lastUserMsg, timestamp: new Date() }, ...prev].slice(0, 20)
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Inject text into ChatInput without remounting (preserves messages)
  const handleQuickPrompt = useCallback((text) => {
    setQuickInput(text);
    setSidebarOpen(false); // close mobile drawer after selection
  }, []);

  const handleLoadConversation = useCallback((text) => {
    setQuickInput(text);
    setSidebarOpen(false);
  }, []);

  // Clear quickInput after ChatInput consumes it
  const handleQuickInputConsumed = useCallback(() => {
    setQuickInput('');
  }, []);

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
          onClearHistory={() => setConversationHistory([])}
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