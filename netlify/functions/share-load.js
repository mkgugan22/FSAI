// ═══════════════════════════════════════
// FSAI – Netlify Function: share-load
// GET /api/share-load?id=<shareId>
// Loads a conversation from Netlify Blobs.
// Returns: { payload: object } or 404
// ═══════════════════════════════════════

const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const shareId = event.queryStringParameters?.id;

    if (!shareId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'id query param required' }),
      };
    }

    // Validate shareId is safe
    if (!/^[\w-]{1,64}$/.test(shareId)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid shareId' }),
      };
    }

    const store = getStore('fsai-shares');
    const raw = await store.get(shareId);

    if (!raw) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Conversation not found' }),
      };
    }

    const payload = JSON.parse(raw);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache for 1 hour — shared conversations don't change
        'Cache-Control': 'public, max-age=3600',
      },
      body: JSON.stringify({ payload }),
    };
  } catch (err) {
    console.error('[share-load] Error:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
