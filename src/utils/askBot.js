import { chatbot, contacts, projects, skills } from '../data';
import { BOT_NAME, PORTFOLIO_CONTEXT, SYSTEM_PROMPT, getProfileExperienceYears } from './buildPortfolioContext';
import { extractNavMarkers, mergeNavLinks, resolveChatNav, SITE_NAV } from './chatNav';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Auto-picks among currently available free models (specific :free slugs rotate often)
const DEFAULT_MODEL = 'openrouter/free';

const LOW_PRIORITY_IDS = new Set(chatbot.lowPriorityProjectIds || []);

const coreSkills =
  skills.find((c) => c.category === 'Core Skills')?.items?.join(', ') ||
  'product ownership, feature ownership, end-to-end delivery, UI/UX management';

const identityLine =
  chatbot.profile?.headline ||
  'Product-Focused Full Stack Software Engineer | React, Vue, Node.js';

const years = getProfileExperienceYears();

const featuredProject = projects.find((p) => p.id === 'twlm-pos') || projects[0];

const contactSummary = contacts
  .map((c) => `${c.platform}: ${c.handle}`)
  .slice(0, 4)
  .join('; ');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Avoid immediate repeats of the same canned line. */
const recentReplies = [];
function pickFresh(options) {
  const unused = options.filter((o) => !recentReplies.includes(o));
  const pool = unused.length ? unused : options;
  const chosen = pick(pool);
  recentReplies.push(chosen);
  if (recentReplies.length > 6) recentReplies.shift();
  return chosen;
}

function pack(text, links = [], question = '') {
  return {
    text,
    links: mergeNavLinks(question, links, resolveChatNav(question, text)),
  };
}

/**
 * Offline / no-key replies — assistant tone + navigation chips.
 */
