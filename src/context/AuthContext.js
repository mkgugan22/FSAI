// ═══════════════════════════════════════
// FSAI – AuthContext
// Manages user authentication state
// 100% sessionStorage + SHA-256 hashed passwords
// No sensitive data in localStorage whatsoever
// ═══════════════════════════════════════
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

// ── Storage keys (all in sessionStorage) ─────────────────────────────────────
const SESSION_USER_KEY = 'fsai_session_user';
const SESSION_DB_KEY   = 'fsai_session_db';

// ── Legacy localStorage keys to scrub on startup ─────────────────────────────
// Previous versions of this app wrote user data and hashed passwords into
// localStorage.  We purge those keys immediately so nothing sensitive lingers.
// NOTE: We intentionally do NOT purge fsai_messages_* keys here so each
//       user's chat history persists across browser sessions.
const LEGACY_LS_KEYS = ['fsai_user', 'fsai_users_db', 'fsai_messages'];

function purgeLegacyLocalStorage() {
  try {
    LEGACY_LS_KEYS.forEach(key => localStorage.removeItem(key));
  } catch {}
}

// ── Password hashing (Web Crypto API — zero external dependencies) ────────────
async function hashPassword(password) {
  const encoded    = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── sessionStorage helpers ────────────────────────────────────────────────────
function sessionGet(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function sessionSet(key, value) {
  try {
    if (value !== null && value !== undefined) {
      sessionStorage.setItem(key, JSON.stringify(value));
    } else {
      sessionStorage.removeItem(key);
    }
  } catch {}
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => sessionGet(SESSION_USER_KEY));

  // Wipe any leftover sensitive data from localStorage on every mount.
  useEffect(() => {
    purgeLegacyLocalStorage();
  }, []);

  const signup = useCallback(async ({ name, email, password }) => {
    const db  = sessionGet(SESSION_DB_KEY) ?? {};
    const key = email.toLowerCase().trim();

    if (db[key]) {
      throw new Error('An account with this email already exists.');
    }

    const passwordHash = await hashPassword(password);

    const newUser = {
      id        : 'user_' + Date.now(),
      name      : name.trim(),
      email     : key,
      avatar    : name.trim()[0].toUpperCase(),
      createdAt : new Date().toISOString(),
      _pwHash   : passwordHash,
    };

    db[key] = newUser;
    sessionSet(SESSION_DB_KEY, db);

    const { _pwHash, ...safeUser } = newUser;
    setUser(safeUser);
    sessionSet(SESSION_USER_KEY, safeUser);
    return safeUser;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const db    = sessionGet(SESSION_DB_KEY) ?? {};
    const key   = email.toLowerCase().trim();
    const found = db[key];

    if (!found) {
      throw new Error('No account found with this email.');
    }

    const passwordHash = await hashPassword(password);

    if (found._pwHash !== passwordHash) {
      throw new Error('Incorrect password. Please try again.');
    }

    const { _pwHash, ...safeUser } = found;
    setUser(safeUser);
    sessionSet(SESSION_USER_KEY, safeUser);
    return safeUser;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionSet(SESSION_USER_KEY, null);
    // Chat messages are NOT wiped — they remain in localStorage under the
    // user's own key (fsai_messages_<userId>) and reload on next login.
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}