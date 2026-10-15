/**
 * Browser side of BotFolio: talks to our own /api/chat function, which holds
 * the OpenRouter key server-side.
 */
const AI_FAIL_FALLBACK =
  "Sorry, I got a bit stuck on that one. Mind trying again in a moment? Or you can reach Moieez directly on the [[nav:/contact|Contact page]].";

export class ChatApiError extends Error {
  constructor(status, code) {
    super(`chat api ${status} ${code}`);
    this.status = status;
    this.code = code;
  }
}

/**
 * @param {{ question: string, history: {role: string, content: string}[], context: object, lang: string }} payload
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<string>}
 */
export async function requestReply(payload, { signal } = {}) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.reply) throw new ChatApiError(res.status, data.error || 'bad_response');
  return data.reply;
}

export { AI_FAIL_FALLBACK };
