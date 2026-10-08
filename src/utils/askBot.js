import { handleChat } from '../lib/chatHandler';
import { AI_FAIL_FALLBACK, ChatApiError } from '../lib/aiClient';
import { prepareBotReply } from './chatNav';
import { t } from '../i18n/content';

const OFFLINE = {
  en: {
    ai: "This chat is BotFolio — Moieez's OpenRouter (DeepSeek) portfolio guide. He also integrated the same stack into [[nav:/works/twlm-pos|TWLM - POS]] for smart menu search and restaurant-data analysis.",
    projects: 'Standouts include [[nav:/works/twlm-pos|TWLM - POS]] (~70% fewer support requests, ~64% faster APIs) and [[nav:/works/aa-tourism|AATourism]]. Want more on [[nav:/works|All works]]?',
    experience: 'Moieez has shipped product at TWLM, ACCIONA, SCM Borba and Creative Inter Tech — POS and payments, internal tools, SaaS and B2B travel platforms. See the full timeline on [[nav:/experience|Experience]].',
    stack: 'Moieez focuses on scalable SaaS and retail systems — React, Vue, Next.js, Node.js, NestJS — plus payments, wallets, booking engines, and OpenRouter AI. See [[nav:/about|About Moieez]] or real examples on [[nav:/works|All works]].',
    hire: "Moieez is a Senior Full Stack Engineer (Node.js/NestJS, React/Next.js, PostgreSQL, LLM integrations) who owns features end to end — ~70% fewer support requests and ~64% lower API latency at TWLM. He's in Riyadh with a transferable Iqama and available immediately. Grab his [[nav:/cv|CV]] or reach him on WhatsApp +966 573240913.",
    client: "Moieez takes on product builds and integrations — web apps and SaaS, POS and payments (MyFatoorah, Moyasar), booking engines, e-commerce, dashboards and AI features. Share what you're building, the must-haves and your timeline on the [[nav:/contact|Contact page]] or WhatsApp +966 573240913; he replies within 24 hours.",
    contact: 'Reach Moieez at moiezdev@gmail.com or +966 573240913 — or use [[nav:/contact|Contact page]].',
    other: "I can tell you about Moieez's work — his best projects on [[nav:/works|All works]], his [[nav:/experience|Experience]], or how to hire him or start a project via the [[nav:/contact|Contact page]].",
  },
  ar: {
    ai: 'هذه المحادثة هي BotFolio — دليل معيز المبني على OpenRouter (DeepSeek). ودمج معيز التقنية نفسها في [[nav:/works/twlm-pos|TWLM - POS]] للبحث الذكي في القوائم وتحليل البيانات.',
    projects: 'من أبرز أعماله [[nav:/works/twlm-pos|TWLM - POS]] (خفض طلبات الدعم بنحو ٧٠٪ وتسريع الواجهات بنحو ٦٤٪) و[[nav:/works/aa-tourism|AATourism]]. المزيد في [[nav:/works|كل الأعمال]].',
    experience: 'عمل معيز على منتجات في TWLM وACCIONA وSCM Borba وCreative Inter Tech — نقاط البيع والمدفوعات والأدوات الداخلية والبرمجيات كخدمة ومنصات السفر. الخط الزمني الكامل في [[nav:/experience|الخبرة]].',
    stack: 'يركز معيز على أنظمة التجزئة والبرمجيات كخدمة القابلة للتوسع — React وVue وNext.js وNode.js وNestJS — إضافة إلى المدفوعات والمحافظ وأنظمة الحجز وOpenRouter AI. اطلع على [[nav:/about|نبذة عن معيز]] أو [[nav:/works|كل الأعمال]].',
    hire: 'معيز مهندس برمجيات متكامل أول (Node.js/NestJS وReact/Next.js وPostgreSQL وتكامل النماذج اللغوية) يتولى الميزات من البداية للنهاية — خفّض طلبات الدعم بنحو ٧٠٪ وزمن استجابة الواجهات بنحو ٦٤٪ في TWLM. مقيم في الرياض بإقامة قابلة للنقل ومتاح فوراً. سيرته في [[nav:/cv|CV]] أو واتساب ‎+966 573240913.',
    client: 'يبني معيز المنتجات والتكاملات — تطبيقات الويب والبرمجيات كخدمة، ونقاط البيع والمدفوعات (MyFatoorah وMoyasar)، ومحركات الحجز، والتجارة الإلكترونية، ولوحات التحكم، وميزات الذكاء الاصطناعي. شاركه فكرتك وأهم الميزات والجدول الزمني عبر [[nav:/contact|صفحة التواصل]] أو واتساب ‎+966 573240913، ويرد خلال ٢٤ ساعة.',
    contact: 'تواصل مع معيز عبر moiezdev@gmail.com أو ‎+966 573240913 — أو من [[nav:/contact|صفحة التواصل]].',
    other: 'أستطيع إخبارك عن عمل معيز — أبرز مشاريعه في [[nav:/works|كل الأعمال]]، و[[nav:/experience|خبرته]]، وكيف توظفه أو تبدأ مشروعاً معه عبر [[nav:/contact|صفحة التواصل]].',
  },
};

