const MISTRAL_API_KEY ='wPUkMMGL2Ss5mijhtULdr46o4HJQcpi9';
const MISTRAL_AGENT_ID = 'ag_019d4cb0e3ad7269b8e189224bddfb9a';
const MISTRAL_AGENT_VERSION = 3;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { messages } = JSON.parse(event.body);
    const lastMsg = messages[messages.length - 1];
    const userInput = typeof lastMsg.content === 'string'
      ? lastMsg.content
      : JSON.stringify(lastMsg.content);

    const response = await fetch('https://api.mistral.ai/v1/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        agent_id: MISTRAL_AGENT_ID,
        agent_version: MISTRAL_AGENT_VERSION,
        inputs: [{ role: 'user', content: userInput }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data?.message || 'Mistral error' }),
      };
    }

    const outputs = data.outputs || data.messages || [];
    let replyText = '';
    for (const out of outputs) {
      if (out.role === 'assistant') {
        replyText = typeof out.content === 'string'
          ? out.content
          : out.content.map(c => c.text || '').join('');
        break;
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: [{ type: 'text', text: replyText || JSON.stringify(data) }],
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};