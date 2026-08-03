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

/** Prefer younger/male English voices. macOS "Junior" is the classic boy voice. */
const BOY_VOICE_RE = /\b(junior|boy)\b/i;
const MALE_VOICE_RE =
  /\b(male|david|daniel|alex|fred|bruce|tom|nathan|mark|guy|james|oliver|rishi|aaron|albert|ralph|jorge|diego|thomas|arthur|google us english male|microsoft david|microsoft mark|microsoft guy)\b/i;
const FEMALE_VOICE_RE =
  /\b(female|samantha|victoria|karen|moira|fiona|tessa|zira|susan|kathy|princess|salli|joanna|ivy|kimberly|kendra|amy|emma|google uk english female|microsoft zira|google us english female)\b/i;

function scoreBoyVoice(v) {
  const name = v.name || '';
  const lang = v.lang || '';
  if (!/^en/i.test(lang)) return -100;
  if (FEMALE_VOICE_RE.test(name) && !MALE_VOICE_RE.test(name)) return -80;

  let score = 0;
  if (BOY_VOICE_RE.test(name)) score += 60; // Junior / boy
  if (/\bfred\b/i.test(name)) score += 45; // young-sounding Mac male
  if (/\balbert\b/i.test(name)) score += 40;
  if (MALE_VOICE_RE.test(name)) score += 30;
  if (/\bmale\b/i.test(name)) score += 25;
  if (/en(-|_)US/i.test(lang)) score += 8;
  if (/en(-|_)GB/i.test(lang)) score += 5;
  if (v.localService) score += 4;
  return score;
}

/**
 * Pick a boy/male English voice + pitch settings.
 * @returns {{ voice: SpeechSynthesisVoice | null, pitch: number, rate: number }}
 */
function pickBoyVoice() {
  const voices = window.speechSynthesis.getVoices?.() || [];
  if (!voices.length) {
    return { voice: null, pitch: 0.85, rate: 1.05 };
  }

  const ranked = [...voices].sort((a, b) => scoreBoyVoice(b) - scoreBoyVoice(a));
  const best = ranked[0];
  const bestScore = best ? scoreBoyVoice(best) : -100;

  if (best && bestScore >= 40) {
    // True boy / young male voice
    return {
      voice: best,
      pitch: BOY_VOICE_RE.test(best.name) ? 1.08 : 1.0,
      rate: 1.05,
    };
  }

  if (best && bestScore > 0) {
    // Adult male — slight lift so it reads younger
    return { voice: best, pitch: 1.06, rate: 1.04 };
  }

  const nonFemale =
    voices.find((v) => /^en/i.test(v.lang) && !FEMALE_VOICE_RE.test(v.name)) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    null;

  // No male pack available — drop pitch to masculinize the default voice
  return { voice: nonFemale, pitch: 0.78, rate: 1.02 };
}

/**
 * Speak text aloud. Cancels any current utterance first.
 * Uses a boy / male English voice when the browser provides one.
 * @returns {Promise<void>}
 */
export function speak(text, { onStart, onEnd } = {}) {
  return new Promise((resolve) => {
    if (!canSpeak()) {
      resolve();
      return;
    }

    const cleaned = cleanForSpeech(text);
    if (!cleaned) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const start = () => {
      const { voice, pitch, rate } = pickBoyVoice();
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

    // Voices often load async in Chrome
    if ((window.speechSynthesis.getVoices() || []).length === 0) {
      const onVoices = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
        start();
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoices);
      // Fallback if event never fires
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
 * Call stop()/abort() when the user (or silence timer) finishes.
 * Chrome often ends sessions on silence; we auto-restart until stop/abort.
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
    // Keep listening through brief pauses (Chrome ends the session early)
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
    // "no-speech" / "aborted" are normal — don't tear down unless intentional
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
