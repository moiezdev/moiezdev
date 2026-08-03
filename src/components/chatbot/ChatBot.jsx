import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import RobotAvatar from './RobotAvatar';
import TypewriterText from './TypewriterText';
import { askBot } from '../../utils/askBot';
import { BOT_HANDLE, BOT_NAME, getProfileExperienceYears } from '../../utils/buildPortfolioContext';
import { SITE_NAV } from '../../utils/chatNav';

const SUGGESTIONS = ['Who is Moiz?', 'What are his core strengths?', 'Show standout projects'];

const years = getProfileExperienceYears();

const WELCOME = {
  id: 'welcome',
  role: 'bot',
  text: `Hello — I'm ${BOT_NAME}, Moiz's assistant. Moiz is a product-focused Full Stack Software Engineer (React, Vue, Node.js) with ~${years} years building scalable systems across retail and SaaS. What would you like to know?`,
  links: [SITE_NAV.about, SITE_NAV.works, SITE_NAV.contact],
  typed: true, // welcome shows fully (no typewriter on first paint)
};

const ChatBot = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([WELCOME]);
  const [loading, setLoading] = useState(false);
  const [typingId, setTypingId] = useState(null);

  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const abortRef = useRef(null);
  const fabRef = useRef(null);
  const inputRef = useRef(null);
  const msgIdRef = useRef(1);

  const avatarMood = loading ? 'thinking' : typingId != null ? 'speaking' : 'idle';

  useEffect(() => {
    if (!fabRef.current) return;
    gsap.fromTo(
      fabRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.55, delay: 0.8, ease: 'back.out(1.7)' },
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
      },
    );
  }, [open]);

  const scrollToBottom = () => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, open, typingId]);

  const closeChat = () => {
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
            { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' },
          );
        });
      },
    });
  };

  const openChat = () => {
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

  const goTo = (to) => {
    navigate(to);
  };

  const finishTyping = (id) => {
    setTypingId((current) => (current === id ? null : current));
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, typed: true } : m)),
    );
  };

  const send = async (raw) => {
    const question = (raw ?? input).trim();
    if (!question || loading || typingId != null) return;

    setInput('');
    const nextMessages = [...messages, { role: 'user', text: question, id: `u-${msgIdRef.current++}` }];
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
      setMessages((prev) => [
        ...prev,
        {
          id,
          role: 'bot',
          text: reply.text,
          links: reply.links || [],
          typed: false,
        },
      ]);
      setTypingId(id);
    } catch (err) {
      if (err?.name !== 'AbortError') {
        const id = `b-${msgIdRef.current++}`;
        setMessages((prev) => [
          ...prev,
          {
            id,
            role: 'bot',
            text: "Sorry — that didn't go through. Please try again, or use the Contact page to reach Moiz directly.",
            links: [SITE_NAV.contact],
            typed: false,
          },
        ]);
        setTypingId(id);
      }
    } finally {
      setLoading(false);
    }
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
              {avatarMood === 'thinking' && (
                <p className="text-[10px] text-gray-a mt-0.5">thinking…</p>
              )}
              {avatarMood === 'speaking' && (
                <p className="text-[10px] text-primary mt-0.5">speaking…</p>
              )}
            </div>
            <button
              type="button"
              onClick={closeChat}
              className="border border-gray-a text-gray-a hover:border-primary hover:text-primary px-2 py-1 text-xs transition-colors cursor-scale-0"
              aria-label="Close chat"
            >
              close
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            {messages.map((msg) => {
              const isTyping = msg.role === 'bot' && typingId === msg.id && !msg.typed;

              return (
                <div
                  key={msg.id ?? `${msg.role}-${msg.text.slice(0, 12)}`}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] px-3 py-2.5 text-sm leading-relaxed border ${
                      msg.role === 'user' ? 'border-primary text-white' : 'border-gray-a text-gray-a'
                    }`}
                  >
                    {msg.role === 'bot' && (
                      <p className="text-primary text-[10px] mb-1.5 tracking-wide">
                        <span className="bg-primary w-1.5 h-1.5 inline-block mr-1.5 mb-px align-middle" />
                        {BOT_HANDLE}
                      </p>
                    )}

                    {msg.role === 'bot' ? (
                      <TypewriterText
                        text={msg.text}
                        active={isTyping}
                        onDone={() => finishTyping(msg.id)}
                        onProgress={scrollToBottom}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}

                    {msg.role === 'bot' && msg.typed && msg.links?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-gray-a">
                        {msg.links.map((link) => (
                          <button
                            key={link.to}
                            type="button"
                            onClick={() => goTo(link.to)}
                            className="text-[10px] leading-none border border-gray-a text-gray-a hover:border-primary hover:text-primary px-1.5 py-1 transition-colors cursor-scale-0"
                          >
                            {link.label} ~~{'>'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="border border-gray-a px-3 py-2.5 text-sm text-gray-a inline-flex items-center gap-2">
                  <span className="bg-primary w-2 h-2 animate-pulse" />
                  <span className="text-xs">thinking…</span>
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
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className={`text-left text-xs border border-gray-a text-gray-a hover:border-primary hover:text-primary px-2.5 py-2 transition-colors cursor-scale-0 ${
                        idx > 0 ? 'mt-[-1px]' : ''
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t border-gray-a">
            <div className="flex">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Moiz…"
                disabled={busy}
                className="flex-1 min-w-0 bg-transparent px-3 py-3 text-base text-white placeholder:text-gray-a/50 focus:outline-none disabled:opacity-50 cursor-scale-0"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="border-l border-primary text-primary px-4 py-3 text-sm hover:bg-primary/10 disabled:opacity-40 transition-colors cursor-scale-0 shrink-0"
              >
                send ~~{'>'}
              </button>
            </div>
          </form>
        </div>
      )}

      {!open && (
        <button
          ref={fabRef}
          type="button"
          onClick={openChat}
          className="relative group border border-gray-a bg-gray-b p-2 hover:border-primary transition-colors cursor-scale-0"
          aria-label={`Open ${BOT_NAME}`}
          aria-expanded={false}
        >
          <div className="absolute top-1.5 left-1.5 z-10">
            <span className="bg-primary w-2 h-2 block" aria-hidden />
          </div>
          <RobotAvatar size={52} isOpen={false} mood="idle" />
          <span className="pointer-events-none absolute right-full mr-0 top-1/2 -translate-y-1/2 whitespace-nowrap border border-gray-a border-r-0 bg-gray-b px-2.5 py-1.5 text-xs text-gray-a opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5">
            <span className="bg-primary w-2 h-2 shrink-0" aria-hidden />#{BOT_HANDLE}
          </span>
        </button>
      )}
    </div>
  );
};

export default ChatBot;
