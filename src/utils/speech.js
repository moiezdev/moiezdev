/** Browser Web Speech helpers (no API keys). Chrome/Edge best; Safari/iOS needs a user-gesture unlock. */

let speechUnlocked = false;
let resumeWatchdog = null;

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function canListen() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/** Soften punctuation so TTS sounds less robotic. */
export function cleanForSpeech(text) {
  return String(text || '')
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

/**
 * Must run inside a tap/click handler on iOS/Android or TTS stays silent.
 * Call on open chat, send, voice toggle, or mic.
 */
export function unlockSpeech() {
  if (!canSpeak()) return false;

  try {
    const synth = window.speechSynthesis;
    // Warm voices list (often empty until first interaction on mobile)
    synth.getVoices();

    const warm = new SpeechSynthesisUtterance(' ');
    warm.volume = 0;
    warm.rate = 1;
    warm.pitch = 1;
    synth.speak(warm);
    synth.cancel(); // clear the silent warm-up
    if (typeof synth.resume === 'function') synth.resume();

    speechUnlocked = true;
    return true;
  } catch {
    return false;
  }
}

export function isSpeechUnlocked() {
  return speechUnlocked;
}

/**
 * Closest free browser match to Antoni:
 * soft, friendly, approachable male — calm American / light male packs.
 */
const ANTONI_LIKE_RE =
  /\b(alex|aaron|tom|oliver|arthur|mark|guy|google us english male|microsoft mark|microsoft guy|microsoft david)\b/i;
const HARSH_OR_KID_RE = /\b(junior|fred|boy|zarvox|trinoids|bad news|good news|whisper|princess|kathy)\b/i;
const FEMALE_VOICE_RE =
  /\b(female|samantha|victoria|karen|moira|fiona|tessa|zira|susan|kathy|princess|salli|joanna|ivy|kimberly|kendra|amy|emma|google uk english female|microsoft zira|google us english female)\b/i;
const MALE_HINT_RE = /\bmale\b|alex|aaron|tom|daniel|david|mark|guy|oliver|arthur|james|thomas/i;

function scoreAntoniLike(v) {
  const name = v.name || '';
  const lang = v.lang || '';
  if (!/^en/i.test(lang)) return -100;
  if (FEMALE_VOICE_RE.test(name) && !MALE_HINT_RE.test(name)) return -80;
  if (HARSH_OR_KID_RE.test(name)) return -60;

  let score = 0;
  if (ANTONI_LIKE_RE.test(name)) score += 50;
  if (/\balex\b/i.test(name)) score += 25;
  if (MALE_HINT_RE.test(name)) score += 20;
  if (/\bmale\b/i.test(name)) score += 15;
  if (/en(-|_)US/i.test(lang)) score += 12;
  if (/en(-|_)GB/i.test(lang)) score += 3;
  if (v.localService) score += 8; // mobile prefers local packs
  return score;
}

function pickAntoniLikeVoice() {
  const voices = window.speechSynthesis.getVoices?.() || [];
  if (!voices.length) {
    return { voice: null, pitch: 0.95, rate: 0.96 };
  }

  const ranked = [...voices].sort((a, b) => scoreAntoniLike(b) - scoreAntoniLike(a));
  const best = ranked[0];
  const score = best ? scoreAntoniLike(best) : -100;

  if (best && score > 0) {
    return { voice: best, pitch: 0.95, rate: 0.96 };
  }

  const fallback =
    voices.find((v) => /^en(-|_)US/i.test(v.lang)) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    null;

  return { voice: fallback, pitch: 0.92, rate: 0.95 };
}

function clearResumeWatchdog() {
  if (resumeWatchdog) {
    window.clearInterval(resumeWatchdog);
    resumeWatchdog = null;
  }
}

/** iOS often pauses mid-utterance — keep nudging resume while speaking. */
function startResumeWatchdog() {
  clearResumeWatchdog();
  resumeWatchdog = window.setInterval(() => {
    const synth = window.speechSynthesis;
    if (!synth.speaking) {
      clearResumeWatchdog();
      return;
    }
    if (synth.paused) synth.resume();
  }, 220);
}

/** Mobile Safari truncates long utterances — speak sentence chunks. */
function splitForMobile(text) {
  const chunks = text.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [text];
  return chunks.map((c) => c.trim()).filter(Boolean);
}

function speakChunk(text, { voice, pitch, rate }) {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.pitch = pitch;
    u.lang = voice?.lang || 'en-US';
    if (voice) u.voice = voice;

    u.onend = () => resolve();
    u.onerror = () => resolve();

    window.speechSynthesis.speak(u);
    if (typeof window.speechSynthesis.resume === 'function') {
      window.speechSynthesis.resume();
    }
  });
}

/**
 * Speak with free browser TTS, tuned toward Antoni (soft / friendly male).
 * On mobile, call unlockSpeech() from a tap first (send / voice / open).
 * @returns {Promise<void>}
 */
export async function speak(text, { onStart, onEnd } = {}) {
  if (!canSpeak()) {
    onEnd?.();
    return;
  }

  const cleaned = cleanForSpeech(text);
  if (!cleaned) {
    onEnd?.();
    return;
  }

  // Best-effort unlock if somehow missed (may still fail on locked iOS)
  if (!speechUnlocked) unlockSpeech();

  window.speechSynthesis.cancel();
  clearResumeWatchdog();

  // Let cancel settle (critical on iOS)
  await new Promise((r) => window.setTimeout(r, 60));

  const waitForVoices = () =>
    new Promise((resolve) => {
      const existing = window.speechSynthesis.getVoices?.() || [];
      if (existing.length) {
        resolve();
        return;
      }
      const onVoices = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
        resolve();
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoices);
      window.setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
        resolve();
      }, 400);
    });

  await waitForVoices();

  const voiceOpts = pickAntoniLikeVoice();
  const chunks = splitForMobile(cleaned);

  onStart?.();
  startResumeWatchdog();

  try {
    for (const chunk of chunks) {
      // Stopped by user / new speak
      if (!window.speechSynthesis) break;
      await speakChunk(chunk, voiceOpts);
    }
  } finally {
    clearResumeWatchdog();
    onEnd?.();
  }
}

export function stopSpeaking() {
  clearResumeWatchdog();
  if (canSpeak()) window.speechSynthesis.cancel();
}

/**
 * Continuous speech listener — keeps the mic open across short pauses.
 * @returns {{ start: Function, stop: Function, abort: Function } | null}
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
