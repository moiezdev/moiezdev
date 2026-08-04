import { handleChat } from '../lib/chatHandler';
import { AI_FAIL_FALLBACK } from '../lib/aiClient';
import { prepareBotReply } from './chatNav';
import { BOT_NAME, getProfileExperienceYears } from './buildPortfolioContext';

const years = getProfileExperienceYears();

/** Offline / missing-key replies — short + inline nav. */
function localFallback(question = '') {
  const q = question.toLowerCase().trim();

  if (/^(hi|hey|hello|yo|sup)\b/.test(q)) {
    return prepareBotReply(
      `Hey — I'm ${BOT_NAME}. Moiz is a product-focused Full Stack Engineer (~${years} years). Ask about [[nav:/works|All works]], [[nav:/about|About Moiz]], or [[nav:/contact|Contact page]].`,
    );
  }

  if (/project|work|built|portfolio|show/.test(q)) {
    return prepareBotReply(
      `Standouts include [[nav:/works/twlm-pos|TWLM - POS]] (~70% fewer support requests, ~64% faster APIs), [[nav:/works/aa-tourism|AATourism]], and more on [[nav:/works|All works]].`,
    );
  }

  if (/hire|why|strength|skill|good at/.test(q)) {
    return prepareBotReply(
      `Moiz owns product-focused fullstack delivery end-to-end — React, Vue, Node.js — with measurable impact like ~70% fewer support tickets on [[nav:/works/twlm-pos|TWLM - POS]]. See [[nav:/about|About Moiz]].`,
    );
  }

  if (/contact|email|reach|phone|linkedin|github/.test(q)) {
    return prepareBotReply(
      `Reach Moiz at moiezdev@gmail.com or +966 573240913 — or use [[nav:/contact|Contact page]].`,
    );
  }

  return prepareBotReply(AI_FAIL_FALLBACK);
}

/**
 * Public chatbot entry — new AI pipeline + nav sanitization.
 * @returns {Promise<{ text: string, spans: object[] }>}
 */
export async function askBot(question, { signal, history = [] } = {}) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    await new Promise((r) => setTimeout(r, 300));
    return localFallback(question);
  }

  try {
    const raw = await handleChat(question, { signal, history });
    const prepared = prepareBotReply(raw);
    if (!prepared.text) return prepareBotReply(AI_FAIL_FALLBACK);
    return prepared;
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    console.warn('askBot failed:', err);
    return prepareBotReply(AI_FAIL_FALLBACK);
  }
}
