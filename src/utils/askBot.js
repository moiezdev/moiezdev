import { chatbot, contacts, projects, skills } from '../data';
import { BOT_NAME, PORTFOLIO_CONTEXT, SYSTEM_PROMPT, getProfileExperienceYears } from './buildPortfolioContext';
import { prepareBotReply } from './chatNav';

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
const featuredNav = `[[nav:/works/${featuredProject.id}|${featuredProject.title}]]`;

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

/** Prepare display text + inline nav/contact spans (no bottom chip row). */
function pack(text) {
  return prepareBotReply(text);
}

/**
 * Offline / no-key replies — inline nav links inside the message.
 */
function localFallback(question) {
  const q = question.toLowerCase().trim();

  if (/^(hi|hey|hello|yo|sup|good (morning|afternoon|evening))\b/.test(q)) {
    return pack(
      pickFresh([
        `Hello — I'm ${BOT_NAME}, Moiz's assistant. Moiz is a ${identityLine} with ~${years} years of experience. Core strengths: ${coreSkills}. Browse [[nav:/about|About Moiz]], [[nav:/works|All works]], or [[nav:/contact|Contact page]] anytime.`,
        `Welcome. Moiz is a product-focused Full Stack Engineer — React, Vue, Node.js across the stack, plus product ownership. See [[nav:/works|All works]] or [[nav:/about|About Moiz]].`,
        `Hi — thanks for stopping by. Moiz is a Senior Full Stack Engineer who owns features end-to-end. Ask anything, or open [[nav:/contact|Contact page]].`,
      ]),
    );
  }

  if (/thank|thanks|thx|cool|awesome|nice/.test(q) && q.length < 40) {
    return pack(
      pickFresh([
        "You're welcome. Happy to cover anything else about Moiz's work.",
        'Glad that helped. I can also walk through his skills, projects, or how to get in touch.',
        "Of course. Let me know if you'd like more detail on any part of his profile.",
      ]),
    );
  }

  if (
    /product|ownership|feature management|ui\/?ux|core skill|main skill|strength|specialt|good at|best at/.test(
      q,
    )
  ) {
    return pack(
      pickFresh([
        `Moiz's core strengths are ${coreSkills}. He's a product-focused Full Stack Engineer — deciding what to build, owning delivery across frontend/backend, and guiding UI/UX so complex requirements stay simple. More on [[nav:/about|About Moiz]].`,
        `Lead with this: product-focused fullstack ownership. Core strengths: ${coreSkills}. Stack centers on React, Vue, and Node.js — see [[nav:/about|About Moiz]].`,
        `Moiz isn't frontend-only — he's a product-focused Full Stack Engineer. Strengths: ${coreSkills}. Details on [[nav:/about|About Moiz]].`,
      ]),
    );
  }

  if (/skill|stack|tech|framework|language|fullstack|full.?stack|backend|frontend|what.*(know|use)|senior|engineer/.test(q)) {
    const frontend = skills.find((c) => c.category === 'Frontend')?.items?.slice(0, 5).join(', ');
    const backend = skills.find((c) => c.category === 'Backend')?.items?.slice(0, 5).join(', ');
    const dbs = skills.find((c) => c.category === 'Databases')?.items?.join(', ');
    return pack(
      pickFresh([
        `Moiz is a product-focused Full Stack Engineer (~${years} years). Core: ${coreSkills}. Frontend: ${frontend}. Backend: ${backend}. Databases: ${dbs}. Full list on [[nav:/about|About Moiz]].`,
        `Think fullstack + product ownership — not frontend-only. Primary: ${coreSkills}. Delivery stack: React/Vue, Node APIs, SQL — see [[nav:/about|About Moiz]] or [[nav:/works|All works]].`,
        `Skills span product ownership and the full stack: ${frontend}; ${backend}; ${dbs}. Browse [[nav:/about|About Moiz]].`,
      ]),
    );
  }

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
          `${project.title} is a smaller WIP piece — not what I'd highlight first. Start with ${featuredNav} or [[nav:/works|All works]].`,
        );
      }
      const blurb = (project.subtitle || '').split(/[.!?]/)[0]?.trim();
      return pack(
        `[[nav:/works/${project.id}|${project.title}]]${blurb ? ` — ${blurb}.` : '.'} Open it for the full story.`,
      );
    }
  }

  if (/project|work|portfolio|built|flight|booking/.test(q)) {
    const highlights = projects
      .filter((p) => !LOW_PRIORITY_IDS.has(p.id))
      .slice(0, 3)
      .map((p) => `[[nav:/works/${p.id}|${p.title}]]`)
      .join(', ');
    return pack(
      pickFresh([
        `Top picks: ${highlights}.`,
        `Start with ${featuredNav} — then see [[nav:/works|All works]].`,
        `His strongest shipped work includes ${highlights}.`,
      ]),
    );
  }

  if (/contact|email|hire|reach|linkedin|github|phone|whatsapp|available/.test(q)) {
    return pack(
      pickFresh([
        `To connect with Moiz: ${contactSummary}. Or use the [[nav:/contact|Contact page]] message form.`,
        `Best ways to reach him: ${contactSummary}. Also on [[nav:/contact|Contact page]].`,
        `Reach him via ${contactSummary}, or open [[nav:/contact|Contact page]].`,
      ]),
    );
  }

  if (/who|about|moiz|moiez|experience|background|riyadh|introduc|senior|engineer|accoina|twlm solutions/.test(q)) {
    return pack(
      pickFresh([
        `Moiz (Moiez ur Rehman) is a product-focused Full Stack Software Engineer in Riyadh with ~${years} years across retail and SaaS. He owns features end-to-end — React/Vue, Node APIs, and databases. More on [[nav:/about|About Moiz]] or ${featuredNav}.`,
        `In short: ${identityLine}. Currently at TWLM Solutions on POS, loyalty, and wallets. See [[nav:/about|About Moiz]] and [[nav:/works|All works]].`,
        `Moiz ships fullstack product work with measurable impact — e.g. ~70% fewer support requests on ${featuredNav}. Ask about skills, projects, or [[nav:/contact|Contact page]] anytime.`,
      ]),
    );
  }

  return pack(
    pickFresh([
      `I don't have that detail in Moiz's profile. Try [[nav:/about|About Moiz]], ${featuredNav}, or [[nav:/contact|Contact page]].`,
      "That isn't covered in what I have. Ask about his background, core skills, standout projects, or contact options.",
      `I'm not able to speak to that specifically. Browse [[nav:/works|All works]] or [[nav:/about|About Moiz]].`,
    ]),
  );
}

/**
 * @returns {Promise<{ text: string, spans: { start: number, end: number, to: string, label: string }[] }>}
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

    const prepared = prepareBotReply(raw);
    if (!prepared.text) return localFallback(question);
    return prepared;
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    console.warn('askBot failed:', err);
    return localFallback(question);
  }
}
