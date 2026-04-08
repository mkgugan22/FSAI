// ═══════════════════════════════════════
// FSAI – Chat Redux Slice (persisted)
// ═══════════════════════════════════════
import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'fsai_messages';

function loadMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {}
}

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: loadMessages(),
    isLoading: false,
    error: null,
  },
  reducers: {
    addMessage(state, action) {
      state.messages.push(action.payload);
      saveMessages(state.messages);
    },
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    clearMessages(state) {
      state.messages = [];
      state.error = null;
      saveMessages([]);
    },
  },
});

export const { addMessage, setLoading, setError, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;