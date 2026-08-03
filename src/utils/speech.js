/** Browser Web Speech helpers (no API keys). Chrome/Edge best; Safari partial; Firefox limited. */

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
  if (/\balex\b/i.test(name)) score += 25; // usually the softest natural US male on Mac
  if (MALE_HINT_RE.test(name)) score += 20;
  if (/\bmale\b/i.test(name)) score += 15;
  if (/en(-|_)US/i.test(lang)) score += 12; // Antoni is American
  if (/en(-|_)GB/i.test(lang)) score += 3;
  if (v.localService) score += 5;
  return score;
}

/** Soft, friendly male settings (Antoni-like, free browser TTS). */
function pickAntoniLikeVoice() {
  const voices = window.speechSynthesis.getVoices?.() || [];
  if (!voices.length) {
    return { voice: null, pitch: 0.95, rate: 0.96 };
  }

  const ranked = [...voices].sort((a, b) => scoreAntoniLike(b) - scoreAntoniLike(a));
  const best = ranked[0];
  const score = best ? scoreAntoniLike(best) : -100;

  if (best && score > 0) {
    return {
      voice: best,
      // Slightly lower pitch + calm rate ≈ soft / approachable
      pitch: 0.95,
      rate: 0.96,
    };
  }

  const fallback =
    voices.find((v) => /^en(-|_)US/i.test(v.lang) && !FEMALE_VOICE_RE.test(v.name)) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    null;

  return { voice: fallback, pitch: 0.92, rate: 0.95 };
}

/**
 * Speak with free browser TTS, tuned toward Antoni (soft / friendly male).
 * @returns {Promise<void>}
 */
export function speak(text, { onStart, onEnd } = {}) {
  return new Promise((resolve) => {
    if (!canSpeak()) {
      onEnd?.();
      resolve();
      return;
    }

    const cleaned = cleanForSpeech(text);
    if (!cleaned) {
      onEnd?.();
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const start = () => {
      const { voice, pitch, rate } = pickAntoniLikeVoice();
      const u = new SpeechSynthesisUtterance(cleaned);
      u.rate = rate;
      u.pitch = pitch;
      u.lang = voice?.lang || 'en-US';
      if (voice) u.voice = voice;

      u.onstart = () => onStart?.();
      u.onend = () => {
        onEnd?.();
        resolve();
      };
      u.onerror = () => {
        onEnd?.();
        resolve();
      };

      window.speechSynthesis.speak(u);
    };

    if ((window.speechSynthesis.getVoices() || []).length === 0) {
      const onVoices = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
        start();
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoices);
      window.setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
        start();
      }, 250);
    } else {
      start();
    }
  });
}

export function stopSpeaking() {
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
