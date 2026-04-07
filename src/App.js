// ═══════════════════════════════════════
// FSAI – Root App Component
// ═══════════════════════════════════════
import React, { useState, useCallback, useEffect } from 'react';
import AnimatedBackground from './components/AnimatedBackground';
import Header             from './components/Header';
import Sidebar            from './components/Sidebar';
import MessageList        from './components/MessageList';
import ChatInput          from './components/ChatInput';
import { useChat }        from './hooks/useChat';
import './App.css';

export default function App() {
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [quickInput, setQuickInput]             = useState('');
  const [inputKey, setInputKey]                 = useState(0);
  const [conversationHistory, setConversationHistory] = useState([]);

  // Store conversation history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content;
      if (lastUserMsg && !conversationHistory.some(h => h.text === lastUserMsg)) {
        setConversationHistory(prev => [
          { id: Date.now(), text: lastUserMsg, timestamp: new Date() },
          ...prev
        ].slice(0, 20)); 
      }
    }
  }, [messages]);

  // When user picks a quick prompt — inject into textarea
  const handleQuickPrompt = useCallback((text) => {
    setQuickInput(text);
    setInputKey(k => k + 1); // force ChatInput re-mount to pick up new value
  }, []);

  const handleLoadConversation = useCallback((text) => {
    setQuickInput(text);
    setInputKey(k => k + 1);
  }, []);

  return (
    <div className="app">
      <AnimatedBackground />

      <Header
        messageCount={messages.length}
        onClear={clearChat}
      />

      <div className="app-body">
        <Sidebar
          onQuickPrompt={handleQuickPrompt}
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(c => !c)}
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
            key={inputKey}
            onSend={sendMessage}
            isLoading={isLoading}
            initialValue={quickInput}
          />
        </div>
      </div>
    </div>
  );
}
