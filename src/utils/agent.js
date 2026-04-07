// ═══════════════════════════════════════
// FSAI – Agent API Utility
// Calls /api/chat → Express → Mistral AI Agent
// ═══════════════════════════════════════

// Conversation session ID (unique per browser tab)
let sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2);

// ── Main API Call ──────────────────────────────────────────────
// messages = [{role:'user'|'assistant', content: string}]
export async function callFSAI(messages) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      conversationId: sessionId,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || 'Server error ' + response.status
    );
  }

  const data = await response.json();

  // Extract text from Anthropic-compatible response format
  const text = (data.content || [])
    .map(b => b.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Empty response from agent');
  }

  return text;
}

// Reset session (called when user clears chat)
export function resetSession() {
  sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2);
}
