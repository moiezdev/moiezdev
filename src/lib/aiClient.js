const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

/** Primary DeepSeek, then Mistral fallback. Env can override the primary only. */
const DEFAULT_MODELS = ['deepseek/deepseek-chat', 'mistralai/mistral-7b-instruct'];
const envPrimary = import.meta.env.VITE_OPENROUTER_MODEL;
const MODELS = (
  envPrimary && !DEFAULT_MODELS.includes(envPrimary)
    ? [envPrimary, ...DEFAULT_MODELS]
    : DEFAULT_MODELS
).filter((model, index, list) => list.indexOf(model) === index);

const AI_FAIL_FALLBACK =
  "I couldn't answer that — you can explore [[nav:/works|All works]] or reach Moiez via [[nav:/contact|Contact page]].";

/**
 * OpenRouter chat completion with model fallback.
 * @param {{ role: string, content: string }[]} messages
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<string>}
 */
export async function callAI(messages, { signal } = {}) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('Missing VITE_OPENROUTER_API_KEY');
  }

  for (const model of MODELS) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        signal,
        headers: {
          Authorization: `Bearer ${String(OPENROUTER_API_KEY).trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer':
            typeof window !== 'undefined' ? window.location.origin : 'https://www.moiez.dev',
          'X-Title': 'BotFolio Portfolio Chat',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 120,
          temperature: 0.4,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.warn(`Model ${model} failed:`, res.status, errText);
        continue;
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content?.trim();
      if (content) return content;

      console.warn(`Model ${model} returned empty content`);
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
      console.warn(`Model ${model} failed, trying next...`, err);
    }
  }

  return AI_FAIL_FALLBACK;
}

export { AI_FAIL_FALLBACK, MODELS };
