// ═══════════════════════════════════════
// FSAI – useChat Hook (Redux-backed, per-user)
// ═══════════════════════════════════════
import { useCallback, useRef, useEffect } from 'react';
import { useDispatch, useSelector }       from 'react-redux';
import {
  addMessage,
  setLoading,
  setError,
  clearMessages,
  hydrateMessages,
  loadMessages,
} from '../store/chatSlics';
import { callFSAI, resetSession } from '../utils/agent';
import { parseAgentResponse }     from '../utils/parser';
import { useAuth }                from '../context/AuthContext';

export function useChat() {
  const dispatch  = useDispatch();
  const { user }  = useAuth();
  const userId    = user?.id ?? null;

  const messages  = useSelector(state => state.chat.messages);
  const storedId  = useSelector(state => state.chat.userId);
  const isLoading = useSelector(state => state.chat.isLoading);

  // ── Hydrate the correct user's messages whenever the logged-in user changes ──
  useEffect(() => {
    if (userId !== storedId) {
      const persisted = userId ? loadMessages(userId) : [];
      dispatch(hydrateMessages({ messages: persisted, userId }));
    }
  }, [userId, storedId, dispatch]);

  // ── Conversation history ref for multi-turn context ──────────────────────────
  // Re-seed from the messages already in state so page-refresh doesn't lose context.
  const historyRef = useRef(
    messages
      .filter(m => m.role === 'user' || m.role === 'agent')
      .map(m => ({
        role:    m.role === 'agent' ? 'assistant' : 'user',
        content: m.role === 'agent' ? (m.raw || '') : (m.content || ''),
      }))
  );

  // Keep historyRef in sync when messages hydrate from a different user
  useEffect(() => {
    historyRef.current = messages
      .filter(m => m.role === 'user' || m.role === 'agent')
      .map(m => ({
        role:    m.role === 'agent' ? 'assistant' : 'user',
        content: m.role === 'agent' ? (m.raw || '') : (m.content || ''),
      }));
  }, [storedId]); // only re-seed when the active user switches

  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim() || isLoading) return;

    dispatch(setError(null));

    const userMsg = {
      id:      Date.now(),
      role:    'user',
      content: userText.trim(),
    };

    dispatch(addMessage(userMsg));
    historyRef.current.push({ role: 'user', content: userText.trim() });

    dispatch(setLoading(true));

    try {
      const raw    = await callFSAI(historyRef.current);
      const parsed = parseAgentResponse(raw);

      const agentMsg = {
        id:     Date.now() + 1,
        role:   'agent',
        raw,
        parsed,
      };

      dispatch(addMessage(agentMsg));
      historyRef.current.push({ role: 'assistant', content: raw });

    } catch (err) {
      dispatch(setError(err.message));
      dispatch(addMessage({
        id:      Date.now() + 1,
        role:    'error',
        content: err.message,
      }));
      historyRef.current.pop();
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, isLoading]);

  const clearChat = useCallback(() => {
    dispatch(clearMessages());
    historyRef.current = [];
    resetSession();
  }, [dispatch]);

  return { messages, isLoading, sendMessage, clearChat };
}