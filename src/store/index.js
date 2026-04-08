// ═══════════════════════════════════════
// FSAI – Redux Store
// ═══════════════════════════════════════
import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlics';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
  },
});