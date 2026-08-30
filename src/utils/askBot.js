import { handleChat } from '../lib/chatHandler';
import { AI_FAIL_FALLBACK } from '../lib/aiClient';
import { prepareBotReply } from './chatNav';
import { t } from '../i18n/content';

/** Offline / missing-key replies — portfolio guide tone + inline nav. */
function localFallback(question = '', lang = 'en') {
  const q = question.toLowerCase().trim();

  if (/^(hi|hey|hello|yo|sup|مرحبا|السلام)\b/.test(q)) {
    return prepareBotReply(t(lang, 'chat.welcome'));
  }

  if (/project|work|built|portfolio|show/.test(q)) {
    return prepareBotReply(
      `Standouts include [[nav:/works/twlm-pos|TWLM - POS]] (~70% fewer support requests, ~64% faster APIs) and [[nav:/works/aa-tourism|AATourism]]. Want more on [[nav:/works|All works]]?`,
    );
  }

  if (/experience|career|job|role|worked|resume|cv/.test(q)) {
    return prepareBotReply(
      `Moiz has shipped product across TWLM, Accoina Agua, SCM Borba, and Creative Inter Tech. See the full timeline on [[nav:/experience|Experience]].`,
    );
  }

  if (/stack|tech|skill|approach|build|design|strength|hire|why|good at/.test(q)) {
    return prepareBotReply(
      `Moiz focuses on scalable SaaS and retail systems — React, Vue, Next.js, Node.js, NestJS — with end-to-end ownership. See [[nav:/about|About Moiz]] or real examples on [[nav:/works|All works]].`,
    );
  }

  if (/contact|email|reach|phone|linkedin|github/.test(q)) {
    return prepareBotReply(
      `Reach Moiz at moiezdev@gmail.com or +966 573240913 — or use [[nav:/contact|Contact page]].`,
    );
  }

  return prepareBotReply(
    `I stay focused on Moiz's work. Want a quick overview on [[nav:/about|About Moiz]], his [[nav:/experience|Experience]], or real project examples on [[nav:/works|All works]]?`,
  );
}

/**
 * Public chatbot entry — new AI pipeline + nav sanitization.
 * @returns {Promise<{ text: string, spans: object[] }>}
 */
export async function askBot(question, { signal, history = [], lang = 'en' } = {}) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const fail = t(lang, 'chat.fail') || AI_FAIL_FALLBACK;

  if (!apiKey) {
    await new Promise((r) => setTimeout(r, 300));
    return localFallback(question, lang);
  }

  try {
    const raw = await handleChat(question, { signal, history, lang });
    const prepared = prepareBotReply(raw);
    if (!prepared.text) return prepareBotReply(fail);
    return prepared;
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    console.warn('askBot failed:', err);
    return prepareBotReply(fail);
  }
}
