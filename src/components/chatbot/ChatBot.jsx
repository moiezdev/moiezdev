import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { HiMicrophone, HiStop, HiVolumeOff, HiVolumeUp, HiX } from 'react-icons/hi';
import RobotAvatar from './RobotAvatar';
import MessageText from './MessageText';
import { askBot } from '../../utils/askBot';
import { BOT_HANDLE, BOT_NAME } from '../../utils/buildPortfolioContext';
import { prepareBotReply } from '../../utils/chatNav';
import { suggestFollowUps } from '../../utils/chatSuggestions';
import {
  canListen,
  canSpeak,
  createSpeechListener,
  speak,
  stopSpeaking,
  unlockSpeech,
} from '../../utils/speech';
import { t } from '../../i18n/content';
import { usePreferences } from '../../context/Preferences';
import { BOTFOLIO_OPEN_EVENT, takeBotfolioRequest } from '../../utils/botfolio';

const VOICE_PREF_KEY = 'botfolio-voice';

// the panel grows out of the launcher's corner: bottom-right, or bottom-left in RTL
const launcherCorner = () => (document.documentElement.dir === 'rtl' ? '0% 100%' : '100% 100%');

const welcomeMessage = (lang) => ({
  id: 'welcome',
  role: 'bot',
  ...prepareBotReply(t(lang, 'chat.welcome')),
  typed: true,
});

const CHAT_STORE_KEY = (lang) => `botfolio-chat-${lang}`;

/** Conversation survives refreshes for the browser session (per language). */
const loadChat = (lang) => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(CHAT_STORE_KEY(lang)) || 'null');
    if (Array.isArray(saved) && saved.length) return saved.map((m) => ({ ...m, typed: true }));
  } catch {
    /* ignore */
  }
  return [welcomeMessage(lang)];
};

