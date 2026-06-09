// ═══════════════════════════════════════
// FSAI – Netlify Function: share-save
// POST /api/share-save
// Body: { shareId: string, payload: object }
// Saves conversation to Netlify Blobs (server-side KV store).
// Returns: { ok: true }
// ═══════════════════════════════════════

const { getStore } = require('@netlify/blobs');

// ── CORS headers — allow any origin so share links work cross-browser ──
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { shareId, payload } = body;

    if (!shareId || !payload) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'shareId and payload are required' }),
      };
    }

    // Validate shareId — allow only safe alphanumeric/dash/underscore chars
    if (!/^[\w-]{1,64}$/.test(shareId)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Invalid shareId' }),
      };
    }

    // Serialize payload and enforce 1MB size cap
    const serialized = JSON.stringify(payload);
    if (serialized.length > 1_000_000) {
      return {
        statusCode: 413,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Conversation too large to share (max 1 MB)' }),
      };
    }

    const store = getStore('fsai-shares');
    await store.set(shareId, serialized, {
      metadata: { sharedAt: new Date().toISOString() },
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error('[share-save] Error:', err.message);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
