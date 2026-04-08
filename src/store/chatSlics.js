// ═══════════════════════════════════════
// FSAI – Chat Redux Slice (per-user persisted)
// ═══════════════════════════════════════
import { createSlice } from '@reduxjs/toolkit';

// ── Storage key scoped to a specific user ────────────────────────────────────
// Each user's messages are stored under their own key so accounts never share
// chat history.  Pass the userId (or '' for anonymous) when calling the helpers.
export function storageKey(userId) {
  return userId ? `fsai_messages_${userId}` : 'fsai_messages_guest';
}

export function loadMessages(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMessages(messages, userId) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(messages));
  } catch {}
}

export function clearStoredMessages(userId) {
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {}
}

// ── Slice ─────────────────────────────────────────────────────────────────────
// initialState starts empty; App.js hydrates the correct user's messages after
// login via the hydrateMessages action.
const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages:  [],
    isLoading: false,
    error:     null,
    userId:    null,   // tracked so save helpers know which key to use
  },
  reducers: {
    // Called once after login / on mount with logged-in user to load their messages
    hydrateMessages(state, action) {
      const { messages, userId } = action.payload;
      state.messages = messages;
      state.userId   = userId;
      state.error    = null;
    },
    addMessage(state, action) {
      state.messages.push(action.payload);
      saveMessages(state.messages, state.userId);
    },
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    clearMessages(state) {
      clearStoredMessages(state.userId);
      state.messages = [];
      state.error    = null;
    },
  },
});

export const {
  hydrateMessages,
  addMessage,
  setLoading,
  setError,
  clearMessages,
} = chatSlice.actions;

export default chatSlice.reducer;