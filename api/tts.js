/**
 * BotFolio voice (Vercel serverless function).
 *
 * Turns a reply into speech with one natural neural voice, the same on every
 * device and for both languages, via Azure AI Speech. Its free tier (F0)
 * covers 500,000 characters a month, far more than a portfolio uses.
 *
 * Env: AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (e.g. "eastus");
 * optional AZURE_SPEECH_VOICE. Without a key it answers 503 and the browser
 * falls back to the device's own voice (src/utils/speech.js).
 */

// A multilingual neural voice: one warm, natural male voice that speaks
// English and Arabic, so BotFolio never switches voices between languages.
const DEFAULT_VOICE = 'en-US-AndrewMultilingualNeural';
const LOCALES = { en: 'en-US', ar: 'ar-SA' };

// one reply chunk; the client splits longer replies
const MAX_TEXT = 1200;

// Best-effort per-instance limits: 40 chunks per IP per 5 minutes.
const WINDOW_MS = 5 * 60 * 1000;
const LIMIT = 40;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > LIMIT;
}

// Same text, same audio: canned answers and repeat questions cost no quota.
const cache = new Map();
const CACHE_MAX = 60;

function remember(key, audio) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(key, audio);
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function sendAudio(res, audio) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Length', String(audio.length));
  res.setHeader('Cache-Control', 'no-store');
  res.end(audio);
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

const escapeXml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** SSML for one chunk: the multilingual voice reads it with a native accent for `lang`. */
export function buildSsml(text, lang, voice = DEFAULT_VOICE) {
  const locale = LOCALES[lang] || LOCALES.en;
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${locale}">` +
    `<voice name="${escapeXml(voice)}"><lang xml:lang="${locale}">${escapeXml(text)}</lang></voice>` +
    `</speak>`
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method_not_allowed' });

  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) return sendJson(res, 503, { error: 'not_configured' });

  const ip =
    String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  if (rateLimited(ip)) return sendJson(res, 429, { error: 'rate_limited' });

  let body;
  try {
    body = await readBody(req);
  } catch {
    return sendJson(res, 400, { error: 'bad_json' });
  }

  const text = String(body.text ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return sendJson(res, 400, { error: 'empty_text' });
  if (text.length > MAX_TEXT) return sendJson(res, 413, { error: 'too_long' });
  const lang = body.lang === 'ar' ? 'ar' : 'en';
  const voice = process.env.AZURE_SPEECH_VOICE || DEFAULT_VOICE;

  const cacheKey = `${voice}|${lang}|${text}`;
  const hit = cache.get(cacheKey);
  if (hit) return sendAudio(res, hit);

  try {
    const r = await fetch(`https://${region.trim()}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key.trim(),
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'moiez.dev-botfolio',
      },
      body: buildSsml(text, lang, voice),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) {
      // 429 = free quota or rate exhausted, 401 = bad key: the client falls back to the device voice
      console.warn('Azure TTS failed:', r.status, await r.text().catch(() => ''));
      return sendJson(res, r.status === 429 ? 429 : 502, { error: 'upstream_failed' });
    }
    const audio = Buffer.from(await r.arrayBuffer());
    if (!audio.length) return sendJson(res, 502, { error: 'empty_audio' });
    remember(cacheKey, audio);
    return sendAudio(res, audio);
  } catch (err) {
    console.warn('Azure TTS error:', err);
    return sendJson(res, 502, { error: 'upstream_failed' });
  }
}
