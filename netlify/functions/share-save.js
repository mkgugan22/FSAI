// ═══════════════════════════════════════
// FSAI – Netlify Function: share-save
// POST /api/share-save
// Body: { shareId: string, payload: object }
// Stores conversation in JSONBin.io (free, no setup needed beyond API key).
// Returns: { ok: true, shareId, binId }
// ═══════════════════════════════════════

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const MASTER_KEY = process.env.JSONBIN_MASTER_KEY;
  if (!MASTER_KEY) {
    return {
      statusCode: 503,
      headers: CORS,
      body: JSON.stringify({
        error: 'JSONBIN_MASTER_KEY environment variable is not set. Add it in Netlify → Site Settings → Environment Variables.',
      }),
    };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { shareId, payload } = body;

  if (!shareId || !payload) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'shareId and payload are required' }) };
  }
  if (!/^[\w-]{1,64}$/.test(shareId)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid shareId format' }) };
  }

  const serialized = JSON.stringify(payload);
  if (serialized.length > 900_000) {
    return { statusCode: 413, headers: CORS, body: JSON.stringify({ error: 'Conversation too large (max ~900KB)' }) };
  }

  try {
    // Store the payload. We embed the shareId inside so we can verify on load.
    const res = await fetch('https://api.jsonbin.io/v3/b', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'X-Master-Key':  MASTER_KEY,
        'X-Bin-Name':    `fsai-${shareId}`,
        'X-Bin-Private': 'false',   // public read — no read key needed by anyone
      },
      body: JSON.stringify({ shareId, ...payload }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[share-save] JSONBin error', res.status, JSON.stringify(data));
      return {
        statusCode: res.status,
        headers: CORS,
        body: JSON.stringify({ error: data?.message || `JSONBin error ${res.status}` }),
      };
    }

    const binId = data?.metadata?.id;
    if (!binId) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'JSONBin did not return a bin ID' }) };
    }

    // We store a mapping shareId → binId in a second bin so share URLs stay
    // short (/share/<shareId>) rather than exposing JSONBin IDs.
    // For simplicity we embed the binId in the share URL directly — the load
    // function accepts either form.  Here we just return both.
    console.log(`[share-save] OK shareId=${shareId} binId=${binId}`);
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ ok: true, shareId, binId }),
    };
  } catch (err) {
    console.error('[share-save] fetch error', err.message);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
