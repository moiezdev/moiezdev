import { handleChat } from '../lib/chatHandler';
import { AI_FAIL_FALLBACK, ChatApiError } from '../lib/aiClient';
import { prepareBotReply } from './chatNav';
import { t } from '../i18n/content';

const OFFLINE = {
  en: {
    ai: "This chat is BotFolio — Moiz's OpenRouter (DeepSeek) portfolio guide. He also integrated the same stack into [[nav:/works/twlm-pos|TWLM - POS]] for smart menu search and restaurant-data analysis.",
    projects: 'Standouts include [[nav:/works/twlm-pos|TWLM - POS]] (~70% fewer support requests, ~64% faster APIs) and [[nav:/works/aa-tourism|AATourism]]. Want more on [[nav:/works|All works]]?',
    experience: 'Moiz has shipped product across TWLM, Accoina Agua, SCM Borba, and Creative Inter Tech. See the full timeline on [[nav:/experience|Experience]].',
    stack: 'Moiz focuses on scalable SaaS and retail systems — React, Vue, Next.js, Node.js, NestJS — plus payments, wallets, booking engines, and OpenRouter AI. See [[nav:/about|About Moiz]] or real examples on [[nav:/works|All works]].',
    hire: "Moiz is open to senior full stack roles. He's based in Riyadh with a valid transferable Iqama. See his [[nav:/cv|CV]] or reach him via the [[nav:/contact|Contact page]].",
    contact: 'Reach Moiz at moiezdev@gmail.com or +966 573240913 — or use [[nav:/contact|Contact page]].',
    other: "I stay focused on Moiz's work. Want a quick overview on [[nav:/about|About Moiz]], his [[nav:/experience|Experience]], or real project examples on [[nav:/works|All works]]?",
  },
  ar: {
    ai: 'هذه المحادثة هي BotFolio — دليل معيز المبني على OpenRouter (DeepSeek). ودمج معيز التقنية نفسها في [[nav:/works/twlm-pos|TWLM - POS]] للبحث الذكي في القوائم وتحليل البيانات.',
    projects: 'من أبرز أعماله [[nav:/works/twlm-pos|TWLM - POS]] (خفض طلبات الدعم بنحو ٧٠٪ وتسريع الواجهات بنحو ٦٤٪) و[[nav:/works/aa-tourism|AATourism]]. المزيد في [[nav:/works|كل الأعمال]].',
    experience: 'عمل معيز على منتجات في TWLM وAccoina Agua وSCM Borba وCreative Inter Tech. الخط الزمني الكامل في [[nav:/experience|الخبرة]].',
    stack: 'يركز معيز على أنظمة التجزئة والبرمجيات كخدمة القابلة للتوسع — React وVue وNext.js وNode.js وNestJS — إضافة إلى المدفوعات والمحافظ وأنظمة الحجز وOpenRouter AI. اطلع على [[nav:/about|نبذة عن معيز]] أو [[nav:/works|كل الأعمال]].',
    hire: 'معيز متاح لأدوار التطوير المتكامل الأولى، مقيم في الرياض بإقامة سارية قابلة للنقل. سيرته في [[nav:/cv|CV]]، أو تواصل عبر [[nav:/contact|صفحة التواصل]].',
    contact: 'تواصل مع معيز عبر moiezdev@gmail.com أو ‎+966 573240913 — أو من [[nav:/contact|صفحة التواصل]].',
    other: 'أركز على عمل معيز. هل تريد لمحة سريعة في [[nav:/about|نبذة عن معيز]] أو [[nav:/experience|الخبرة]] أو أمثلة في [[nav:/works|كل الأعمال]]؟',
  },
};

/** Offline / missing-key replies — portfolio guide tone + inline nav. */
function localFallback(question = '', lang = 'en') {
  const q = question.toLowerCase().trim();
  const r = OFFLINE[lang === 'ar' ? 'ar' : 'en'];

  if (/^(hi|hey|hello|yo|sup|مرحبا|السلام|اهلا|أهلا)/.test(q)) return prepareBotReply(t(lang, 'chat.welcome'));
  if (/\bai\b|chatbot|botfolio|openrouter|deepseek|agent|ذكاء/.test(q)) return prepareBotReply(r.ai);
  if (/hire|available|availability|iqama|visa|open to|cv|resume|توظيف|متاح|إقامة|سيرة/.test(q)) return prepareBotReply(r.hire);
  if (/project|work|built|portfolio|show|مشروع|مشاريع|أعمال/.test(q)) return prepareBotReply(r.projects);
  if (/experience|career|job|role|worked|خبرة|عمل/.test(q)) return prepareBotReply(r.experience);
  if (/stack|tech|skill|approach|build|design|strength|why|good at|تقني|مهار/.test(q)) return prepareBotReply(r.stack);
  if (/contact|email|reach|phone|linkedin|github|تواصل|بريد|هاتف/.test(q)) return prepareBotReply(r.contact);
  return prepareBotReply(r.other);
}

/**
 * Public chatbot entry — server-side AI via /api/chat, local fallbacks otherwise.
 * @returns {Promise<{ text: string, spans: object[] }>}
 */
export async function askBot(question, { signal, history = [], lang = 'en', path = '/' } = {}) {
  try {
    const raw = await handleChat(question, { signal, history, lang, path });
    const prepared = prepareBotReply(raw);
    return prepared.text ? prepared : prepareBotReply(t(lang, 'chat.fail') || AI_FAIL_FALLBACK);
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    // No key configured, API route missing (e.g. static hosting) or offline:
    // answer from the built-in replies instead of failing.
    if (!(err instanceof ChatApiError) || err.status === 503 || err.status === 404) {
      return localFallback(question, lang);
    }
    if (err.status === 429) return prepareBotReply(t(lang, 'chat.rateLimited'));
    console.warn('askBot failed:', err);
    return prepareBotReply(t(lang, 'chat.fail') || AI_FAIL_FALLBACK);
  }
}