const ChatBot = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { lang } = usePreferences();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => loadChat(lang));
  const [loading, setLoading] = useState(false);
  const [typingId, setTypingId] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(() => {
    try {
      const saved = localStorage.getItem(VOICE_PREF_KEY);
      // voice is opt-in: a portfolio shouldn't start talking in someone's office
      return saved === '1';
    } catch {
      return false;
    }
  });
  const [speechReady] = useState(() => ({
    speak: canSpeak(),
    listen: canListen(),
  }));

  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const abortRef = useRef(null);
  const fabRef = useRef(null);
  const inputRef = useRef(null);
  const msgIdRef = useRef(1);
  const listenerRef = useRef(null);
  const sendRef = useRef(() => {});
  const voiceOnRef = useRef(voiceOn);
  voiceOnRef.current = voiceOn;

  const avatarMood = loading
    ? 'thinking'
    : listening
      ? 'thinking'
      : typingId != null || speaking
        ? 'speaking'
        : 'idle';

  useEffect(() => {
    setMessages(loadChat(lang));
    setTypingId(null);
  }, [lang]);

  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_STORE_KEY(lang), JSON.stringify(messages.slice(-30)));
    } catch {
      /* ignore */
    }
  }, [messages, lang]);

  const resetChat = () => {
    abortRef.current?.abort();
    stopSpeaking();
    setSpeaking(false);
    setTypingId(null);
    setLoading(false);
    setMessages([welcomeMessage(lang)]);
  };

  useEffect(() => {
    try {
      localStorage.setItem(VOICE_PREF_KEY, voiceOn ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (!voiceOn) {
      stopSpeaking();
      setSpeaking(false);
    }
  }, [voiceOn]);

  useEffect(() => {
    if (!fabRef.current) return;
    gsap.fromTo(
      fabRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.55, delay: 0.8, ease: 'back.out(1.7)' }
    );
  }, []);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !open) return;

    gsap.fromTo(
      panel,
      { opacity: 0, y: 28, scale: 0.92 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.45,
        ease: 'power3.out',
        transformOrigin: launcherCorner(),
      }
    );
  }, [open]);

  const scrollToBottom = () => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, open, typingId]);

  const silenceTimerRef = useRef(null);
  const transcriptRef = useRef('');

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const stopListen = ({ send = false } = {}) => {
    clearSilenceTimer();
    const text = transcriptRef.current.trim();
    listenerRef.current?.stop();
    listenerRef.current = null;
    setListening(false);
    if (send && text) {
      window.setTimeout(() => sendRef.current(text), 60);
    }
  };

  const haltAudio = () => {
    stopSpeaking();
    setSpeaking(false);
    transcriptRef.current = '';
    stopListen({ send: false });
  };

  const closeChat = () => {
    haltAudio();
    const panel = panelRef.current;
    if (!panel) {
      setOpen(false);
      return;
    }

    // same reason as openChat: close even if the animation never finishes
    let closed = false;
    const finish = () => {
      if (closed) return;
      closed = true;
      setOpen(false);
    };
    window.setTimeout(finish, 400);
    gsap.to(panel, {
      opacity: 0,
      y: 20,
      scale: 0.94,
      duration: 0.28,
      ease: 'power2.in',
      transformOrigin: launcherCorner(),
      onComplete: () => {
        finish();
        requestAnimationFrame(() => {
          if (!fabRef.current) return;
          gsap.fromTo(
            fabRef.current,
            { scale: 0.6, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' }
          );
        });
      },
    });
  };

  // Open right away. Never gate state on an animation's onComplete: browsers pause
  // animation frames in background tabs and on throttled devices, which used to
  // leave the launcher hidden with no panel. The panel animates itself in.
  const openChat = () => {
    unlockSpeech();
    if (fabRef.current) gsap.killTweensOf(fabRef.current);
    setOpen(true);
  };

  const closeChatRef = useRef(() => {});
  closeChatRef.current = closeChat;
  const openChatRef = useRef(() => {});
  openChatRef.current = openChat;

  // "Ask BotFolio" buttons elsewhere on the site (see utils/botfolio)
  useEffect(() => {
    const onRequest = () => {
      const req = takeBotfolioRequest();
      if (!req) return;
      openChatRef.current();
      // a page asked a specific question ("Ask BotFolio about this project")
      if (req.question) window.setTimeout(() => sendRef.current?.(req.question), 120);
    };
    onRequest();
    window.addEventListener(BOTFOLIO_OPEN_EVENT, onRequest);
    return () => window.removeEventListener(BOTFOLIO_OPEN_EVENT, onRequest);
  }, []);

  // The launcher stays out of the way until the visitor scrolls: past the hero
  // on the home page, a little way down elsewhere.
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const update = () => {
      const hero = pathname === '/' ? document.querySelector('[data-hero]') : null;
      const threshold = hero
        ? hero.getBoundingClientRect().bottom + window.scrollY - window.innerHeight * 0.5
        : 200;
      setRevealed(window.scrollY > Math.max(threshold, 120));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (e) => {
      const root = rootRef.current;
      if (root && e.target instanceof Node && root.contains(e.target)) return;
      closeChatRef.current();
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open]);

  useEffect(() => () => haltAudio(), []);

  const goTo = (to) => {
    navigate(to);
  };

  const finishTyping = (id) => {
    setTypingId((current) => (current === id ? null : current));
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, typed: true } : m)));
  };

  const speakReply = (text) => {
    if (!voiceOnRef.current || !speechReady.speak) return;
    speak(text, {
      lang,
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
    });
  };

  const send = async (raw) => {
    const question = (raw ?? input).trim();
    if (!question || loading || typingId != null) return;

    // Must run inside the tap/click — unlocks TTS on iOS/Android
    unlockSpeech();

    stopListen({ send: false });
    stopSpeaking();
    setSpeaking(false);

    setInput('');
    const nextMessages = [
      ...messages,
      { role: 'user', text: question, id: `u-${msgIdRef.current++}` },
    ];
    setMessages(nextMessages);
    setLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const reply = await askBot(question, {
        signal: controller.signal,
        history: nextMessages.slice(0, -1),
        lang,
        path: pathname,
      });
      const id = `b-${msgIdRef.current++}`;
      // Start audio first — don't wait on typewriter / React paint
      speakReply(reply.text);
      setMessages((prev) => [
        ...prev,
        {
          id,
          role: 'bot',
          text: reply.text,
          spans: reply.spans || [],
          typed: false,
        },
      ]);
      setTypingId(id);
    } catch (err) {
      if (err?.name !== 'AbortError') {
        const id = `b-${msgIdRef.current++}`;
        const fallback = prepareBotReply(t(lang, 'chat.fallback'));
        speakReply(fallback.text);
        setMessages((prev) => [
          ...prev,
          {
            id,
            role: 'bot',
            text: fallback.text,
            spans: fallback.spans,
            typed: false,
          },
        ]);
        setTypingId(id);
      }
    } finally {
      setLoading(false);
    }
  };

  sendRef.current = send;

  const toggleListen = () => {
    if (!speechReady.listen || loading || typingId != null) return;

    unlockSpeech();

    // Tap again to finish sentence and send
    if (listening) {
      stopListen({ send: true });
      return;
    }

    stopSpeaking();
    setSpeaking(false);
    transcriptRef.current = '';
    clearSilenceTimer();

    const SILENCE_MS = 2800; // wait this long after last speech before auto-send

    const listener = createSpeechListener({
      lang: lang === 'ar' ? 'ar-SA' : 'en-US',
      onStart: () => setListening(true),
      onEnd: () => {
        // Only clear UI if we intentionally stopped (listener null already)
        if (!listenerRef.current) setListening(false);
      },
      onError: () => {
        clearSilenceTimer();
        listenerRef.current = null;
        setListening(false);
      },
      onResult: ({ transcript }) => {
        if (!transcript) return;
        transcriptRef.current = transcript;
        setInput(transcript);

        // Reset silence window on every chunk — keeps mic open while you talk
        clearSilenceTimer();
        silenceTimerRef.current = window.setTimeout(() => {
          stopListen({ send: true });
        }, SILENCE_MS);
      },
    });

    if (!listener) return;
    listenerRef.current = listener;
    listener.start();
  };

  const onSubmit = (e) => {
    e.preventDefault();
    send();
  };

  const busy = loading || typingId != null;
  const suggestions = suggestFollowUps({ path: pathname, messages, lang });
  const ICON_BTN =
    'inline-flex size-8 shrink-0 items-center justify-center rounded-full text-label-2 hover:text-label hover:bg-fill transition-colors cursor-pointer disabled:opacity-40';

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] end-3 sm:end-6 z-50 flex flex-col items-end max-h-[calc(100dvh-1.5rem-env(safe-area-inset-bottom))]"
    >
      {open && (
        <div
          ref={panelRef}
          className="pointer-events-auto w-[min(100vw-1.5rem,390px)] max-h-full h-[min(78vh,680px)] flex flex-col overflow-hidden rounded-[28px] glass ring-1 ring-separator shadow-[0_24px_64px_rgba(0,0,0,0.28)] origin-bottom-right rtl:origin-bottom-left"
          role="dialog"
          data-native-cursor
          aria-label={`${BOT_NAME} portfolio chat`}
        >
          <div className="flex items-center gap-2 border-b border-separator px-4 py-3">
            <div className="shrink-0 -my-1">
              <RobotAvatar size={48} faceOnly isOpen mood={avatarMood} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-label text-[15px] font-semibold leading-tight">{BOT_HANDLE}</p>
              <p className="text-[12px] text-label-2 mt-0.5 h-4">
                {listening
                  ? t(lang, 'chat.listening')
                  : avatarMood === 'thinking'
                    ? t(lang, 'chat.thinking')
                    : avatarMood === 'speaking'
                      ? t(lang, 'chat.speaking')
                      : ''}
              </p>
            </div>
            {speechReady.speak && (
              <button
                type="button"
                onClick={() => {
                  unlockSpeech();
                  setVoiceOn((v) => !v);
                }}
                className={`${ICON_BTN} ${voiceOn ? 'text-accent' : ''}`}
                aria-pressed={voiceOn}
                aria-label={voiceOn ? t(lang, 'a11y.mute') : t(lang, 'a11y.unmute')}
                title={voiceOn ? 'Voice on' : 'Voice muted'}
              >
                {voiceOn ? (
                  <HiVolumeUp className="w-4 h-4" aria-hidden />
                ) : (
                  <HiVolumeOff className="w-4 h-4" aria-hidden />
                )}
              </button>
            )}
            {messages.length > 1 && (
              <button
                type="button"
                onClick={resetChat}
                disabled={loading}
                className={ICON_BTN}
                aria-label={t(lang, 'chat.newChat')}
                title={t(lang, 'chat.newChat')}
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M14.5 3.5l2 2L9 13l-3 1 1-3 7.5-7.5zM16 11v4.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 3 15.5v-10A1.5 1.5 0 0 1 4.5 4H9" />
                </svg>
              </button>
            )}
            <button type="button" onClick={closeChat} className={ICON_BTN} aria-label={t(lang, 'a11y.closeChat')}>
              <HiX className="w-4 h-4" aria-hidden />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
            {messages.map((msg) => {
              const isTyping = msg.role === 'bot' && typingId === msg.id && !msg.typed;
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id ?? `${msg.role}-${msg.text.slice(0, 12)}`}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2 text-[15px] leading-[1.4] rounded-[20px] ${
                      isUser
                        ? 'bg-accent text-on-accent rounded-ee-md'
                        : 'bg-fill text-label rounded-es-md'
                    }`}
                  >
                    {msg.role === 'bot' ? (
                      <MessageText
                        text={msg.text}
                        spans={msg.spans || []}
                        onNavigate={goTo}
                        active={isTyping}
                        onDone={() => finishTyping(msg.id)}
                        onProgress={scrollToBottom}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-[20px] rounded-es-md bg-fill inline-flex items-center gap-1" aria-label={t(lang, 'chat.thinking')}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="size-2 rounded-full bg-label-3 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {!busy && suggestions.length > 0 && (
              <div className="pt-3">
                <p className="text-[12px] text-label-3 mb-2 px-1">{t(lang, 'chat.tryAsking')}</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full ring-1 ring-inset ring-accent/50 text-accent text-[13px] font-medium px-3.5 py-1.5 hover:bg-accent hover:text-on-accent transition-colors cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="p-3 border-t border-separator">
            <div className="flex items-center gap-1.5 rounded-full bg-surface ring-1 ring-separator ps-1.5 pe-1.5 py-1.5 focus-within:ring-accent transition-shadow">
              {speechReady.listen && (
                <button
                  type="button"
                  onClick={toggleListen}
                  disabled={busy}
                  className={`${ICON_BTN} ${listening ? 'text-label bg-fill' : ''}`}
                  aria-pressed={listening}
                  aria-label={listening ? t(lang, 'a11y.doneSpeaking') : t(lang, 'a11y.speak')}
                  title={listening ? 'Tap when finished' : 'Speak'}
                >
                  {listening ? (
                    <HiStop className="w-4 h-4 animate-pulse" aria-hidden />
                  ) : (
                    <HiMicrophone className="w-4 h-4" aria-hidden />
                  )}
                </button>
              )}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  listening ? t(lang, 'chat.placeholderListen') : t(lang, 'chat.placeholder')
                }
                disabled={busy}
                aria-label={t(lang, 'a11y.chatInput', { name: BOT_NAME })}
                className="flex-1 min-w-0 bg-transparent px-2 py-1 text-base text-label placeholder:text-label-3 focus:outline-none focus-visible:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent disabled:opacity-30 transition-opacity cursor-pointer"
                aria-label={t(lang, 'chat.send')}
              >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      {!open && (
        <div
          className={`botfolio-launcher transition-[opacity,translate,visibility] duration-(--dur-base) ease-(--ease-spring) ${
            revealed ? 'pointer-events-auto' : 'invisible opacity-0 translate-y-4'
          }`}
        >
          <button
            type="button"
            ref={fabRef}
            onClick={openChat}
            className="relative size-12 sm:size-16 rounded-full glass ring-1 ring-separator shadow-[0_12px_32px_rgba(0,0,0,0.2)] inline-flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-(--dur-base) cursor-pointer"
            aria-label={t(lang, 'a11y.openChat', { name: BOT_NAME })}
            aria-expanded={false}
          >
            <span className="absolute top-0.5 end-0.5 sm:top-1 sm:end-1 size-2.5 sm:size-3 rounded-full bg-green ring-2 ring-bg" aria-hidden />
            <span className="inline-flex scale-[0.74] sm:scale-100">
              <RobotAvatar size={46} isOpen={false} mood="idle" />
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
