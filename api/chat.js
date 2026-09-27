/**
 * BotFolio chat endpoint (Vercel serverless function).
 *
 * Keeps the OpenRouter key on the server. The browser sends the visitor's
 * question, recent history and the portfolio context; this function owns the
 * system prompt, model list and token limits so the endpoint can't be used as
 * a general-purpose LLM proxy.
 */
import { SYSTEM_PROMPT } from '../src/lib/systemPrompt.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODELS = ['deepseek/deepseek-chat', 'mistralai/mistral-7b-instruct'];

const MAX_QUESTION = 600;
const MAX_HISTORY = 8;
const MAX_HISTORY_ITEM = 700;
const MAX_CONTEXT = 16000;

// Best-effort per-instance rate limit: 20 requests per IP per 5 minutes.
const WINDOW_MS = 5 * 60 * 1000;
const LIMIT = 20;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > LIMIT;
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

const clip = (s, n) => String(s ?? '').slice(0, n);

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) return send(res, 503, { error: 'not_configured' });

  const ip =
    String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  if (rateLimited(ip)) return send(res, 429, { error: 'rate_limited' });

  let body;
  try {
    body = await readBody(req);
  } catch {
    return send(res, 400, { error: 'bad_json' });
  }

  const question = clip(body.question, MAX_QUESTION).trim();
  if (!question) return send(res, 400, { error: 'empty_question' });

  const lang = body.lang === 'ar' ? 'ar' : 'en';
  // reject rather than cut: a clipped JSON fact sheet would mislead the model
  const context = JSON.stringify(body.context ?? {});
  if (context.length > MAX_CONTEXT) return send(res, 413, { error: 'context_too_large' });
  const history = (Array.isArray(body.history) ? body.history : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: clip(m.content, MAX_HISTORY_ITEM) }));

  const system =
    lang === 'ar'
      ? `${SYSTEM_PROMPT}\n\nThe site language is Arabic. Reply in Arabic unless the visitor writes in another language.`
      : SYSTEM_PROMPT;

  const messages = [
    { role: 'system', content: `${system}\n\nCONTEXT (the only source of facts):\n${context}` },
    ...history,
    { role: 'user', content: question },
  ];

  const envPrimary = process.env.OPENROUTER_MODEL || process.env.VITE_OPENROUTER_MODEL;
  const models = [...new Set([envPrimary, ...DEFAULT_MODELS].filter(Boolean))];

  for (const model of models) {
    try {
      const r = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${String(apiKey).trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://www.moiez.dev',
          'X-Title': 'BotFolio Portfolio Chat',
        },
        body: JSON.stringify({ model, messages, max_tokens: 380, temperature: 0.4 }),
      });
      if (!r.ok) {
        console.warn(`Model ${model} failed:`, r.status, await r.text().catch(() => ''));
        continue;
      }
      const data = await r.json();
      const choice = data?.choices?.[0];
      const reply = choice?.message?.content?.trim();
      if (reply) return send(res, 200, { reply, truncated: choice.finish_reason === 'length' });
    } catch (err) {
      console.warn(`Model ${model} error:`, err);
    }
  }

  return send(res, 502, { error: 'upstream_failed' });
}
