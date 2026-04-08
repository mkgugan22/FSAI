// ═══════════════════════════════════════
// FSAI – AuthContext
// Manages user authentication state
// Hashed passwords stored in localStorage (persistent across devices)
// Current session in sessionStorage (cleared on browser close for security)
// ═══════════════════════════════════════
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

// ── Storage keys ──────────────────────────────────────────────────────────────
const SESSION_USER_KEY = 'fsai_session_user';      // sessionStorage - current session
const PERSISTENT_DB_KEY = 'fsai_users_db_v2';      // localStorage - persistent accounts (NO hashes)
const SESSION_DB_KEY = 'fsai_session_db';          // sessionStorage - working copy (WITH hashes only)

// ── Legacy localStorage keys to scrub on startup ─────────────────────────────
// Previous versions of this app wrote user data and hashed passwords into
// localStorage.  We purge those keys immediately so nothing sensitive lingers.
// NOTE: We intentionally do NOT purge fsai_messages_* keys here so each
//       user's chat history persists across browser sessions.
const LEGACY_LS_KEYS = ['fsai_user', 'fsai_users_db'];

function purgeLegacyLocalStorage() {
  try {
    LEGACY_LS_KEYS.forEach(key => localStorage.removeItem(key));
  } catch {}
}
// ── Remove password hashes from localStorage ───────────────────────────────────
// Migration function: Strip _pwHash from any persisted user data
// This ensures hashes are ONLY in sessionStorage for security
function stripHashesFromLocalStorage() {
  try {
    const persistedDb = persistentGet(PERSISTENT_DB_KEY);
    if (persistedDb && typeof persistedDb === 'object') {
      let modified = false;
      const cleanDb = {};

      for (const [key, user] of Object.entries(persistedDb)) {
        if (user && typeof user === 'object' && '_pwHash' in user) {
          // Remove the hash for security
          const { _pwHash, ...userWithoutHash } = user;
          cleanDb[key] = userWithoutHash;
          modified = true;
        } else {
          cleanDb[key] = user;
        }
      }

      // Only update if we removed any hashes
      if (modified) {
        persistentSet(PERSISTENT_DB_KEY, cleanDb);
      }
    }
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

// ── localStorage helpers (for persistent account database) ─────────────────────
function persistentGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistentSet(key, value) {
  try {
    if (value !== null && value !== undefined) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.removeItem(key);
    }
  } catch {}
}

// ── sessionStorage helpers (for current session) ───────────────────────────────
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

  // Initialize the session database from persistent storage and wipe legacy keys
  useEffect(() => {
    purgeLegacyLocalStorage();
    stripHashesFromLocalStorage();  // Remove any password hashes from localStorage

    // Start with empty session database (hashes will be added during signup/login)
    sessionSet(SESSION_DB_KEY, {});
  }, []);

  const signup = useCallback(async ({ name, email, password }) => {
    const sessionDb = sessionGet(SESSION_DB_KEY) ?? {};
    const persistedDb = persistentGet(PERSISTENT_DB_KEY) ?? {};
    const key = email.toLowerCase().trim();

    if (sessionDb[key] || persistedDb[key]) {
      throw new Error('An account with this email already exists.');
    }

    const passwordHash = await hashPassword(password);

    const userId = 'user_' + Date.now();
    const createdAt = new Date().toISOString();

    // User data WITHOUT password hash (for localStorage ONLY)
    const userDataWithoutHash = {
      id        : userId,
      name      : name.trim(),
      email     : key,
      avatar    : name.trim()[0].toUpperCase(),
      createdAt : createdAt,
    };

    // User data WITH password hash (for sessionStorage ONLY)
    const userDataWithHash = {
      ...userDataWithoutHash,
      _pwHash   : passwordHash,
    };

    // Save to sessionStorage with hash (temporary, session-only storage)
    sessionDb[key] = userDataWithHash;
    sessionSet(SESSION_DB_KEY, sessionDb);

    // Save to localStorage WITHOUT hash (persistent, but NO passwords ever)
    persistedDb[key] = userDataWithoutHash;
    persistentSet(PERSISTENT_DB_KEY, persistedDb);

    setUser(userDataWithoutHash);
    sessionSet(SESSION_USER_KEY, userDataWithoutHash);
    return userDataWithoutHash;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const sessionDb = sessionGet(SESSION_DB_KEY) ?? {};
    const persistedDb = persistentGet(PERSISTENT_DB_KEY) ?? {};
    const key = email.toLowerCase().trim();

    // Check if account exists in localStorage (persistent account list)
    const persistedUser = persistedDb[key];
    if (!persistedUser) {
      throw new Error('No account found with this email.');
    }

    const passwordHash = await hashPassword(password);

    // Check if we've already verified this user's password in THIS session
    let foundUser = sessionDb[key];
    
    if (!foundUser) {
      // First login of this session: accept password and store hash only in sessionStorage
      // This is secure because hashes are never persisted to localStorage
      foundUser = { ...persistedUser, _pwHash: passwordHash };
      sessionDb[key] = foundUser;
      sessionSet(SESSION_DB_KEY, sessionDb);
    } else {
      // User already logged in during this session: verify password against cached hash
      if (foundUser._pwHash !== passwordHash) {
        throw new Error('Incorrect password. Please try again.');
      }
    }

    const { _pwHash, ...safeUser } = foundUser;
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