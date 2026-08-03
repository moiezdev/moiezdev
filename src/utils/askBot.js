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
        `Hey — welcome. I'm ${BOT_NAME}, Moiz's assistant. He's a product-focused Full Stack Engineer (~${years} years) — happy to walk you through [[nav:/about|About Moiz]], [[nav:/works|All works]], or [[nav:/contact|Contact page]].`,
        `Nice to meet you. Moiz builds end-to-end with React, Vue, and Node.js — ask me anything, or peek at ${featuredNav}.`,
        `Hi there. I'm here to help you explore Moiz's work — start with [[nav:/works|All works]] or [[nav:/about|About Moiz]] whenever you're ready.`,
      ]),
    );
  }

  if (/thank|thanks|thx|cool|awesome|nice/.test(q) && q.length < 40) {
    return pack(
      pickFresh([
        "You're very welcome — glad that helped. Want to look at another project or his skills next?",
        'Happy to help. I can also show his standout work or the best way to reach him.',
        'Anytime. Just say the word if you want more detail on anything.',
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
        `Moiz's strengths sit in product-focused ownership — ${coreSkills} — with balanced frontend and backend delivery. More on [[nav:/about|About Moiz]].`,
        `He's strongest where product judgment meets fullstack delivery: ${coreSkills}. Peek at [[nav:/about|About Moiz]] for the full picture.`,
        `Think product-minded Full Stack — not frontend-only. Core strengths: ${coreSkills}. Details live on [[nav:/about|About Moiz]].`,
      ]),
    );
  }

  if (/skill|stack|tech|framework|language|fullstack|full.?stack|backend|frontend|what.*(know|use)|senior|engineer/.test(q)) {
    const frontend = skills.find((c) => c.category === 'Frontend')?.items?.slice(0, 5).join(', ');
    const backend = skills.find((c) => c.category === 'Backend')?.items?.slice(0, 5).join(', ');
    const dbs = skills.find((c) => c.category === 'Databases')?.items?.join(', ');
    return pack(
      pickFresh([
        `Glad you asked — Moiz works across the stack (~${years} years): ${frontend}; ${backend}; ${dbs}. Full list on [[nav:/about|About Moiz]].`,
        `He's a product-focused Full Stack Engineer — React/Vue, Node APIs, and solid databases. Browse [[nav:/about|About Moiz]] or [[nav:/works|All works]].`,
        `Quick snapshot: ${coreSkills}, plus ${frontend} and ${backend}. More on [[nav:/about|About Moiz]].`,
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
          `Thanks for asking — ${project.title} is a smaller WIP, so I'd start with ${featuredNav} or [[nav:/works|All works]] instead.`,
        );
      }
      const blurb = (project.subtitle || '').split(/[.!?]/)[0]?.trim();
      return pack(
        `Sure — [[nav:/works/${project.id}|${project.title}]]${blurb ? `: ${blurb}.` : '.'} Tap the name for the full story.`,
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
        `Happy to share — standouts include ${highlights}.`,
        `A great place to start is ${featuredNav}; more is on [[nav:/works|All works]].`,
        `Here are a few highlights: ${highlights}.`,
      ]),
    );
  }

  if (/contact|email|hire|reach|linkedin|github|phone|whatsapp|available/.test(q)) {
    return pack(
      pickFresh([
        `Of course — you can reach Moiz at ${contactSummary}, or use the [[nav:/contact|Contact page]].`,
        `Sure thing. Best contacts: ${contactSummary}. The [[nav:/contact|Contact page]] works too.`,
        `Happy to help with that — ${contactSummary}, or open [[nav:/contact|Contact page]].`,
      ]),
    );
  }

  if (/who|about|moiz|moiez|experience|background|riyadh|introduc|senior|engineer|accoina|twlm solutions/.test(q)) {
    return pack(
      pickFresh([
        `Moiz is a product-focused Full Stack Engineer in Riyadh with ~${years} years across retail and SaaS — React/Vue, Node APIs, and databases. More on [[nav:/about|About Moiz]] or ${featuredNav}.`,
        `Glad you asked — ${identityLine}. He's currently at TWLM Solutions; see [[nav:/about|About Moiz]] and [[nav:/works|All works]].`,
        `In short, Moiz owns fullstack product work end-to-end — including impactful work on ${featuredNav}. Ask me anything, or visit [[nav:/contact|Contact page]].`,
      ]),
    );
  }

  return pack(
    pickFresh([
      `I don't have that detail handy — try [[nav:/about|About Moiz]], ${featuredNav}, or [[nav:/contact|Contact page]].`,
      "I'm not sure about that one, but I can help with his background, skills, projects, or contact info.",
      `Hmm, that isn't in what I know — [[nav:/works|All works]] or [[nav:/about|About Moiz]] are good next stops.`,
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
