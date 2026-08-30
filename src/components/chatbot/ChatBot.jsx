import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { HiMicrophone, HiStop, HiVolumeOff, HiVolumeUp, HiX } from 'react-icons/hi';
import RobotAvatar from './RobotAvatar';
import TypewriterText from './TypewriterText';
import Button from '../ui/Button';
import { askBot } from '../../utils/askBot';
import { BOT_HANDLE, BOT_NAME } from '../../utils/buildPortfolioContext';
import { prepareBotReply } from '../../utils/chatNav';
import {
  canListen,
  canSpeak,
  createSpeechListener,
  speak,
  stopSpeaking,
  unlockSpeech,
} from '../../utils/speech';

const SUGGESTIONS = ['Show projects', 'Experience', 'Tech stack'];
const VOICE_PREF_KEY = 'botfolio-voice';

const WELCOME = {
  id: 'welcome',
  role: 'bot',
  ...prepareBotReply(
    `Hey — I'm ${BOT_NAME}. I'll walk you through Moiz's work as a Full Stack Engineer. You can explore [[nav:/works|All works]], [[nav:/experience|Experience]], or [[nav:/about|About Moiz]].`
  ),
  typed: true,
};

const ChatBot = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([WELCOME]);
  const [loading, setLoading] = useState(false);
  const [typingId, setTypingId] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(() => {
    try {
      const saved = localStorage.getItem(VOICE_PREF_KEY);
      return saved == null ? true : saved === '1';
    } catch {
      return true;
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
        transformOrigin: '100% 100%',
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

    gsap.to(panel, {
      opacity: 0,
      y: 20,
      scale: 0.94,
      duration: 0.28,
      ease: 'power2.in',
      transformOrigin: '100% 100%',
      onComplete: () => {
        setOpen(false);
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

  const openChat = () => {
    unlockSpeech();
    const fab = fabRef.current;
    if (!fab) {
      setOpen(true);
      return;
    }

    gsap.to(fab, {
      scale: 0.7,
      opacity: 0,
      duration: 0.22,
      ease: 'power2.in',
      onComplete: () => setOpen(true),
    });
  };

  const closeChatRef = useRef(() => {});
  closeChatRef.current = closeChat;

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
        const fallback = prepareBotReply(
          "Sorry about that — something didn't go through. Try again, or open [[nav:/contact|Contact page]] to reach Moiz directly."
        );
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

  return (
    <div
      ref={rootRef}
      className={`fixed bottom-1 max-h-full sm:bottom-5 right-5 z-50 flex flex-col items-end gap-0`}
    >
      {open && (
        <div
          ref={panelRef}
          className="w-[min(100vw-2.5rem,380px)] max-h-full h-[min(80vh,1000px)] flex flex-col border border-gray-a bg-gray-b origin-bottom-right"
          role="dialog"
          aria-label={`${BOT_NAME} portfolio chat`}
        >
          <div className="flex items-center gap-0.5 border-b border-gray-a px-3 py-3 bg-gray-b">
            <div className="shrink-0">
              <RobotAvatar size={55} faceOnly isOpen mood={avatarMood} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold leading-tight">
                <span className="text-primary">#</span>
                {BOT_HANDLE}
              </p>
              {listening && <p className="text-[10px] text-primary mt-0.5">listening…</p>}
              {!listening && avatarMood === 'thinking' && (
                <p className="text-[10px] text-gray-a mt-0.5">thinking…</p>
              )}
              {!listening && avatarMood === 'speaking' && (
                <p className="text-[10px] text-primary mt-0.5">speaking…</p>
              )}
            </div>
            {speechReady.speak && (
              <Button
                primary={voiceOn}
                onClick={() => {
                  unlockSpeech();
                  setVoiceOn((v) => !v);
                }}
                className="!px-2 !py-1 text-xs mr-1"
                aria-pressed={voiceOn}
                aria-label={voiceOn ? 'Mute voice' : 'Unmute voice'}
                title={voiceOn ? 'Voice on' : 'Voice muted'}
              >
                {voiceOn ? (
                  <HiVolumeUp className="w-3.5 h-3.5" aria-hidden />
                ) : (
                  <HiVolumeOff className="w-3.5 h-3.5" aria-hidden />
                )}
              </Button>
            )}
            <Button onClick={closeChat} className="!px-2 !py-1 text-xs" aria-label="Close chat">
              <HiX className="w-3.5 h-3.5" aria-hidden />
            </Button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            {messages.map((msg) => {
              const isTyping = msg.role === 'bot' && typingId === msg.id && !msg.typed;
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id ?? `${msg.role}-${msg.text.slice(0, 12)}`}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`relative max-w-[90%] px-3 py-2.5 text-sm leading-relaxed border bg-gray-b ${
                      isUser ? 'border-primary text-white' : 'border-gray-a text-gray-a'
                    }`}
                  >
                    {/* Speech hook — bottom-end (user) / bottom-start (bot) */}
                    <span
                      aria-hidden
                      className={`pointer-events-none absolute bottom-0 h-2.5 w-2.5 bg-gray-b ${
                        isUser
                          ? 'right-0 bottom-3 translate-x-[calc(50%+0.7px)] rotate-315 border-r border-b border-primary'
                          : 'left-0 bottom-3 -translate-x-[calc(50%+0.7px)] rotate-45 border-l border-b border-gray-a'
                      }`}
                    />

                    {msg.role === 'bot' && (
                      <p className="text-primary text-[10px] mb-1.5 tracking-wide">
                        <span className="bg-primary w-1.5 h-1.5 inline-block mr-1.5 mb-px align-middle" />
                        {BOT_HANDLE}
                      </p>
                    )}

                    {msg.role === 'bot' ? (
                      <TypewriterText
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
                <div className="relative max-w-[90%] px-3 py-2.5 text-sm leading-relaxed border border-gray-a bg-gray-b text-gray-a">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-0 h-2.5 w-2.5 bottom-3 -translate-x-[calc(50%+0.7px)] rotate-45 border-l border-b border-gray-a bg-gray-b"
                  />
                  <p className="text-primary text-[10px] mb-1.5 tracking-wide">
                    <span className="bg-primary w-1.5 h-1.5 inline-block mr-1.5 mb-px align-middle" />
                    {BOT_HANDLE}
                  </p>
                  <p className="inline-flex items-center gap-2 text-sm">
                    <span className="bg-primary w-2 h-2 animate-pulse shrink-0" />
                    <span className="text-xs">thinking…</span>
                  </p>
                </div>
              </div>
            )}

            {messages.length <= 1 && !busy && (
              <div className="pt-1">
                <p className="text-[10px] text-gray-a mb-2">
                  <span className="text-primary">#</span>try-asking
                </p>
                <div className="flex flex-col gap-[-1px]">
                  {SUGGESTIONS.map((s, idx) => (
                    <Button
                      key={s}
                      onClick={() => send(s)}
                      className={`!w-full !justify-start text-left text-xs !px-2.5 !py-2 rounded-none ${
                        idx > 0 ? 'mt-[-1px]' : ''
                      }`}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t border-gray-a">
            <div className="flex items-stretch">
              {speechReady.listen && (
                <Button
                  onClick={toggleListen}
                  disabled={busy}
                  primary={listening}
                  className={`!border-0 !rounded-none !px-3 !py-3 text-xs shrink-0 h-full ${
                    listening ? 'bg-primary/10' : ''
                  }`}
                  aria-pressed={listening}
                  aria-label={listening ? 'Done speaking — send' : 'Speak a question'}
                  title={listening ? 'Tap when finished' : 'Speak'}
                >
                  {listening ? (
                    <HiStop className="w-4 h-4 animate-pulse" aria-hidden />
                  ) : (
                    <HiMicrophone className="w-4 h-4" aria-hidden />
                  )}
                </Button>
              )}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  listening ? 'Keep talking — tap done when finished…' : 'Ask about Moiz…'
                }
                disabled={busy}
                className="flex-1 min-w-0 bg-transparent px-1 py-1 text-base text-white placeholder:text-gray-a/50 focus:outline-none disabled:opacity-50 cursor-scale-0"
              />
              <Button
                type="submit"
                primary
                disabled={busy || !input.trim()}
                className="!border-y-0 !border-r-0 !rounded-none !px-4 !py-3 text-sm shrink-0"
              >
                send ~~{'>'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {!open && (
        <Button
          ref={fabRef}
          onClick={openChat}
          className="!relative group !border-gray-a bg-gray-b !p-2 hover:!border-primary"
          aria-label={`Open ${BOT_NAME}`}
          aria-expanded={false}
        >
          <div className="absolute top-1.5 left-1.5 z-10">
            <span className="bg-primary w-2 h-2 block" aria-hidden />
          </div>
          <RobotAvatar size={52} isOpen={false} mood="idle" />
        </Button>
      )}
    </div>
  );
};

export default ChatBot;
