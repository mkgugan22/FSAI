// ═══════════════════════════════════════
// FSAI – Netlify Function: share-load
// GET /api/share-load?id=<shareId>
// Loads a conversation from Netlify Blobs.
// Returns: { payload: object } or 404
// ═══════════════════════════════════════

const { getStore } = require('@netlify/blobs');

// ── CORS headers — allow any origin so share links work cross-browser ──
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const shareId = event.queryStringParameters?.id;

    if (!shareId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'id query param required' }),
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

    const store = getStore('fsai-shares');
    const raw = await store.get(shareId);

    if (!raw) {
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Conversation not found' }),
      };
    }

    const payload = JSON.parse(raw);

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        // Cache for 1 hour — shared conversations are immutable
        'Cache-Control': 'public, max-age=3600',
      },
      body: JSON.stringify({ payload }),
    };
  } catch (err) {
    console.error('[share-load] Error:', err.message);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
