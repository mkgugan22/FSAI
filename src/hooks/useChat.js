// ═══════════════════════════════════════
// FSAI – useChat Hook (Redux-backed)
// ═══════════════════════════════════════
import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage, setLoading, setError, clearMessages } from '../store/chatSlics';
import { callFSAI, resetSession } from '../utils/agent';
import { parseAgentResponse } from '../utils/parser';

export function useChat() {
  const dispatch   = useDispatch();
  const messages   = useSelector(state => state.chat.messages);
  const isLoading  = useSelector(state => state.chat.isLoading);
  const historyRef = useRef(
    messages
      .filter(m => m.role === 'user' || m.role === 'agent')
      .map(m => ({
        role:    m.role === 'agent' ? 'assistant' : 'user',
        content: m.role === 'agent' ? (m.raw || '') : (m.content || ''),
      }))
  );

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