const SMALL_TALK = {
  en: {
    greet: "Hi! Good to have you here. Ask me anything about Moieez — for example his [[nav:/works/twlm-pos|TWLM - POS]] platform, his tech stack, or whether he's open to new roles.",
    thanks: 'Anytime. If you want to talk to Moieez directly, the [[nav:/contact|Contact page]] is the fastest way.',
    bye: 'Thanks for stopping by. You can reach Moieez any time via the [[nav:/contact|Contact page]].',
  },
  ar: {
    greet: 'أهلاً بك! اسألني أي شيء عن معيز — مثل منصة [[nav:/works/twlm-pos|TWLM - POS]]، أو التقنيات التي يستخدمها، أو إن كان متاحاً لأدوار جديدة.',
    thanks: 'على الرحب. إن أردت التحدث مع معيز مباشرة، فـ[[nav:/contact|صفحة التواصل]] أسرع طريقة.',
    bye: 'شكراً لزيارتك. يمكنك التواصل مع معيز في أي وقت عبر [[nav:/contact|صفحة التواصل]].',
  },
};

/**
 * Pure greetings / thanks / goodbyes get an instant local reply — no API call,
 * and no sales pitch in answer to "hi".
 */
export function smallTalk(question = '', lang = 'en') {
  const q = question
    .toLowerCase()
    .replace(/[!.,?؟،\s]+/g, ' ')
    .trim();
  if (!q || q.split(' ').length > 4) return null;
  const r = SMALL_TALK[lang === 'ar' ? 'ar' : 'en'];
  if (/^(hi+|hey+|hello+|hiya|yo|sup|howdy|good (morning|afternoon|evening)|salam|assalam[ou] ?alaikum|مرحبا|مرحباً|السلام عليكم|سلام|اهلا|أهلا|هلا)( there| bot| botfolio)?$/.test(q)) return r.greet;
  if (/^(thanks?|thank you( so much)?|thx|ty|cheers|great thanks|ok thanks|شكرا|شكراً|مشكور)$/.test(q)) return r.thanks;
  if (/^(bye|goodbye|see you|see ya|later|مع السلامة|وداعا|وداعاً)$/.test(q)) return r.bye;
  return null;
}

/** Offline / missing-key replies — portfolio guide tone + inline nav. */
function localFallback(question = '', lang = 'en') {
  const q = question.toLowerCase().trim();
  const r = OFFLINE[lang === 'ar' ? 'ar' : 'en'];

  if (/\bai\b|chatbot|botfolio|openrouter|deepseek|agent|ذكاء/.test(q)) return prepareBotReply(r.ai);
  if (/hire|hiring|recruit|role|position|available|availability|iqama|visa|open to|cv|resume|pitch|توظيف|توظ|أوظ|نوظ|وظيفة|متاح|إقامة|سيرة/.test(q)) return prepareBotReply(r.hire);
  if (/client|my (app|business|startup|company)|build (me|an?|my)|quote|proposal|freelance|contract|i have a project|i need|مشروعي|عندي مشروع|لدي مشروع|لديّ مشروع|كيف نبدأ|أحتاج|تطبيق|عرض سعر|يبني لي|بناء شيء/.test(q)) return prepareBotReply(r.client);
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
  const quick = smallTalk(question, lang);
  if (quick) {
    await new Promise((r) => setTimeout(r, 350)); // brief "thinking" beat so it doesn't feel canned
    return prepareBotReply(quick);
  }
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
    // AI provider down or slow (502 etc.): still answer from the built-in replies
    // rather than a dead end
    console.warn('askBot failed:', err);
    return localFallback(question, lang);
  }
}
