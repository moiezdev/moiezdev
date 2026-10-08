/**
 * Lets any page open the BotFolio chat. The chat is lazy-loaded once the page is
 * idle, so a request made before it mounts is remembered and honoured on mount.
 */
export const BOTFOLIO_OPEN_EVENT = 'botfolio:open';

let pending = false;

export function openBotfolio() {
  pending = true;
  window.dispatchEvent(new Event(BOTFOLIO_OPEN_EVENT));
}

/** True (once) if an open was requested and not yet handled. */
export function takeBotfolioRequest() {
  const was = pending;
  pending = false;
  return was;
}
