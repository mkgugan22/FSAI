// ═══════════════════════════════════════
// FSAI – Netlify Function: share-save
// POST /api/share-save
// Body: { shareId: string, payload: object }
// Saves conversation to Netlify Blobs (server-side KV store).
// Returns: { ok: true }
// ═══════════════════════════════════════

const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { shareId, payload } = JSON.parse(event.body || '{}');

    if (!shareId || !payload) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'shareId and payload are required' }),
      };
    }

    // Validate shareId is safe (numeric timestamp-based)
    if (!/^[\w-]{1,64}$/.test(shareId)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid shareId' }),
      };
    }

    // Serialize payload and check size (max 1MB)
    const serialized = JSON.stringify(payload);
    if (serialized.length > 1_000_000) {
      return {
        statusCode: 413,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Conversation too large to share (max 1MB)' }),
      };
    }

    // Save to Netlify Blobs
    const store = getStore('fsai-shares');
    await store.set(shareId, serialized, {
      metadata: { sharedAt: new Date().toISOString() },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error('[share-save] Error:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
