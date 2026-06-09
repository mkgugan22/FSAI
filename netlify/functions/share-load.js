// ═══════════════════════════════════════
// FSAI – Netlify Function: share-load
// GET /api/share-load?id=<shareId>
//
// shareId format accepted:
//   • "fsai-<timestamp>"  — our own shareId (we search by bin name)
//   • A raw JSONBin bin ID (24-char hex) — direct fetch
//
// Returns: { payload: object } or 404
// ═══════════════════════════════════════

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const MASTER_KEY = process.env.JSONBIN_MASTER_KEY;
  if (!MASTER_KEY) {
    return {
      statusCode: 503,
      headers: CORS,
      body: JSON.stringify({ error: 'JSONBIN_MASTER_KEY not configured on server' }),
    };
  }

  const shareId = event.queryStringParameters?.id;
  if (!shareId) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'id query param required' }) };
  }
  if (!/^[\w-]{1,64}$/.test(shareId)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid id format' }) };
  }

  try {
    // Strategy: search JSONBin bins by name "fsai-<shareId>"
    // JSONBin v3 supports searching bins by name via GET /v3/b?name=<name>
    const searchRes = await fetch(
      `https://api.jsonbin.io/v3/b?name=${encodeURIComponent(`fsai-${shareId}`)}`,
      { headers: { 'X-Master-Key': MASTER_KEY } }
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      // searchData is an array of bin summaries; pick the first match
      const bins = Array.isArray(searchData) ? searchData : (searchData.bins || []);
      const match = bins.find(b => b.name === `fsai-${shareId}` || b.snippetMeta?.name === `fsai-${shareId}`);

      if (match) {
        const binId = match.id || match.snippetMeta?.id;
        if (binId) {
          const binRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: { 'X-Master-Key': MASTER_KEY },
          });
          if (binRes.ok) {
            const binData = await binRes.json();
            const record = binData.record || binData;
            // Strip our internal shareId field before returning
            const { shareId: _sid, ...payload } = record;
            console.log(`[share-load] OK via search shareId=${shareId} binId=${binId}`);
            return {
              statusCode: 200,
              headers: { ...CORS, 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
              body: JSON.stringify({ payload }),
            };
          }
        }
      }
    }

    // Fallback: shareId might itself be a JSONBin bin ID (24-char hex)
    if (/^[0-9a-f]{24}$/.test(shareId)) {
      const directRes = await fetch(`https://api.jsonbin.io/v3/b/${shareId}/latest`, {
        headers: { 'X-Master-Key': MASTER_KEY },
      });
      if (directRes.ok) {
        const directData = await directRes.json();
        const record = directData.record || directData;
        const { shareId: _sid, ...payload } = record;
        console.log(`[share-load] OK via direct binId=${shareId}`);
        return {
          statusCode: 200,
          headers: { ...CORS, 'Cache-Control': 'public, max-age=3600' },
          body: JSON.stringify({ payload }),
        };
      }
    }

    console.log(`[share-load] NOT FOUND shareId=${shareId}`);
    return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Conversation not found' }) };

  } catch (err) {
    console.error('[share-load] error', err.message);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