function localFallback(question) {
  const q = question.toLowerCase().trim();

  if (/^(hi|hey|hello|yo|sup|good (morning|afternoon|evening))\b/.test(q)) {
    return pack(
      pickFresh([
        `Hello — I'm ${BOT_NAME}, Moiz's assistant. Moiz is a ${identityLine} with ~${years} years of experience. Core strengths: ${coreSkills}. What would you like to know — background, skills, projects, or how to reach him?`,
        `Welcome. Moiz is a product-focused Full Stack Engineer — React, Vue, Node.js across the stack, plus product ownership. Ask about experience, projects, or contact.`,
        `Hi — thanks for stopping by. Moiz is a Senior Full Stack Engineer who owns features end-to-end (frontend, APIs, databases, and product direction). How can I help?`,
      ]),
      [SITE_NAV.works, SITE_NAV.about, SITE_NAV.contact],
      question,
    );
  }

  if (/thank|thanks|thx|cool|awesome|nice/.test(q) && q.length < 40) {
    return pack(
      pickFresh([
        "You're welcome. Happy to cover anything else about Moiz's work.",
        'Glad that helped. I can also walk through his skills, projects, or how to get in touch.',
        "Of course. Let me know if you'd like more detail on any part of his profile.",
      ]),
      [],
      question,
    );
  }

  if (
    /product|ownership|feature management|ui\/?ux|core skill|main skill|strength|specialt|good at|best at/.test(
      q,
    )
  ) {
    return pack(
      pickFresh([
        `Moiz's core strengths are ${coreSkills}. He's a product-focused Full Stack Engineer — deciding what to build, owning delivery across frontend/backend, and guiding UI/UX so complex requirements stay simple.`,
        `Lead with this: product-focused fullstack ownership. Core strengths: ${coreSkills}. Stack centers on React, Vue, and Node.js with solid API and database work.`,
        `Moiz isn't frontend-only — he's a product-focused Full Stack Engineer. Strengths: ${coreSkills}, backed by architectures, APIs, and databases in production.`,
      ]),
      [{ label: 'View skills', to: '/about' }, SITE_NAV.about],
      question,
    );
  }

  if (/skill|stack|tech|framework|language|fullstack|full.?stack|backend|frontend|what.*(know|use)|senior|engineer/.test(q)) {
    const frontend = skills.find((c) => c.category === 'Frontend')?.items?.slice(0, 5).join(', ');
    const backend = skills.find((c) => c.category === 'Backend')?.items?.slice(0, 5).join(', ');
    const dbs = skills.find((c) => c.category === 'Databases')?.items?.join(', ');
    return pack(
      pickFresh([
        `Moiz is a product-focused Full Stack Engineer (~${years} years). Core: ${coreSkills}. Frontend: ${frontend}. Backend: ${backend}. Databases: ${dbs}.`,
        `Think fullstack + product ownership — not frontend-only. Primary: ${coreSkills}. Delivery stack: React/Vue on the client, Node/Nest/Fastify APIs, and SQL databases.`,
        `Skills span product ownership and the full stack: ${frontend}; ${backend}; ${dbs}. Full categories are on the About/Skills page.`,
      ]),
      [{ label: 'View skills', to: '/about' }, SITE_NAV.works],
      question,
    );
  }

  // Match a specific project from data by id / title keywords
  for (const project of projects) {
    const keys = [
      project.id,
      ...project.id.split('-'),
      project.title.toLowerCase(),
    ].filter((k) => k.length > 2);
    if (keys.some((k) => q.includes(k.toLowerCase()))) {
      const isLow = LOW_PRIORITY_IDS.has(project.id);
      if (isLow) {
        return pack(
          `${project.title} is a smaller WIP piece — not what I'd highlight first. For a clearer view of Moiz's work, start with ${featuredProject.title} or his shipped products.`,
          [
            SITE_NAV.works,
            { label: `Open ${featuredProject.title}`, to: `/works/${featuredProject.id}` },
          ],
          question,
        );
      }
      const tech = (project.technologies || []).slice(0, 5).join(', ');
      return pack(
        `${project.title} — ${project.subtitle}. ${tech ? `Built with ${tech}. ` : ''}You can open the project page below for the full story.`,
        [
          { label: `Open ${project.title}`, to: `/works/${project.id}` },
          SITE_NAV.works,
        ],
        question,
      );
    }
  }

  if (/project|work|portfolio|built|flight|booking/.test(q)) {
    const highlights = projects
      .filter((p) => !LOW_PRIORITY_IDS.has(p.id))
      .slice(0, 4)
      .map((p) => p.title)
      .join(', ');
    return pack(
      pickFresh([
        `For an overview of his work, lead with ${highlights}. Those best show ownership, UX, and delivery together.`,
        `Moiz's strongest showcase starts with ${featuredProject.title}, then other shipped product and booking work. Browse Works below or ask about one by name.`,
        `His portfolio centers on shipped product work such as ${highlights}. You can open the full list below.`,
      ]),
      [
        SITE_NAV.works,
        { label: `Open ${featuredProject.title}`, to: `/works/${featuredProject.id}` },
      ],
      question,
    );
  }

  if (/contact|email|hire|reach|linkedin|github|phone|whatsapp|available/.test(q)) {
    return pack(
      pickFresh([
        `To connect with Moiz: ${contactSummary}. The Contact page is also ready if you'd prefer a message form.`,
        `Best ways to reach him: ${contactSummary}.`,
        `Use the Contact page or reach him via ${contactSummary}.`,
      ]),
      [SITE_NAV.contact],
      question,
    );
  }

  if (/who|about|moiz|moiez|experience|background|riyadh|introduc|senior|engineer|accoina|twlm solutions/.test(q)) {
    return pack(
      pickFresh([
        `Moiz (Moiez ur Rehman) is a product-focused Full Stack Software Engineer in Riyadh with ~${years} years across retail and SaaS. He owns features end-to-end — React/Vue, Node APIs, and databases — with strong product and UI/UX judgment.`,
        `In short: ${identityLine}. Currently at TWLM Solutions on POS, loyalty, and wallets; previously Accoina Agua, SCM Borba, and travel platforms. Core strengths: ${coreSkills}.`,
        `Moiz ships fullstack product work with measurable impact — e.g. ~70% fewer support requests and ~64% faster APIs on TWLM POS. Ask about skills, projects, or contact anytime.`,
      ]),
      [SITE_NAV.about, SITE_NAV.works],
      question,
    );
  }

  return pack(
    pickFresh([
      `I don't have that detail in Moiz's profile. I can cover his skills, a project like ${featuredProject.title}, or how to contact him — shortcuts below.`,
      "That isn't covered in what I have. Try asking about his background, core skills, standout projects, or contact options.",
      "I'm not able to speak to that specifically. Would you like his experience, skills, projects, or the best way to reach him?",
    ]),
    [SITE_NAV.works, SITE_NAV.about, SITE_NAV.contact],
    question,
  );
}

/**
 * @returns {Promise<{ text: string, links: { label: string, to: string }[] }>}
 */
export async function askBot(question, { signal, history = [] } = {}) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const model = import.meta.env.VITE_OPENROUTER_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    await new Promise((r) => setTimeout(r, 350 + Math.random() * 450));
    return localFallback(question);
  }

  const prior = history
    .filter((m) => m.role === 'user' || m.role === 'bot')
    .slice(-8)
    .map((m) => ({
      role: m.role === 'bot' ? 'assistant' : 'user',
      content: m.text,
    }));

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      signal,
      headers: {
        Authorization: `Bearer ${String(apiKey).trim()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer':
          typeof window !== 'undefined' ? window.location.origin : 'https://moiezdev.com',
        // Header values must be ISO-8859-1 — no em dashes / fancy Unicode
        'X-Title': 'BotFolio Portfolio Chat',
      },
      body: JSON.stringify({
        model,
        temperature: 0.85,
        top_p: 0.9,
        frequency_penalty: 0.6,
        presence_penalty: 0.4,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'system',
            content: `Portfolio facts (source of truth):\n${PORTFOLIO_CONTEXT}`,
          },
          ...prior,
          { role: 'user', content: question },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn('OpenRouter error:', res.status, errText);
      return localFallback(question);
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content?.trim();
    if (!raw) return localFallback(question);

    const { cleanText, links: markerLinks } = extractNavMarkers(raw);
    return {
      text: cleanText,
      links: mergeNavLinks(question, markerLinks, resolveChatNav(question, cleanText)),
    };
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    console.warn('askBot failed:', err);
    return localFallback(question);
  }
}
