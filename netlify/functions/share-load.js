// ═══════════════════════════════════════
// FSAI – Netlify Function: share-load
// GET /api/share-load?id=<shareId>
// Loads a conversation from Netlify Blobs.
// Returns: { payload: object } or 404
// ═══════════════════════════════════════

exports.handler = async (event) => {
  const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

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

    // Validate shareId — only allow safe characters
    if (!/^[\w-]{1,64}$/.test(shareId)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Invalid shareId' }),
      };
    }

    const { getStore } = require('@netlify/blobs');
    const store = getStore({ name: 'fsai-shares', consistency: 'strong' });

    const raw = await store.get(shareId);

    if (raw === null || raw === undefined) {
      console.log(`[share-load] NOT FOUND shareId=${shareId}`);
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Conversation not found' }),
      };
    }

    const payload = JSON.parse(raw);

    console.log(`[share-load] OK shareId=${shareId}`);

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        // Cache for 1 hour — shared conversations don't change after saving
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
      body: JSON.stringify({ payload }),
    };

  } catch (err) {
    console.error('[share-load] FAILED:', err.message);
    console.error(err.stack);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
