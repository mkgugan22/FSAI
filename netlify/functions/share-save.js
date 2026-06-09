// ═══════════════════════════════════════
// FSAI – Netlify Function: share-save
// POST /api/share-save
// Body: { shareId: string, payload: object }
// Saves conversation to Netlify Blobs.
// Returns: { ok: true, shareId }
// ═══════════════════════════════════════

exports.handler = async (event) => {
  const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

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

    // Validate shareId — only allow safe characters
    if (!/^[\w-]{1,64}$/.test(shareId)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Invalid shareId' }),
      };
    }

    // Serialize and size-check (1MB limit)
    const serialized = JSON.stringify(payload);
    if (serialized.length > 1_000_000) {
      return {
        statusCode: 413,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Conversation too large (max ~1MB)' }),
      };
    }

    // ── Netlify Blobs ───────────────────────────────────────────
    // NETLIFY_BLOBS_CONTEXT is automatically injected at runtime
    // in deployed Netlify Functions (no manual config needed).
    const { getStore } = require('@netlify/blobs');
    const store = getStore({ name: 'fsai-shares', consistency: 'strong' });

    await store.set(shareId, serialized);

    console.log(`[share-save] OK shareId=${shareId} size=${serialized.length}`);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: true, shareId }),
    };

  } catch (err) {
    console.error('[share-save] FAILED:', err.message);
    console.error(err.stack);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
