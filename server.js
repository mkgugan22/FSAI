// ═══════════════════════════════════════
// FSAI – Express Proxy Server
// Powered by Mistral AI Agent
// Run: node server.js
// ═══════════════════════════════════════

const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

// Node 18+ has global fetch. For older versions, try node-fetch with both CommonJS and ESM compatibility.
let fetch = global.fetch;
if (!fetch) {
  try {
    const nodeFetch = require('node-fetch');
    fetch = nodeFetch?.default || nodeFetch;
  } catch (err) {
    console.warn('[FSAI] require("node-fetch") failed; using a lazy dynamic import fallback.');
    fetch = async (...args) => {
      const nodeFetch = (await import('node-fetch')).default;
      return nodeFetch(...args);
    };
  }
}

if (!fetch) {
  throw new Error('No fetch implementation available; install node-fetch or run on Node 18+');
}

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Mistral Agent Config ──────────────────────────────────────
const MISTRAL_API_KEY = 'wPUkMMGL2Ss5mijhtULdr46o4HJQcpi9';
const MISTRAL_AGENT_ID      = 'ag_019d4cb0e3ad7269b8e189224bddfb9a';
const MISTRAL_AGENT_VERSION = 3; // Updated to version 3 with enhanced instructions (text-based inputs only)
const MISTRAL_CONV_URL      = 'https://api.mistral.ai/v1/conversations';

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// ── In-memory conversation store ─────────────────────────────
// Maps conversationId → Mistral conversation_id
const convStore = new Map();

// ── POST /api/chat ────────────────────────────────────────────
// Body: { messages: [{role, content}], conversationId? }
// Returns: { reply: string }
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, conversationId } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: { message: 'messages array is required' } });
    }

    // Get the latest user message
    const lastMsg = messages[messages.length - 1];
    const userInput = typeof lastMsg.content === 'string'
      ? lastMsg.content
      : JSON.stringify(lastMsg.content);

    const mistralConvId = conversationId ? convStore.get(conversationId) : null;

    let response, data;

    // Always start new conversation to avoid 405 errors with continuation
    response = await fetch(MISTRAL_CONV_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        agent_id:      MISTRAL_AGENT_ID,
        agent_version: MISTRAL_AGENT_VERSION,
        inputs: [{ role: 'user', content: userInput }],
      }),
    });

    data = await response.json();

    if (!response.ok) {
      console.error('[FSAI] Mistral error:', JSON.stringify(data));
      return res.status(response.status).json({
        error: { message: data?.message || data?.detail || `Mistral error ${response.status}` },
      });
    }

    // ── Extract reply text ──
    // Mistral returns outputs array with message objects
    const outputs = data.outputs || data.messages || [];
    let replyText = '';

    for (const out of outputs) {
      if (out.role === 'assistant' || out.type === 'message.output') {
        const content = out.content;
        if (typeof content === 'string') {
          replyText = content;
          break;
        } else if (Array.isArray(content)) {
          replyText = content.map(c => c.text || c.content || '').join('');
          break;
        }
      }
    }

    // Fallback: check top-level text fields
    if (!replyText) {
      replyText = data.content || data.text || data.response || JSON.stringify(data);
    }

    // Save conversation ID for follow-up turns
    const newConvId = data.id || data.conversation_id;
    if (newConvId && conversationId) {
      convStore.set(conversationId, newConvId);
    }

    // Return in Anthropic-compatible format so the React app works unchanged
    res.json({
      content: [{ type: 'text', text: replyText }],
      mistral_conv_id: newConvId,
    });

  } catch (err) {
    console.error('[FSAI Server] Error:', err.message);
    res.status(500).json({ error: { message: err.message } });
  }
});

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    agent: 'FSAI',
    provider: 'Mistral AI',
    agentId: MISTRAL_AGENT_ID,
    version: '1.0.0',
  });
});

// ── Serve React build in production ───────────────────────────
const buildPath = path.join(__dirname, 'build');
const indexHtml = path.join(buildPath, 'index.html');

if (fs.existsSync(indexHtml)) {
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    res.sendFile(indexHtml);
  });
} else {
  app.get('*', (req, res) => {
    res.status(404).send(
      'Build files not found. Run "npm run build" to build the frontend before starting in production, or use "npm run dev" and open http://localhost:3000.'
    );
  });
}

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║      FSAI Server running on :' + PORT + '         ║');
  console.log('  ║      Provider  → Mistral AI              ║');
  console.log('  ║      Agent ID  → ag_019d4cb0e3ad...      ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
  console.log('  Frontend : http://localhost:3000  (npm start)');
  console.log('  Server   : http://localhost:' + PORT);
  console.log('  Health   : http://localhost:' + PORT + '/health');
  console.log('');
  if (MISTRAL_API_KEY === 'YOUR_MISTRAL_API_KEY_HERE') {
    console.log('  ⚠  WARNING: Set your MISTRAL_API_KEY!');
    console.log('  Run: set MISTRAL_API_KEY=your_key_here  (Windows)');
    console.log('  Run: export MISTRAL_API_KEY=your_key_here  (Mac/Linux)');
    console.log('');
  }
});
