/**
 * BotFolio's voice and mic.
 *
 * Speaking uses one natural neural voice from /api/tts (Azure AI Speech, the
 * same voice on every device and in both languages). If that isn't
 * configured or fails, it falls back to the device's own speech engine,
 * picking its most natural voice and keeping that one voice for the visit.
 */

/* ---------- shared state ---------- */

let session = 0; // bumps on every speak/stop: stale work checks it and bails out
let stopCurrent = null; // ends whatever is playing right now
let unlocked = false;

/** Kept alive so iOS doesn't GC the utterance mid-speech. */
let currentUtterance = null;
let resumeTimer = null;

export function canSpeak() {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window || typeof window.Audio === 'function';
}

export function canListen() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/* ---------- text: written reply → something that sounds natural aloud ---------- */

export function cleanForSpeech(text) {
  return String(text || '')
    .replace(/\[\[nav:[^|\]]*\|([^\]]*)\]\]/g, '$1') // keep a link's label
    .replace(/\[\[nav:[^\]]+\]\]/g, '')
    .replace(/<\s*br\s*\/?\s*>/gi, '. ')
    .replace(/<[^>]+>/g, '')
    .replace(/\(\s*mailto:[^)]+\)/gi, '')
    .replace(/\(\s*tel:[^)]+\)/gi, '')
    .replace(/\bmailto:/gi, '')
    .replace(/\btel:/gi, '')
    .replace(/~~>/g, '')
    .replace(/[—–]/g, ', ')
    .replace(/[#*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Phone numbers digit by digit, in small groups, the way people read them out. */
const sayPhone = (raw, lang) => {
  const digits = raw.replace(/\D/g, '');
  const groups = digits.match(/\d{1,3}/g) || [];
  const plus = raw.trim().startsWith('+') ? (lang === 'ar' ? '' : 'plus ') : '';
  return plus + groups.map((g) => g.split('').join(' ')).join(', ');
};

/** Reading-aloud fixes: approximations, abbreviations, slashes, phone numbers, names. */
export function speechText(text, lang = 'en') {
  const ar = String(lang).startsWith('ar');
  return cleanForSpeech(text)
    .replace(/\+?\d[\d\s-]{8,}\d/g, (m) => ` ${sayPhone(m, lang)} `)
    .replace(/(بنحو|نحو|حوالي)\s*[~≈]\s?(?=\d)/g, '$1 ')
    .replace(/[~≈]\s?(?=\d)/g, ar ? 'حوالي ' : 'about ')
    .replace(/\be\.g\.,?/gi, 'for example')
    .replace(/\bi\.e\.,?/gi, 'that is')
    .replace(/\betc\./gi, 'and so on')
    .replace(/\bvs\.?(?=\s)/gi, 'versus')
    // "Node.js/NestJS", "Apple/Google", "UI/UX" → "… and …" (URLs like moiez.dev/cv are lowercase and stay)
    .replace(/\b([A-Z][\w.+#-]*)\/([A-Z][\w.+#-]*)/g, ar ? '$1 و$2' : '$1 and $2')
    // say the name the way he does: "Mo-eez"
    .replace(/\bMoieez\b/g, 'Moeez')
    .replace(/\bBotFolio\b/g, 'Bot Folio')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?،؟])/g, '$1')
    .trim();
}

/** Sentence-sized pieces; the first is short so speech starts fast. */
function chunkText(text, { first = 200, rest = 600 } = {}) {
  const parts = text.match(/[^.!?؟]+[.!?؟]+["')\]]*\s*|[^.!?؟]+$/g) || [text];
  const chunks = [];
  let buf = '';
  for (const part of parts) {
    const limit = chunks.length ? rest : first;
    if (buf && (buf + part).length > limit) {
      chunks.push(buf.trim());
      buf = part;
    } else {
      buf += part;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.length ? chunks : [text];
}

/* ---------- unlocking audio on mobile ---------- */

let audioEl = null;
const audio = () => {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = 'auto';
  }
  return audioEl;
};

/** A 50 ms silent WAV, built in memory (no network) to unlock the audio element. */
function silentWav() {
  const rate = 8000;
  const samples = rate / 20;
  const buf = new ArrayBuffer(44 + samples);
  const v = new DataView(buf);
  const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + samples, true);
  str(8, 'WAVEfmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, rate, true);
  v.setUint32(28, rate, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  str(36, 'data');
  v.setUint32(40, samples, true);
  new Uint8Array(buf, 44).fill(128); // 8-bit silence
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

/** Call from a click/touch handler before any await — unlocks audio and TTS on iOS/Android. */
export function unlockSpeech() {
  if (unlocked || typeof window === 'undefined') return;
  unlocked = true;
  try {
    if (typeof window.Audio === 'function') {
      const a = audio();
      a.src = silentWav();
      a.play().catch(() => {});
    }
  } catch {
    /* ignore */
  }
  try {
    if ('speechSynthesis' in window) {
      const warm = new SpeechSynthesisUtterance(' ');
      warm.volume = 0;
      window.speechSynthesis.speak(warm);
      window.speechSynthesis.cancel();
    }
  } catch {
    /* ignore */
  }
}

/* ---------- cloud voice (/api/tts) ---------- */

// 'unknown' until the first request; 'off' when the server has no key (stays off for the visit)
let cloudState = 'unknown';
let cloudRetryAt = 0; // after a quota/upstream error, use the device voice for a while

const cloudUsable = () =>
  typeof fetch === 'function' && typeof window.Audio === 'function' && cloudState !== 'off' && Date.now() >= cloudRetryAt;

async function fetchChunk(text, lang, signal) {
  const r = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lang }),
    signal,
  });
  if (r.status === 503 || r.status === 404) {
    cloudState = 'off';
    throw new Error('tts_off');
  }
  if (!r.ok || !(r.headers.get('content-type') || '').includes('audio')) {
    cloudRetryAt = Date.now() + 5 * 60 * 1000;
    throw new Error(`tts_${r.status}`);
  }
  cloudState = 'ok';
  return URL.createObjectURL(await r.blob());
}

/** Plays one clip; resolves 'ended', 'error' or 'stopped'. */
function playClip(url) {
  return new Promise((resolve) => {
    const a = audio();
    let settled = false;
    const done = (how) => {
      if (settled) return;
      settled = true;
      a.onended = null;
      a.onerror = null;
      stopCurrent = null;
      resolve(how);
    };
    stopCurrent = () => {
      a.pause();
      done('stopped');
    };
    a.onended = () => done('ended');
    a.onerror = () => done('error');
    a.src = url;
    a.play().catch(() => done('error'));
  });
}

/**
 * Speaks `chunks` with the cloud voice, fetching the next chunk while the
 * current one plays. Returns how many chunks were spoken, or -1 if stopped.
 */
async function speakCloud(chunks, lang, id, onStart) {
  const controller = new AbortController();
  const urls = [];
  const fetches = [];
  const get = (i) => {
    if (!fetches[i]) {
      fetches[i] = fetchChunk(chunks[i], lang, controller.signal).then((u) => (urls[i] = u));
      fetches[i].catch(() => {}); // a prefetch nobody waits for yet must not go unhandled
    }
    return fetches[i];
  };
  const cleanup = () => {
    controller.abort();
    urls.forEach((u) => u && URL.revokeObjectURL(u));
  };

  let spoken = 0;
  try {
    for (let i = 0; i < chunks.length; i += 1) {
      const url = await get(i);
      if (id !== session) return -1;
      if (i + 1 < chunks.length) get(i + 1); // prefetch the next piece while this one plays
      if (i === 0) onStart?.();
      const how = await playClip(url);
      if (how === 'stopped' || id !== session) return -1;
      if (how === 'error') break;
      spoken += 1;
    }
  } catch {
    /* fall back below for whatever wasn't spoken */
  } finally {
    cleanup();
  }
  return spoken;
}

/* ---------- device voice (Web Speech API) fallback ---------- */

// macOS ships joke voices ("Zarvox", "Bad News"…); eSpeak sounds robotic
const NOVELTY =
  /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|fred|good news|hysterical|jester|junior|kathy|organ|pipe organ|ralph|superstar|trinoids|whisper|wobble|zarvox|espeak)\b/i;
const MALE = /\b(male|andrew|brian|guy|davis|tony|jason|christopher|eric|roger|steffan|ryan|thomas|daniel|aaron|arthur|oliver|hamed|shakir|fahed|majed|tarik)\b/i;

const chosen = {}; // one voice per language for the whole visit (one voice for both when multilingual)

function voiceScore(v, lang) {
  const name = v.name || '';
  if (NOVELTY.test(name)) return -1;
  const multi = /multilingual/i.test(name);
  const want = lang === 'ar' ? 'ar' : 'en';
  if (!multi && !String(v.lang || '').toLowerCase().startsWith(want)) return -1;
  let s = 0;
  if (multi) s += 60; // speaks both languages: the same voice everywhere
  if (/natural|neural|online/i.test(name)) s += 45; // Edge's neural voices
  if (/premium|enhanced|siri/i.test(name)) s += 40; // Apple's high-quality voices
  if (/^google/i.test(name)) s += 30; // Chrome's network voices
  if (!v.localService) s += 5;
  if (MALE.test(name)) s += 8; // match the cloud voice (male) where possible
  if (want === 'en' && /^en-US/i.test(v.lang)) s += 4;
  if (want === 'ar' && /^ar-SA/i.test(v.lang)) s += 4;
  return s;
}

function pickVoice(lang) {
  const voices = window.speechSynthesis.getVoices?.() || [];
  if (!voices.length) return null;
  const key = lang === 'ar' ? 'ar' : 'en';
  if (chosen[key] && voices.includes(chosen[key])) return chosen[key];
  // a multilingual voice already chosen for the other language covers this one too
  const other = chosen[key === 'ar' ? 'en' : 'ar'];
  if (other && /multilingual/i.test(other.name) && voices.includes(other)) return (chosen[key] = other);
  const best = voices
    .map((v) => [voiceScore(v, key), v])
    .filter(([s]) => s >= 0)
    .sort((a, b) => b[0] - a[0])[0]?.[1];
  return best ? (chosen[key] = best) : null;
}

/** getVoices() is empty until the browser loads them; wait briefly once. */
function voicesReady() {
  const synth = window.speechSynthesis;
  if (synth.getVoices?.().length) return Promise.resolve();
  return new Promise((resolve) => {
    const t = window.setTimeout(resolve, 700);
    synth.addEventListener?.(
      'voiceschanged',
      () => {
        window.clearTimeout(t);
        resolve();
      },
      { once: true },
    );
  });
}

function clearResumeTimer() {
  if (resumeTimer) {
    clearInterval(resumeTimer);
    resumeTimer = null;
  }
}

async function speakDevice(chunks, lang, id, onStart) {
  if (!('speechSynthesis' in window) || !chunks.length) return;
  await voicesReady();
  if (id !== session) return;
  const synth = window.speechSynthesis;
  const voice = pickVoice(lang);

  const kick = () => {
    try {
      if (synth.paused) synth.resume();
      else {
        synth.pause();
        synth.resume();
      }
    } catch {
      /* ignore */
    }
  };

  await new Promise((resolve) => {
    let index = 0;
    let started = false;
    const finish = () => {
      clearResumeTimer();
      currentUtterance = null;
      stopCurrent = null;
      resolve();
    };
    stopCurrent = () => {
      try {
        synth.cancel();
      } catch {
        /* ignore */
      }
      finish();
    };

    const next = () => {
      if (id !== session || index >= chunks.length) {
        finish();
        return;
      }
      const u = new SpeechSynthesisUtterance(chunks[index]);
      currentUtterance = u;
      u.lang = voice?.lang && !/multilingual/i.test(voice.name) ? voice.lang : lang === 'ar' ? 'ar-SA' : 'en-US';
      if (voice) u.voice = voice;
      // conversational pace; most engines' default (1) sounds rushed on long answers
      u.rate = 0.97;
      u.pitch = 1;
      u.volume = 1;
      u.onstart = () => {
        if (!started) {
          started = true;
          onStart?.();
        }
      };
      u.onend = () => {
        index += 1;
        next();
      };
      u.onerror = () => finish();
      try {
        synth.speak(u);
        // Mobile Chrome often queues speech but doesn't start: nudge it
        kick();
        window.setTimeout(kick, 40);
      } catch {
        finish();
      }
    };

    // Keep long replies from stalling mid-way on Android Chrome
    resumeTimer = window.setInterval(() => {
      if (!synth.speaking) return;
      kick();
    }, 5000);

    next();
  });
}

/* ---------- public API ---------- */

/**
 * Speaks a reply: the natural cloud voice when available, else the device's
 * best voice. Calls onStart when sound begins and onEnd when it finishes or
 * is stopped.
 * @returns {Promise<void>}
 */
export async function speak(text, { onStart, onEnd, lang = 'en' } = {}) {
  stopSpeaking();
  const id = ++session;
  const ln = String(lang).startsWith('ar') ? 'ar' : 'en';
  const spoken = canSpeak() ? speechText(text, ln) : '';
  if (!spoken) {
    onEnd?.();
    return;
  }

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    onStart?.();
  };

  let remaining = chunkText(spoken);
  if (cloudUsable()) {
    const done = await speakCloud(remaining, ln, id, start);
    if (done === -1 || id !== session) {
      onEnd?.();
      return;
    }
    remaining = remaining.slice(done);
  }
  if (remaining.length && id === session) {
    // smaller pieces for device engines (iOS fails on one huge utterance)
    await speakDevice(chunkText(remaining.join(' '), { first: 160, rest: 160 }), ln, id, start);
  }
  if (id === session) onEnd?.();
}

export function stopSpeaking() {
  session += 1;
  const stop = stopCurrent;
  stopCurrent = null;
  stop?.();
  clearResumeTimer();
  // read + clear the retained utterance (kept so iOS doesn't GC it mid-speech)
  if (currentUtterance) currentUtterance = null;
  if (audioEl) {
    try {
      audioEl.pause();
    } catch {
      /* ignore */
    }
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
}

/**
 * Mic listener (desktop Chrome/Edge best; mobile support varies).
 */
export function createSpeechListener({
  onResult,
  onStart,
  onEnd,
  onError,
  lang = 'en-US',
  continuous = true,
} = {}) {
  if (!canListen()) return null;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SpeechRecognition();
  rec.lang = lang;
  rec.interimResults = true;
  rec.continuous = continuous;
  rec.maxAlternatives = 1;

  let intentionalStop = false;
  let active = false;
  let committed = '';

  rec.onstart = () => {
    active = true;
    onStart?.();
  };

  rec.onend = () => {
    active = false;
    if (!intentionalStop) {
      window.setTimeout(() => {
        if (intentionalStop) return;
        try {
          rec.start();
        } catch {
          onEnd?.();
        }
      }, 120);
      return;
    }
    onEnd?.();
  };

  rec.onerror = (e) => {
    const code = e?.error;
    if (code === 'no-speech' || code === 'aborted') return;
    if (code === 'network') {
      onError?.(e);
      return;
    }
    if (!intentionalStop && (code === 'audio-capture' || code === 'not-allowed')) {
      intentionalStop = true;
      onError?.(e);
    }
  };

  rec.onresult = (event) => {
    let interim = '';
    let newFinal = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const chunk = event.results[i][0]?.transcript || '';
      if (event.results[i].isFinal) newFinal += chunk;
      else interim += chunk;
    }
    if (newFinal) {
      committed = `${committed} ${newFinal}`.replace(/\s+/g, ' ').trim();
    }
    onResult?.({
      interim: interim.trim(),
      final: newFinal.trim(),
      committed,
      transcript: `${committed} ${interim}`.replace(/\s+/g, ' ').trim(),
    });
  };

  return {
    start: () => {
      intentionalStop = false;
      committed = '';
      try {
        rec.start();
      } catch {
        /* already started */
      }
    },
    stop: () => {
      intentionalStop = true;
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      if (!active) onEnd?.();
    },
    abort: () => {
      intentionalStop = true;
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
      if (!active) onEnd?.();
    },
    getCommitted: () => committed,
  };
}
