/**
 * Lets any page open the BotFolio chat, optionally with a question to ask. The
 * chat is lazy-loaded once the page is idle, so a request made before it mounts
 * is remembered and honoured on mount.
 */
export const BOTFOLIO_OPEN_EVENT = 'botfolio:open';

let pending = null; // null | { question?: string }

export function openBotfolio(question) {
  pending = { question: typeof question === 'string' && question.trim() ? question.trim() : undefined };
  window.dispatchEvent(new Event(BOTFOLIO_OPEN_EVENT));
}

/** The pending request ({ question? }) once, or null if none. */
export function takeBotfolioRequest() {
  const was = pending;
  pending = null;
  return was;
}
