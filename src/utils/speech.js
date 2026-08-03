/** Free browser TTS + mic. Kept simple for mobile Safari/Chrome. */

/** Kept alive so iOS doesn't GC the utterance mid-speech. */
let currentUtterance = null;
let resumeTimer = null;
let unlocked = false;

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function canListen() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/** Call from a click/touch handler before any await — unlocks mobile TTS. */
export function unlockSpeech() {
  if (!canSpeak() || unlocked) return;
  try {
    const warm = new SpeechSynthesisUtterance(' ');
    warm.volume = 0;
    window.speechSynthesis.speak(warm);
    window.speechSynthesis.cancel();
    unlocked = true;
  } catch {
    /* ignore */
  }
}

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

/** Prefer a normal English male system voice. */
const MALE_RE =
  /\b(male|david|daniel|alex|mark|guy|james|tom|aaron|oliver|arthur|microsoft david|microsoft mark|microsoft guy|google us english male)\b/i;
const FEMALE_RE =
  /\b(female|samantha|victoria|karen|moira|fiona|tessa|zira|susan|amy|emma|salli|joanna)\b/i;

function pickMaleVoice() {
  const voices = window.speechSynthesis.getVoices?.() || [];
  if (!voices.length) return null;

  const english = voices.filter((v) => /^en/i.test(v.lang));
  return (
    english.find((v) => /^en-US/i.test(v.lang) && MALE_RE.test(v.name)) ||
    english.find((v) => MALE_RE.test(v.name)) ||
    english.find((v) => /^en-US/i.test(v.lang) && !FEMALE_RE.test(v.name)) ||
    english.find((v) => !FEMALE_RE.test(v.name)) ||
    english.find((v) => /^en-US/i.test(v.lang)) ||
    english[0] ||
    null
  );
}

/** Split long replies — iOS often fails on one huge utterance. */
function chunkText(text) {
  const parts = text.match(/[^.!?]+[.!?]+[\s]?|[^.!?]+$/g) || [text];
  const chunks = [];
  let buf = '';
  for (const part of parts) {
    if ((buf + part).length > 160) {
      if (buf) chunks.push(buf.trim());
      buf = part;
    } else {
      buf += part;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.length ? chunks : [text];
}

function clearResumeTimer() {
  if (resumeTimer) {
    clearInterval(resumeTimer);
    resumeTimer = null;
  }
}

/**
 * Speak with a normal male browser voice.
 * Starts as soon as the reply text is ready.
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

    // Cancel any prior speech without lingering in a paused/broken state
    clearResumeTimer();
    currentUtterance = null;
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }

    const chunks = chunkText(cleaned);
    let index = 0;
    let started = false;
    const voice = pickMaleVoice();

    const finish = () => {
      clearResumeTimer();
      currentUtterance = null;
      onEnd?.();
      resolve();
    };

    const kick = () => {
      try {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        else {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      } catch {
        /* ignore */
      }
    };

    const speakNext = () => {
      if (index >= chunks.length) {
        finish();
        return;
      }

      const u = new SpeechSynthesisUtterance(chunks[index]);
      currentUtterance = u;
      u.lang = voice?.lang || 'en-US';
      u.rate = 1;
      u.pitch = 1;
      u.volume = 1;
      if (voice) u.voice = voice;

      u.onstart = () => {
        if (!started) {
          started = true;
          onStart?.();
        }
      };
      u.onend = () => {
        index += 1;
        speakNext();
      };
      u.onerror = () => finish();

      try {
        window.speechSynthesis.speak(u);
        // Mobile Chrome often queues speech but doesn't start — nudge immediately
        kick();
        window.setTimeout(kick, 40);
      } catch {
        finish();
      }
    };

    // Keep long replies from stalling mid-way on Android Chrome
    resumeTimer = window.setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearResumeTimer();
        return;
      }
      kick();
    }, 5000);

    // Start now (no artificial wait after getting the reply)
    speakNext();
  });
}

export function stopSpeaking() {
  clearResumeTimer();
  currentUtterance = null;
  if (canSpeak()) {
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
