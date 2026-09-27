import { projects } from '../data';
import { localizeProject, t } from '../i18n/content';

const pageDefaults = {
  '/': 'home',
  '/works': 'works',
  '/experience': 'experience',
  '/about': 'about',
  '/contact': 'contact',
};

/**
 * Up to three follow-up questions, based on the page the visitor is on and
 * the project the bot just talked about. Already-asked questions are skipped.
 */
export function suggestFollowUps({ path = '/', messages = [], lang = 'en' }) {
  const asked = new Set(messages.filter((m) => m.role === 'user').map((m) => m.text.trim().toLowerCase()));
  const lastBot = [...messages].reverse().find((m) => m.role === 'bot');
  const name = (id) => localizeProject(projects.find((p) => p.id === id), lang)?.title;
  let list = [];

  const viewingId = path.match(/^\/works\/([^/]+)/)?.[1];
  const mentionedId = (lastBot?.spans || [])
    .map((s) => s.to?.match(/^\/works\/([^/]+)$/)?.[1])
    .find((id) => id && id !== viewingId);

  if (mentionedId && lastBot?.id !== 'welcome') {
    const n = name(mentionedId);
    list = [t(lang, 'chat.sugg.moreAbout', { name: n }), t(lang, 'chat.sugg.stackOf', { name: n })];
  }
  if (viewingId && name(viewingId)) {
    list = [...list, t(lang, 'chat.sugg.thisStack'), t(lang, 'chat.sugg.thisImpact'), t(lang, 'chat.sugg.similar')];
  }
  const page = pageDefaults[path];
  if (page) list = [...list, ...(t(lang, `chat.sugg.${page}`) || [])];
  list = [...list, t(lang, 'chat.sugg.hire')];

  return [...new Set(list.filter(Boolean))].filter((q) => !asked.has(q.toLowerCase())).slice(0, 3);
}
