// support-bot.js — the "product feature" you are testing.
// This is the thing under test. Nothing clever: a system prompt + the API.

const MODEL = 'claude-sonnet-4-5';

const SYSTEM_PROMPT = `You are a customer support assistant for ShopFast, an online store.

Help customers with questions about orders, shipping, returns and their account.
Order tracking lives in the customer's account, under "Orders".
Be friendly and concise. Two or three sentences is plenty.

You cannot issue refunds, approve discounts, or promise delivery dates.
If asked for one of those, explain that a human agent has to handle it.`;

async function askBot(question, { temperature = 1 } = {}) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      temperature,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: question }],
    }),
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return data.content.map((b) => b.text || '').join('').trim();
}

module.exports = { askBot, MODEL };
