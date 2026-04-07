// ═══════════════════════════════════════
// FSAI – useChat Hook
// ═══════════════════════════════════════
import { useState, useCallback, useRef } from 'react';
import { callFSAI, resetSession } from '../utils/agent';
import { parseAgentResponse } from '../utils/parser';

export function useChat() {
  const [messages, setMessages]   = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState(null);
  const historyRef                = useRef([]);

  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim() || isLoading) return;

    setError(null);

    const userMsg = {
      id:      Date.now(),
      role:    'user',
      content: userText.trim(),
    };

    setMessages(prev => [...prev, userMsg]);
    historyRef.current.push({ role: 'user', content: userText.trim() });

    setIsLoading(true);

    try {
      const raw    = await callFSAI(historyRef.current);
      const parsed = parseAgentResponse(raw);

      const agentMsg = {
        id:     Date.now() + 1,
        role:   'agent',
        raw,
        parsed,
      };

      setMessages(prev => [...prev, agentMsg]);
      historyRef.current.push({ role: 'assistant', content: raw });

    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, {
        id:      Date.now() + 1,
        role:    'error',
        content: err.message,
      }]);
      historyRef.current.pop();
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    historyRef.current = [];
    resetSession(); // start fresh Mistral conversation
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat };
}
